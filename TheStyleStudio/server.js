const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
// Node on this machine resolves DNS via 127.0.0.1, which refuses the Atlas SRV lookup
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const expressEjsLayouts = require("express-ejs-layouts");
const server = express();
const Product = require("./models/products.model");
const Category = require("./models/categories.model");
const Admin = require("./models/admin.model");
const Order = require("./models/order");

const session = require("express-session");
server.use(express.json());
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const MongoStore = require("connect-mongo");

// Without SESSION_SECRET a random one is used, which still works but logs everyone out on every restart
let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  console.warn("SESSION_SECRET is not set; using a random secret for this run.");
  sessionSecret = crypto.randomBytes(32).toString("hex");
}

server.use(
  session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: true,
    // Sessions (logins and carts) live in MongoDB, so they survive restarts and the free host sleeping
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60, // 14 days
      touchAfter: 24 * 60 * 60, // Only re-save an unchanged session once a day
    }),
    cookie: { secure: false, maxAge: 14 * 24 * 60 * 60 * 1000 },
  }),
);

const userRouter = require("./routes/user/user.controller");

server.set("view engine", "ejs");

var expressLayouts = require("express-ejs-layouts");
server.use(expressLayouts);

server.use(express.static("public"));
const path = require("path");
server.use(express.static(path.join(__dirname, "public")));
server.use(express.urlencoded({ extended: true }));

// Middleware for global cart count
server.use((req, res, next) => {
  if (!req.session.cart) req.session.cart = [];
  // Count every item, so 2 of the same product shows as 2
  res.locals.cartCount = req.session.cart.reduce((total, item) => total + Number(item.quantity), 0);
  res.locals.user = req.session.user || null; // Make user data available globally
  res.locals.currentPath = req.path; // Lets the navbar highlight the current category
  // "Added to your bag" toast, shown once on the page after adding to the cart
  res.locals.cartMessage = req.session.cartMessage || null;
  delete req.session.cartMessage;
  next();
});

const flashMiddleware = require("./middlewares/flashmessages");

// Use flashMiddleware for all routes
server.use(flashMiddleware);

// Every /admin page and action needs an admin login, except the login and demo sign-in pages
const adminAuth = require("./middlewares/admin-middleware");
server.use("/admin", (req, res, next) => {
  if (req.path === "/login" || req.path === "/demo") return next();
  res.locals.currentPath = req.originalUrl; // Highlights the active sidebar link
  res.locals.admin = req.session.admin || null;
  adminAuth(req, res, next);
});

const port = process.env.PORT || 5000; // Hosts like Render set PORT

server.get("/", async (req, res) => {
  try {
    // Fetch all categories from the database
    const categories = await Category.find();

    // Fetch products for each category
    const categoryProducts = await Promise.all(
      categories.map(async (category) => {
        // Fetch a limited number of products for each category (e.g., 4 products)
        const products = await Product.find({ category: category._id }).limit(
          4,
        );
        return {
          category: category.name,
          products: products,
        };
      }),
    );

    // Best sellers: products with the highest total quantity across all orders
    const topSold = await Order.aggregate([
      { $unwind: "$products" },
      { $group: { _id: "$products.productId", sold: { $sum: "$products.quantity" } } },
      { $sort: { sold: -1, _id: -1 } },
      { $limit: 12 },
    ]);
    const soldIds = topSold.map((entry) => entry._id);
    const soldProducts = await Product.find({ _id: { $in: soldIds } });
    // Keep the sales ranking and skip products that have since been deleted
    const bestSellers = soldIds
      .map((id) => soldProducts.find((product) => product._id.equals(id)))
      .filter(Boolean)
      .slice(0, 4);
    // Fill any remaining spots with the newest products
    if (bestSellers.length < 4) {
      const newest = await Product.find({
        _id: { $nin: bestSellers.map((product) => product._id) },
      })
        .sort({ _id: -1 })
        .limit(4 - bestSellers.length);
      bestSellers.push(...newest);
    }

    // Render the homepage with category and product data
    res.render("homepage.ejs", { categoryProducts, bestSellers });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

server.get("/admin", (req, res) => {
  res.redirect("/admin/dashboard");
});

const adminDashboardRouter = require("./routes/admin/dashboard.controller");
server.use(adminDashboardRouter);

//Admin login
server.get("/admin/login", async (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  res.render("admin/login", {
    layout: false,
    pageTitle: "Admin Login",
    demoAvailable: Boolean(await Admin.exists({ role: "demo" })), // Shows the "View demo" button
  });
});

// Signs visitors in as the read-only demo admin, no password needed. Link to /admin/demo from a portfolio.
server.get("/admin/demo", async (req, res) => {
  const demo = await Admin.findOne({ role: "demo" });
  if (!demo) {
    req.session.errorMessage = "The demo isn't available right now.";
    return res.redirect("/admin/login");
  }
  req.session.admin = { _id: demo._id.toString(), email: demo.email, role: "demo" };
  res.redirect("/admin/dashboard");
});

//Admin logout
server.post("/admin/logout", (req, res) => {
  delete req.session.admin;
  req.session.successMessage = "You have been logged out.";
  res.redirect("/admin/login");
});

//user login
server.get("/login", (req, res) => {
  res.render("login", {
    layout: false,
    pageTitle: "Admin Login",
  });
});

server.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    // Compare the entered password with the stored hashed password
    const isPasswordValid = admin && (await bcrypt.compare(password || "", admin.password));
    if (!isPasswordValid) {
      req.session.errorMessage = "Invalid email or password.";
      return res.redirect("/admin/login");
    }

    // If password is correct, store admin in session (never the password hash)
    req.session.admin = { _id: admin._id.toString(), email: admin.email, role: admin.role };
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

//adminProductsRouter to handle all the product-related routes
let adminProductsRouter = require("./routes/admin/products.controller");
server.use(adminProductsRouter);

//adminProductsRouter to handle all the category-related routes
let adminCategoriesProducts = require("./routes/admin/categories.controller");
server.use(adminCategoriesProducts);

server.use(userRouter);

const clothesRoute = require("./routes/user/user.products.controller");
server.use(clothesRoute);

const connectionString = process.env.MONGODB_URI;

mongoose
  .connect(connectionString)
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.log(error.message));

// Import the cart routes
const cartController = require("./routes/user/cart.controller");
// Use the cart routes
server.use(cartController);

// Import the orders routes
const orderController = require("./routes/admin/orders.controller");
// Use the orders routes
server.use(orderController);

// Import the user routes
const userController = require("./routes/admin/user.controller");
// Use the user routes
server.use(userController);

server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

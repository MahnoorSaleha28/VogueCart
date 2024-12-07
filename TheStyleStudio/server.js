const express = require('express');
const mongoose = require("mongoose");
const expressEjsLayouts = require('express-ejs-layouts');
const server = express();
const Product = require('./models/products.model');
const Category = require('./models/categories.model'); 

server.set("view engine", "ejs");

var expressLayouts = require("express-ejs-layouts");
server.use(expressLayouts);

server.use(express.static("public"));

server.use(express.urlencoded({ extended: true }));

const port = 5000;

server.get('/', async (req, res) => {
    try {
      // Fetch all products and populate the category field
      const products = await Product.find().populate('category');
  
      // Render homepage with products data
      res.render("homepage.ejs", { products });
    } catch (err) {
      console.error(err);
      res.status(500).send('Error fetching products');
    }
  });
  

server.get('/admin', (req, res) => {
    res.render("admin/dashboard", {
        layout: "adminlayout", 
        pageTitle: "Admin Dashboard"
    });
});

//adminProductsRouter to handle all the product-related routes
let adminProductsRouter = require("./routes/admin/products.controller");
server.use(adminProductsRouter);

//adminProductsRouter to handle all the category-related routes
let adminCategoriesProducts = require("./routes/admin/categories.controller");
server.use(adminCategoriesProducts);

const connectionString = "REMOVED_MONGODB_CREDENTIAL";
mongoose
  .connect(connectionString)
  .then(() => console.log("Connected to Mongo DB Server: " + connectionString))
  .catch((error) => console.log(error.message));

server.listen(port, () => {
    console.log("Server started at localhost:5000");
});

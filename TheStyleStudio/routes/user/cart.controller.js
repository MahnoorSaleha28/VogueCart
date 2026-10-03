const express = require("express");
const router = express.Router();
let Product = require("../../models/products.model");
const Order = require("../../models/order");

// Look up the products in the session cart and attach each one's quantity
async function getCartItems(cart) {
  const productsInCart = await Product.find({ _id: { $in: cart.map(item => item.productId) } });
  return productsInCart.map(product => {
    const cartItem = cart.find(item => item.productId.toString() === product._id.toString());
    return { ...product.toObject(), quantity: Number(cartItem.quantity) };
  });
}

function getCartTotal(items) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0);
}

// Route to add product to cart with quantity
router.post("/cart/add", async (req, res) => {
    const { productId } = req.body;
    const quantity = parseInt(req.body.quantity, 10) || 1;  // Default quantity to 1 if not provided

    if (!req.session.cart) {
      req.session.cart = [];
    }

    // Check if product is already in the cart
    const existingProduct = req.session.cart.find(item => item.productId.toString() === productId);
    if (existingProduct) {
      // If product exists, update the quantity
      existingProduct.quantity = Number(existingProduct.quantity) + quantity;
    } else {
      // If product doesn't exist, add it to the cart
      req.session.cart.push({ productId, quantity });
    }

    // Shown as a toast on the next page
    try {
      const product = await Product.findById(productId);
      req.session.cartMessage = product ? `${product.name} added to your bag` : "Added to your bag";
    } catch (err) {
      req.session.cartMessage = "Added to your bag";
    }

    res.redirect("back");
  });

// Route for the cart page
router.get("/cart", async (req, res) => {
    try {
      const cart = req.session.cart || [];
      const products = await getCartItems(cart);

      res.render("cart", {
        products,
        totalPrice: getCartTotal(products),
        cartCount: products.reduce((total, item) => total + item.quantity, 0),  // Count all items including quantity
        layout: "mainLayout",
      });
    } catch (err) {
      console.error("Error fetching cart products:", err);
      res.status(500).send("Error fetching cart products.");
    }
  });


  // Route to update the quantity of a product in the cart
router.post("/cart/update/:productId", (req, res) => {
    const { productId } = req.params;
    const quantity = parseInt(req.body.quantity, 10) || 0;

    if (quantity <= 0) {
      // Remove the product from the cart if quantity is 0 or less
      req.session.cart = req.session.cart.filter(item => item.productId.toString() !== productId);
    } else {
      // Update the quantity of the product in the cart
      const product = req.session.cart.find(item => item.productId.toString() === productId);
      if (product) {
        product.quantity = quantity;
      }
    }

    res.redirect("/cart");
  });

  // Route to remove a product from the cart
router.post("/cart/remove/:productId", (req, res) => {
  const { productId } = req.params;

  if (!req.session.cart) {
      req.session.cart = [];
  }

  // Remove the product from the cart
  req.session.cart = req.session.cart.filter(item => item.productId.toString() !== productId);

  res.redirect("/cart"); // Redirect back to the cart page
});

// Route for checkout page
router.get("/checkout", async (req, res) => {
  try {
      const products = await getCartItems(req.session.cart || []);

      // Nothing to check out
      if (products.length === 0) {
        return res.redirect("/cart");
      }

      res.render("checkout", {
          products,
          totalPrice: getCartTotal(products),
          layout: "mainLayout",
      });
  } catch (err) {
      console.error("Error fetching cart products:", err);
      res.status(500).send("Error fetching cart products.");
  }
});


// Builds the stored payment fields from what the checkout form sends.
// This is a simulation: the full card number never reaches the server, only its brand and last 4 digits.
function getPayment(body) {
  const { paymentMethod, cardBrand, cardLast4, walletProvider, walletLast4 } = body;

  if (paymentMethod === "cod") {
    return { paymentMethod, paymentStatus: "Pay on delivery", paymentDetails: "Cash on delivery" };
  }
  if (paymentMethod === "card" && /^\d{4}$/.test(cardLast4 || "")) {
    const brand = ["Visa", "Mastercard", "American Express", "UnionPay"].includes(cardBrand) ? cardBrand : "Card";
    return { paymentMethod, paymentStatus: "Paid", paymentDetails: `${brand} •••• ${cardLast4}` };
  }
  if (paymentMethod === "wallet" && ["JazzCash", "Easypaisa"].includes(walletProvider) && /^\d{4}$/.test(walletLast4 || "")) {
    return { paymentMethod, paymentStatus: "Paid", paymentDetails: `${walletProvider} •••• ${walletLast4}` };
  }
  return null;
}

// Route to handle checkout submission
router.post("/checkout", async (req, res) => {
    const name = (req.body.name || "").trim();
    const street = (req.body.street || "").trim();
    const city = (req.body.city || "").trim();
    const phone = (req.body.phone || "").trim();

    if (!name || !street || !city || !phone) {
      return res.status(400).json({ success: false, message: "Please fill in all fields." });
    }

    const payment = getPayment(req.body);
    if (!payment) {
      return res.status(400).json({ success: false, message: "Please choose a valid payment method." });
    }

    try {
      const products = await getCartItems(req.session.cart || []);
      if (products.length === 0) {
        return res.status(400).json({ success: false, message: "Your bag is empty." });
      }

      const newOrder = new Order({
        name,
        address: `${street}, ${city}`,
        phone,
        products: products.map(product => ({ productId: product._id, quantity: product.quantity })),
        totalPrice: getCartTotal(products),  // Calculated here so the browser can't change it
        ...payment,
      });

      await newOrder.save();
      req.session.cart = [];  // Clear the cart
      req.session.lastOrderId = newOrder._id.toString();  // Lets this visitor see their confirmation page
      res.status(200).json({ success: true, redirect: "/order-confirmation" });
    } catch (err) {
      console.error("Error processing the order:", err);
      res.status(500).json({ success: false, message: "Error processing the order. Please try again." });
    }
  });

// Route for the order confirmation page, only for the order this visitor just placed
router.get("/order-confirmation", async (req, res) => {
  try {
    if (!req.session.lastOrderId) {
      return res.redirect("/");
    }

    const order = await Order.findById(req.session.lastOrderId).populate("products.productId");
    if (!order) {
      return res.redirect("/");
    }

    res.render("orderConfirmation", {
      order,
      items: order.products.filter(item => item.productId),  // Skip products deleted since the order
      layout: "mainLayout",
    });
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).send("Error fetching order.");
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
let Product = require("../../models/products.model");
const Order = require("../../models/order");

// Route to add product to cart with quantity
router.post("/cart/add", (req, res) => {
    const { productId, quantity = 1 } = req.body;  // Default quantity to 1 if not provided
  
    if (!req.session.cart) {
      req.session.cart = [];
    }
  
    // Check if product is already in the cart
    const existingProduct = req.session.cart.find(item => item.productId.toString() === productId);
    if (existingProduct) {
      // If product exists, update the quantity
      existingProduct.quantity += quantity;
    } else {
      // If product doesn't exist, add it to the cart
      req.session.cart.push({ productId, quantity });
    }
  
    res.redirect("back");
  });

// Route for the cart page
router.get("/cart", async (req, res) => {
    try {
      const cartProductIds = req.session.cart || [];
      const productIds = cartProductIds.map(item => item.productId);  // Extract productIds
      const productsInCart = await Product.find({ _id: { $in: productIds } });
  
      // Attach the quantity to each product
      const productsWithQuantity = productsInCart.map(product => {
        const cartItem = cartProductIds.find(item => item.productId.toString() === product._id.toString());
        return { ...product.toObject(), quantity: cartItem.quantity };
      });
  
      res.render("cart", {
        products: productsWithQuantity,
        cartCount: cartProductIds.reduce((total, item) => total + item.quantity, 0),  // Count all items including quantity
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
    const { quantity } = req.body;
  
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
      const cartProductIds = req.session.cart || [];
      const productIds = cartProductIds.map(item => item.productId);
      const productsInCart = await Product.find({ _id: { $in: productIds } });

      // Calculate total price and attach quantity
      const totalPrice = productsInCart.reduce((total, product) => {
          const cartItem = cartProductIds.find(item => item.productId.toString() === product._id.toString());
          return total + product.price * cartItem.quantity;
      }, 0);

      // Apply 5% discount
      const discount = 0.05; // 5% discount
      const discountedPrice = totalPrice - totalPrice * discount;

      res.render("checkout", {
          products: productsInCart,
          totalPrice: totalPrice.toFixed(2), // Original price (optional formatting)
          discountedPrice: discountedPrice.toFixed(2), // Price after discount
          layout: "mainLayout",
      });
  } catch (err) {
      console.error("Error fetching cart products:", err);
      res.status(500).send("Error fetching cart products.");
  }
});


// Route to handle checkout submission
router.post("/checkout", async (req, res) => {
    const { name, address, phone, totalPrice } = req.body;
  
    if (!name || !address || !phone || !totalPrice) {
      return res.status(400).json({ success: false, message: "Please fill in all fields." });
    }
  
    // Get cart items and their quantities
    const cartProductIds = req.session.cart || [];
    const productsInCart = await Product.find({ _id: { $in: cartProductIds.map(item => item.productId) } });
  
    // Prepare the products array with both productId and quantity
    const orderProducts = productsInCart.map(product => {
      const cartItem = cartProductIds.find(item => item.productId.toString() === product._id.toString());
      return { productId: product._id, quantity: cartItem.quantity };
    });
  
    const newOrder = new Order({
      name,
      address,
      phone,
      products: orderProducts,  // Include productId and quantity
      totalPrice,
    });
  
    try {
      await newOrder.save();
      req.session.cart = [];  // Clear the cart
      res.status(200).json({ success: true, message: "Your order has been confirmed!" });
    } catch (err) {
      console.error("Error processing the order:", err);
      res.status(500).json({ success: false, message: "Error processing the order. Please try again." });
    }
  });
  
module.exports = router;

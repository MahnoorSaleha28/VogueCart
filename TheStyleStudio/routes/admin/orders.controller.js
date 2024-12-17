const express = require("express");
const router = express.Router();
const Order = require("../../models/orders.model");

//view orders
router.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find().populate("products.product");
    // Filter out null products
    orders.forEach(order => {
    order.products = order.products.filter(item => item.product);
    });

    res.render("admin/orders/index", {
    layout: "adminlayout",
    pageTitle: "Manage Orders",
    orders,
    });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving orders.");
    }
    });

// Delete an order
router.post("/admin/orders/delete/:id", async (req, res) => {
    try {
      await Order.findByIdAndDelete(req.params.id);
      res.redirect("/admin/orders");
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting order.");
    }
  });

module.exports = router;
  
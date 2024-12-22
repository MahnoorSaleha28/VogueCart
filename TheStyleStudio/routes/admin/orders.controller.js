const express = require("express");
const router = express.Router();
const Order = require("../../models/order");

router.get("/admin/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("products.productId", "name price") // Populate the productId with name and price
      .sort({ createdAt: -1 }); // Sort by creation date in descending order

    res.render("admin/orders", { orders, layout: "adminlayout" });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Error fetching orders.");
  }
});

module.exports = router;
  
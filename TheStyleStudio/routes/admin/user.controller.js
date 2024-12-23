const express = require("express");
const router = express.Router();
const User = require("../../models/user.model");
const Order = require("../../models/order");

router.get("/admin/user", async (req, res) => {
  try {
    const users = await User.find();

    const orders = await Order.find()
          .populate("products.productId", "name price") // Populate the productId with name and price
          .sort({ createdAt: -1 }); // Sort by creation date in descending order
    res.render("admin/user", { users,orders, layout: "adminlayout" });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Error fetching users.");
  }
});

module.exports = router;
  
const express = require("express");
const router = express.Router();
const User = require("../../models/user.model");
const Order = require("../../models/order");
const { isDemo, maskUser } = require("../../utils/demoMask");

router.get("/admin/user", async (req, res) => {
  try {
    const users = await User.find().sort({ name: 1 });
    const orders = await Order.find().sort({ createdAt: -1 }); // Sort by creation date in descending order

    // Orders don't store a user id, so match them by the name given at checkout
    const summaries = users.map(user => {
      const name = (user.name || "").trim().toLowerCase();
      const userOrders = orders.filter(order => (order.name || "").trim().toLowerCase() === name);
      return {
        user,
        orderCount: userOrders.length,
        totalSpent: userOrders.reduce((total, order) => total + order.totalPrice, 0),
        lastOrder: userOrders.length ? userOrders[0].createdAt : null,
      };
    });

    // Masked after matching, since matching uses the real names
    if (isDemo(req)) summaries.forEach(summary => maskUser(summary.user));

    res.render("admin/user", { summaries, layout: "adminlayout", pageTitle: "Users" });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Error fetching users.");
  }
});

module.exports = router;

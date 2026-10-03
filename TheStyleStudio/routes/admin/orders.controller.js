const express = require("express");
const router = express.Router();
const Order = require("../../models/order");
const { isDemo, maskOrder } = require("../../utils/demoMask");

router.get("/admin/orders", async (req, res) => {
  try {
    // Optional filter by payment status; orders from before payments existed count as "Pay on delivery"
    const status = ["Paid", "Pay on delivery"].includes(req.query.status) ? req.query.status : "";
    const filter = status === "Paid"
      ? { paymentStatus: "Paid" }
      : status === "Pay on delivery"
        ? { paymentStatus: { $ne: "Paid" } }
        : {};

    const orders = await Order.find(filter)
      .populate("products.productId", "name price image") // Populate the productId with name, price and image
      .sort({ createdAt: -1 }); // Sort by creation date in descending order

    const allCount = await Order.countDocuments();
    const paidCount = await Order.countDocuments({ paymentStatus: "Paid" });

    if (isDemo(req)) orders.forEach(maskOrder);

    res.render("admin/orders", {
      orders,
      status,
      counts: { all: allCount, paid: paidCount, cod: allCount - paidCount },
      layout: "adminlayout",
      pageTitle: "Orders",
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).send("Error fetching orders.");
  }
});

module.exports = router;

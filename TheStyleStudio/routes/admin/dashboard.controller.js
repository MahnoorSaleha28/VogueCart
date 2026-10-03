const express = require("express");
const router = express.Router();
const Product = require("../../models/products.model");
const Category = require("../../models/categories.model");
const Order = require("../../models/order");
const User = require("../../models/user.model");
const { isDemo, maskOrder } = require("../../utils/demoMask");

router.get("/admin/dashboard", async (req, res) => {
  try {
    const [productCount, categoryCount, userCount, orderCount, revenue, recentOrders, topProducts] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$totalPrice" } } }]),
      Order.find().sort({ createdAt: -1 }).limit(5),
      // Best sellers by quantity, same as the homepage
      Order.aggregate([
        { $unwind: "$products" },
        { $group: { _id: "$products.productId", sold: { $sum: "$products.quantity" } } },
        { $sort: { sold: -1, _id: -1 } },
        { $limit: 5 },
        { $lookup: { from: "products", localField: "_id", foreignField: "_id", as: "product" } },
        { $unwind: "$product" },
      ]),
    ]);

    if (isDemo(req)) recentOrders.forEach(maskOrder);

    res.render("admin/dashboard", {
      layout: "adminlayout",
      pageTitle: "Dashboard",
      stats: {
        productCount,
        categoryCount,
        userCount,
        orderCount,
        revenue: revenue.length ? revenue[0].total : 0,
      },
      recentOrders,
      topProducts,
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Error loading dashboard.");
  }
});

module.exports = router;

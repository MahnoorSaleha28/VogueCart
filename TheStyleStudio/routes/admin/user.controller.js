const express = require("express");
const router = express.Router();
const User = require("../../models/user.model");

router.get("/admin/user", async (req, res) => {
  try {
    const users = await User.find();
    res.render("admin/user", { users, layout: "adminlayout" });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Error fetching users.");
  }
});

module.exports = router;
  
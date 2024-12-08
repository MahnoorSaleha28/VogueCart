const express = require('express');
const router = express.Router();
let Product = require("../../models/products.model")
let Category = require("../../models/categories.model");

// Route to fetch products with category "clothes"
router.get('/clothes', async (req, res) => {
  try {
    // Find the category by name and populate the associated products
    const category = await Category.findOne({ name: 'Clothes' }).populate('products');

    if (!category) {
      return res.status(404).send('Category "clothes" not found');
    }

    // Use the populated products directly
    const products = category.products;

    // Render the clothes page with the products
    res.render('clothes', { title: 'Clothes', products: products });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving products');
  }
});

module.exports = router;
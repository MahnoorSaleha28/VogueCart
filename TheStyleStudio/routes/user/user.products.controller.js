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
router.get('/accessories', async (req, res) => {
  try {
   

    const category = await Category.findOne({ name: 'Accessories' });
    if (!category) {
      console.error("Category 'Accessories' not found");
      return res.status(404).send("Category 'Accessories' not found");
    }

    const accessories = await Product.find({ category: category._id })
    if (!accessories.length) {
      console.warn('No products found for the "Accessories" category');
    }
    res.render('accessories', { accessories: accessories });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).send('Error fetching products');
  }
});

module.exports = router;
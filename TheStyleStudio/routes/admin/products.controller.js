const express = require("express");
const multer = require("multer");
const path = require("path");
let router = express.Router();
let Product = require("../../models/products.model")
let Category = require("../../models/categories.model");

router.get('/admin/products', async (req, res) => {
  try {
      let products = await Product.find().populate('category');
      res.render('admin/products/index', {
          layout: 'adminlayout',
          pageTitle: 'Manage Products',
          products
      });
  } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving products.");
  }
});

//product details from db
router.get('/admin/products/create', async (req, res) => {
  const categories = await Category.find();
  res.render('admin/products/create', {
    layout: 'adminlayout',
    categories, 
  });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images"); // Path to save images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename with original extension
  },
});
const upload = multer({ storage: storage });

// Handle new product form data
router.post('/admin/products/create', upload.single('productImage'), async (req, res) => {
  try {
    let data = req.body;
    if (req.file) {
      data.image = `/images/${req.file.filename}`;
    }
    const newProduct = new Product(data);
    await newProduct.save();
        
    // Finding the associated category and adding the new product to it
    let category = await Category.findById(data.categoryId);
    category.products.push(newProduct._id);
    await category.save();

    // return res.send(newProduct);                                           --displaying the newly created product's details.
    // return res.render("admin/product-form", { layout: "adminlayout" });    --allowing user to see the form again 
    
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error saving product.");
  }
});

router.get('/admin/products/edit/:id', async(req, res) => {
  try {
    let product = await Product.findById(req.params.id).populate('category');
    const categories = await Category.find();

    res.render("admin/products/edit", {
      layout: "adminlayout",
      product,
      categories,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading product edit page.');
  }
});

router.post('/admin/products/edit/:id', upload.single('productImage'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    let data = req.body; 
    if (req.file) {
      data.image = `/images/${req.file.filename}`;
    }
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, data, { new: true });
    res.redirect('/admin/products');
    
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating product.");
  }
});

router.post("/admin/products/delete/:id", async(req, res) => {
  try{
    let product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).send("Product not found.");
    }

    res.redirect('/admin/products');
    
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting product.");
  }
});



router.get('/clothes', async (req, res) => {
  try {
    // Query database for products in the "cloth" category
    const clothes = await Product.find({ category: 'Clothes' });
    
    // Pass 'clothes' to the template
    res.render('clothes', { clothes: clothes }); // Use 'clothes' here
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

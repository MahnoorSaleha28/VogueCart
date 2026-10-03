const express = require("express");
let router = express.Router();
let Product = require("../../models/products.model")
let Category = require("../../models/categories.model");
const { uploadSingle, saveImage } = require("../../utils/imageUpload");

// Escape regex characters so a search like "(" is matched literally
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Page number is digits only, so /admin/products/create isn't treated as a page
router.get('/admin/products/:page(\\d+)?', async (req, res) => {
  try {
    //adding pagination
    let page = req.params.page;
    page = page ? Number(page) : 1;
    let pageSize = 12;

    // Optional search by product name
    const search = (req.query.q || '').trim();
    const filter = search ? { name: { $regex: escapeRegex(search), $options: 'i' } } : {};

    let totalRecords = await Product.countDocuments(filter);
    let totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

      let products = await Product.find(filter).populate('category')
      .sort({ _id: -1 })  // Newest first
      .limit(pageSize)
      .skip((page - 1) * pageSize);

      res.render('admin/products/index', {
          layout: 'adminlayout',
          pageTitle: 'Products',
          products,
          search,
          page:page,
          pageSize:pageSize,
          totalPages:totalPages,
          totalRecords:totalRecords,
      });
  } catch (err) {
      console.error(err);
      res.status(500).send("Error retrieving products.");
  }
});

//product details from db
router.get('/admin/products/create', async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });
  res.render('admin/products/create', {
    layout: 'adminlayout',
    pageTitle: 'Add Product',
    categories,
  });
});

// Handle new product form data
router.post('/admin/products/create', uploadSingle('productImage'), async (req, res) => {
  try {
    let data = req.body;
    if (!data.name || !data.price || !data.category) {
      req.session.errorMessage = "Please fill in the product name, price and category.";
      return res.redirect('/admin/products/create');
    }
    if (req.file) {
      try {
        data.image = await saveImage(req.file);
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        req.session.errorMessage = "The image could not be uploaded. Please try again.";
        return res.redirect('/admin/products/create');
      }
    }
    const newProduct = new Product(data);
    await newProduct.save();

    // Finding the associated category and adding the new product to it
    let category = await Category.findById(data.category);
    if (category) {
      category.products.push(newProduct._id);
      await category.save();
    }

    req.session.successMessage = `"${newProduct.name}" was added.`;
    res.redirect('/admin/products');
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error saving product.");
  }
});

router.get('/admin/products/edit/:id', async(req, res) => {
  try {
    let product = await Product.findById(req.params.id).populate('category');
    if (!product) {
      req.session.errorMessage = "That product no longer exists.";
      return res.redirect('/admin/products');
    }
    const categories = await Category.find().sort({ name: 1 });

    res.render("admin/products/edit", {
      layout: "adminlayout",
      pageTitle: "Edit Product",
      product,
      categories,
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading product edit page.');
  }
});

router.post('/admin/products/edit/:id', uploadSingle('productImage'), async (req, res) => {
  try {
    let data = req.body;
    if (!data.name || !data.price || !data.category) {
      req.session.errorMessage = "Please fill in the product name, price and category.";
      return res.redirect(`/admin/products/edit/${req.params.id}`);
    }
    if (req.file) {
      try {
        data.image = await saveImage(req.file);
      } catch (uploadError) {
        console.error("Image upload failed:", uploadError);
        req.session.errorMessage = "The image could not be uploaded. Please try again.";
        return res.redirect(`/admin/products/edit/${req.params.id}`);
      }
    }
    const oldProduct = await Product.findByIdAndUpdate(req.params.id, data);

    // Keep the categories' product lists in step when the category changes
    if (oldProduct && String(oldProduct.category) !== String(data.category)) {
      await Category.updateOne({ _id: oldProduct.category }, { $pull: { products: oldProduct._id } });
      await Category.updateOne({ _id: data.category }, { $addToSet: { products: oldProduct._id } });
    }

    req.session.successMessage = `"${data.name}" was updated.`;
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
      req.session.errorMessage = "That product no longer exists.";
      return res.redirect('/admin/products');
    }
    await Category.updateOne({ _id: product.category }, { $pull: { products: product._id } });

    req.session.successMessage = `"${product.name}" was deleted.`;
    res.redirect('/admin/products');

  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting product.");
  }
});

module.exports = router;

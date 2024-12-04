const express = require("express");
let router = express.Router();
const path = require("path");

let Category = require("../../models/categories.model");
let Product = require("../../models/products.model")

router.get('/admin/categories', async (req, res) => {
    try {
        let categories = await Category.find().populate('products');
        res.render("admin/categories", {
            layout: "adminlayout",
            pageTitle: "Manage Your Categories",
            categories,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving categories.");
    }
});

router.get('/admin/categories/create', (req, res) => {
    res.render("admin/categories/create", {
        layout: "adminlayout"
    })
})

router.post('/admin/categories/create', async(req, res) => {
    try{
        let data = req.body;
        let newCategory = new Category(data);
        await newCategory.save();
        res.redirect("/admin/categories")
    }
    catch (err) {
        console.error(err);
        return res.status(500).send("Error saving category.");
    }
});

router.get('/admin/categories/edit/:id', async(req, res) => {
    try{
        let category = await Category.findById(req.params.id).populate('products');
        let product = await Product.findById(req.params.id).populate('categories');

        res.render("admin/categories/edit", {
            layout:"adminlayout",
            category,
            product,
        })
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error loading categories edit page.');
      }
});

router.post('/admin/categories/edit/:id', async(req, res) => {
    try{
        let category = await Category.findById(req.params.id);
        let data = req.body; 
        const updatedCategory = await Category.findByIdAndUpdate(req.params.id, data, { new: true });
        res.redirect('/admin/categories');

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating product.");
    }
});

router.post('/admin/categories/delete/:id', async(req, res) => {
    try{
        let category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).send("Product not found.");
        }
        res.redirect('/admin/categories');
    }
    catch (err) {
    console.error(err);
    res.status(500).send("Error deleting product.");
  }
});

module.exports = router;

const express = require("express");
let router = express.Router();

let Category = require("../../models/categories.model");
let Product = require("../../models/products.model")

router.get('/admin/categories', async (req, res) => {
    try {
        let categories = await Category.find().sort({ name: 1 });

        // Count products from the products themselves, so the numbers are always current
        const counts = await Product.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
        const productCounts = {};
        counts.forEach(entry => { productCounts[String(entry._id)] = entry.count; });

        // One product photo per category for the cards
        const covers = {};
        for (const category of categories) {
            const product = await Product.findOne({ category: category._id, image: { $exists: true } }).sort({ _id: -1 });
            if (product) covers[String(category._id)] = product.image;
        }

        res.render("admin/categories/index", {
            layout: "adminlayout",
            pageTitle: "Categories",
            categories,
            productCounts,
            covers,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving categories.");
    }
});

router.get('/admin/categories/create', (req, res) => {
    res.render("admin/categories/create", {
        layout: "adminlayout",
        pageTitle: "Add Category",
    })
})

router.post('/admin/categories/create', async(req, res) => {
    try{
        const name = (req.body.name || '').trim();
        const description = (req.body.description || '').trim();
        if (!name || !description) {
            req.session.errorMessage = "Please fill in the category name and description.";
            return res.redirect('/admin/categories/create');
        }
        if (await Category.exists({ name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })) {
            req.session.errorMessage = `A category called "${name}" already exists.`;
            return res.redirect('/admin/categories/create');
        }
        let newCategory = new Category({ name, description });
        await newCategory.save();
        req.session.successMessage = `"${name}" was added.`;
        res.redirect("/admin/categories")
    }
    catch (err) {
        console.error(err);
        return res.status(500).send("Error saving category.");
    }
});

router.get('/admin/categories/edit/:id', async(req, res) => {
    try{
        let category = await Category.findById(req.params.id);
        if (!category) {
            req.session.errorMessage = "That category no longer exists.";
            return res.redirect('/admin/categories');
        }
        let products = await Product.find({ category: category._id }).sort({ name: 1 });

        res.render("admin/categories/edit", {
            layout:"adminlayout",
            pageTitle: "Edit Category",
            category,
            products,
        })
    }
    catch (err) {
        console.error(err);
        res.status(500).send('Error loading categories edit page.');
      }
});

router.post('/admin/categories/edit/:id', async(req, res) => {
    try{
        const name = (req.body.name || '').trim();
        const description = (req.body.description || '').trim();
        if (!name || !description) {
            req.session.errorMessage = "Please fill in the category name and description.";
            return res.redirect(`/admin/categories/edit/${req.params.id}`);
        }
        await Category.findByIdAndUpdate(req.params.id, { name, description });
        req.session.successMessage = `"${name}" was updated.`;
        res.redirect('/admin/categories');

    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating category.");
    }
});

router.post('/admin/categories/delete/:id', async(req, res) => {
    try{
        // Deleting a category with products would hide those products from the shop
        const productCount = await Product.countDocuments({ category: req.params.id });
        if (productCount > 0) {
            req.session.errorMessage = `This category still has ${productCount} ${productCount === 1 ? 'product' : 'products'}. Move or delete them first.`;
            return res.redirect('/admin/categories');
        }

        let category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            req.session.errorMessage = "That category no longer exists.";
            return res.redirect('/admin/categories');
        }
        req.session.successMessage = `"${category.name}" was deleted.`;
        res.redirect('/admin/categories');
    }
    catch (err) {
    console.error(err);
    res.status(500).send("Error deleting category.");
  }
});

module.exports = router;

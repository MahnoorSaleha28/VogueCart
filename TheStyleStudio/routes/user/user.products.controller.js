const express = require('express');
const router = express.Router();
let Product = require("../../models/products.model")
let Category = require("../../models/categories.model");

// Clothes route
router.get('/clothes', async (req, res) => {
  try {
    const { category, sort } = req.query;
    const filter = { category: null };
    const sortOptions = {};

    // Fetch the "Clothes" category
    const clothesCategory = await Category.findOne({ name: 'Clothes' });
    if (!clothesCategory) {
      return res.status(404).send('Category "Clothes" not found');
    }

    // Set the base filter for Clothes category
    filter.category = clothesCategory._id;

    // If a sub-category filter is provided, adjust the filter
    if (category) {
      const subCategory = await Category.findOne({ name: category });
      if (subCategory) {
        filter.category = subCategory._id;
      } else {
        return res.render('noResult', {
          layout: 'layout',
          message: `Sub-category "${category}" not found.`,
        });
      }
    }

    // Apply sorting logic
    if (sort) {
      if (sort === 'priceAsc') sortOptions.price = 1; // Low to High
      else if (sort === 'priceDesc') sortOptions.price = -1; // High to Low
      else if (sort === 'nameAsc') {
        sortOptions.name = 1; // A-Z
      }
    }

    // Fetch products based on filters and sorting, using collation for case-insensitive sorting
    const products = await Product.find(filter)
      .collation({ locale: 'en', strength: 1 }) // Case-insensitive sorting
      .sort(sortOptions);

    // Render the Clothes page with the filtered and sorted products
    res.render('clothes', {
      layout: 'layout',
      pageTitle: 'Clothes',
      products,
      totalProducts: products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).send('Error fetching products');
  }
});

// Jewellery route
router.get('/jewellery', async (req, res) => {
  try {
    const { category, sort } = req.query;
    const filter = { category: null };
    const sortOptions = {};

    // Find Jewellery category by name
    const jewelleryCategory = await Category.findOne({ name: 'Jewellery' });
    if (!jewelleryCategory) {
      return res.status(404).send('Jewellery category not found.');
    }

    // Set the base filter for Jewellery category
    filter.category = jewelleryCategory._id;

    // If a sub-category filter is provided, adjust the filter
    if (category) {
      const subCategory = await Category.findOne({ name: category });
      if (subCategory) {
        filter.category = subCategory._id;
      } else {
        return res.render('noResult', {
          layout: 'layout',
          message: `Sub-category "${category}" not found.`,
        });
      }
    }

    // Apply sorting logic
    if (sort) {
      if (sort === 'priceAsc') sortOptions.price = 1; // Low to High
      else if (sort === 'priceDesc') sortOptions.price = -1; // High to Low
      else if (sort === 'nameAsc') {
        sortOptions.name = 1; // A-Z
      }
    }

    // Fetch products based on filters and sorting, using collation for case-insensitive sorting
    const products = await Product.find(filter)
      .collation({ locale: 'en', strength: 1 }) // Case-insensitive sorting
      .sort(sortOptions);

    // Render the Jewellery page with the filtered and sorted products
    res.render('jewellery', {
      layout: 'layout',
      pageTitle: 'Jewellery',
      products,
      totalProducts: products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).send('Error fetching products');
  }
});






// Bags route
router.get('/bags', async (req, res) => {
  try {
    const { category, sort } = req.query;
    const filter = { category: null };
    const sortOptions = {};

    // Find Bags category by name
    const bagsCategory = await Category.findOne({ name: 'Bags' });
    if (!bagsCategory) {
      return res.status(404).send('Bags category not found.');
    }

    // Set the base filter for Bags category
    filter.category = bagsCategory._id;

    // If a sub-category filter is provided, adjust the filter
    if (category) {
      const subCategory = await Category.findOne({ name: category });
      if (subCategory) {
        filter.category = subCategory._id;
      } else {
        return res.render('noResult', {
          layout: 'layout',
          message: `Sub-category "${category}" not found.`,
        });
      }
    }

    // Apply sorting logic
    if (sort) {
      if (sort === 'priceAsc') sortOptions.price = 1; // Low to High
      else if (sort === 'priceDesc') sortOptions.price = -1; // High to Low
      else if (sort === 'nameAsc') {
        sortOptions.name = 1; // A-Z
      }
    }

    // Fetch products based on filters and sorting, using collation for case-insensitive sorting
    const products = await Product.find(filter)
      .collation({ locale: 'en', strength: 1 }) // Case-insensitive sorting
      .sort(sortOptions);

    // Render the Bags page with the filtered and sorted products
    res.render('bags', {
      layout: 'layout',
      pageTitle: 'Bags',
      products,
      totalProducts: products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).send('Error fetching products');
  }
});



router.get('/accessories', async (req, res) => {
  try {
    const { category, sort } = req.query;
    const filter = { category: null };
    const sortOptions = {};

    // Fetch the "Accessories" category
    const accessoriesCategory = await Category.findOne({ name: 'Accessories' });
    if (!accessoriesCategory) {
      return res.status(404).send('Accessories category not found');
    }

    // Set the base filter for Accessories category
    filter.category = accessoriesCategory._id;

    // If a sub-category filter is provided, adjust the filter
    if (category) {
      const subCategory = await Category.findOne({ name: category });
      if (subCategory) {
        filter.category = subCategory._id;
      } else {
        return res.render('noResult', {
          layout: 'layout',
          message: `Sub-category "${category}" not found.`,
        });
      }
    }

    // Apply sorting logic
    if (sort) {
      if (sort === 'priceAsc') sortOptions.price = 1; // Low to High
      else if (sort === 'priceDesc') sortOptions.price = -1; // High to Low
      else if (sort === 'nameAsc') {
        sortOptions.name = 1; // A-Z
      }
    }

    // Fetch products based on filters and sorting, using collation for case-insensitive sorting
    const products = await Product.find(filter)
      .collation({ locale: 'en', strength: 1 }) // Case-insensitive sorting
      .sort(sortOptions);

    // Render the Accessories page with the filtered and sorted products
    res.render('accessories', {
      layout: 'layout',
      pageTitle: 'Accessories',
      products,
      totalProducts: products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).send('Error fetching products');
  }
});







// Toys route
router.get('/toys', async (req, res) => {
  try {
    const { category, sort } = req.query;
    const filter = { category: null };
    const sortOptions = {};

    // Find Toys category by name
    const toysCategory = await Category.findOne({ name: 'Toys' });
    if (!toysCategory) {
      console.error("Category 'Toys' not found");
      return res.status(404).send("Category 'Toys' not found");
    }

    // Set the base filter for Toys category
    filter.category = toysCategory._id;

    // If a sub-category filter is provided, adjust the filter
    if (category) {
      const subCategory = await Category.findOne({ name: category });
      if (subCategory) {
        filter.category = subCategory._id;
      } else {
        return res.render('noResult', {
          layout: 'layout',
          message: `Sub-category "${category}" not found.`,
        });
      }
    }

    // Apply sorting logic
    if (sort) {
      if (sort === 'priceAsc') sortOptions.price = 1; // Low to High
      else if (sort === 'priceDesc') sortOptions.price = -1; // High to Low
      else if (sort === 'nameAsc') {
        sortOptions.name = 1; // A-Z
      }
    }

    // Fetch products based on filters and sorting, using collation for case-insensitive sorting
    const products = await Product.find(filter)
      .collation({ locale: 'en', strength: 1 }) // Case-insensitive sorting
      .sort(sortOptions);

    // Render the Toys page with the filtered and sorted products
    res.render('toys', {
      layout: 'layout',
      pageTitle: 'Toys',
      products,
      totalProducts: products.length,
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).send('Error fetching products');
  }
});


router.get('/productDetail/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).send('Product not found');
    }

    res.render('productDetail', { product });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching product details');
  }
});


router.get('/search', async (req, res) => {
  try {
    const query = req.query.search;

    if (!query) {
      return res.render('noResult', {
        layout: 'layout',
        message: 'Please enter a search term.',
      });
    }

    // Handle singular/plural category name match
    const categoryRegex = new RegExp(`^${query}$`, 'i'); // Case-insensitive exact match

    // First, check if there's an exact match for the category name
    let category = await Category.findOne({ name: categoryRegex });

    // If no match found, try matching singular form for plural categories
    if (!category) {
      const pluralQuery = query.endsWith('s') ? query.slice(0, -1) : query + 's'; // Convert singular to plural or vice versa
      category = await Category.findOne({ name: new RegExp(`^${pluralQuery}$`, 'i') });
    }

    if (category) {
      // Fetch all products for the matching category
      const products = await Product.find({ category: category._id });

      // Render the category view
      return res.render(`${category.name.toLowerCase()}`, {
        layout: 'layout',
        category,
        products,
      });
    }

    // Search for an exact match of the product name (case-insensitive)
    const product = await Product.findOne({ name: { $regex: `^${query}$`, $options: 'i' } }).populate('category');
    if (product) {
      return res.redirect(`/productDetail/${product._id}`);
    }

    // If no matches are found
    return res.render('noResult', {
      layout: 'layout',
      message: 'No category or product found matching your search.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error performing search.');
  }
});












module.exports = router;
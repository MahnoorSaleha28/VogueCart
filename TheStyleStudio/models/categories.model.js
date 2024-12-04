const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, 
    unique: true,   //no duplicate category names
  },
  description: {
    type: String,
    required: true,
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product'  // The referenced model is Product
  }],
});

module.exports = mongoose.model('Category', categorySchema);

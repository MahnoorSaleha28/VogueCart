const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  image: {  
    type: String
  },
  price: {
    type: Number,
  },
  description: {
    type: String,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category', 
  },
});

module.exports = mongoose.model('Product', productSchema);

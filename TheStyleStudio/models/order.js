const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, required: true },  // Store the quantity
    }
  ], // Array of product objects containing both productId and quantity
  totalPrice: { type: Number, required: true },
  // Simulated payment (no real transaction): method, status and a masked summary such as "Visa •••• 4242"
  paymentMethod: { type: String, enum: ['cod', 'card', 'wallet'], default: 'cod' },
  paymentStatus: { type: String, enum: ['Paid', 'Pay on delivery'], default: 'Pay on delivery' },
  paymentDetails: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);

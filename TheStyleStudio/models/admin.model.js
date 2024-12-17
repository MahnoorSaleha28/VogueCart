const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

// Admin Schema
const adminSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

// Pre-save hook to hash the password before saving it
adminSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        // Hash the password
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Method to compare the password during login
adminSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;

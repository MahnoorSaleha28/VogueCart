const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/admin.model"); // Adjust the path if necessary

// MongoDB connection setup
const mongoURI = "REMOVED_MONGODB_CREDENTIAL";
mongoose.connect(mongoURI, {})
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

// Function to add an admin
async function addAdmin() {
    const admin = new Admin({ 
        email: "admin@gmail.com", 
        password: "admin@cui" // Use plaintext password for testing
    });

    try {
        await admin.save();
        process.exit(); // Exit the script
    } catch (err) {
        process.exit(1); // Exit with an error code
    }
}
 addAdmin();

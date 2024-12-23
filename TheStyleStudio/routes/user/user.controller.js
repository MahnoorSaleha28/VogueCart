const express = require('express');
const router = express.Router();
let User = require("../../models/user.model");
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const crypto = require("crypto");

router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if all required fields are filled
        if (!name || !email || !password) {
            req.session.errorMessage = "All fields are required.";
            req.session.activeTab = 'signup';
            return res.redirect('/login');
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.session.errorMessage = "User already exists with this email.";
            req.session.activeTab = 'signup';
            return res.redirect('/login');
        }

        // Hash the password before saving the user
        const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10

        // Save the new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword // Store the hashed password
        });

        await newUser.save();

        // Set success message and redirect to login page
        req.session.successMessage = "Successfully registered! Please login.";
        req.session.activeTab = 'signin';
        return res.redirect('/login');
    } catch (error) {
        console.error("Error during signup:", error);
        req.session.errorMessage = "Server error. Please try again.";
        req.session.activeTab = 'signup';
        return res.redirect('/login');
    }
});

router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if all required fields are filled
        if (!email || !password) {
            req.session.errorMessage = "All fields are required.";
            req.session.activeTab = 'signin';
            return res.redirect('/login');
        }

        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            req.session.errorMessage = "User does not exist. Please sign up.";
            req.session.activeTab = 'signin';
            return res.redirect('/login');
        }

        // Validate the password using bcrypt
        const isValid = await bcrypt.compare(password, user.password); // Compare hashed password
        if (!isValid) {
            req.session.errorMessage = "Invalid password. Please try again.";
            req.session.activeTab = 'signin';
            return res.redirect('/login');
        }

        // Save the user session
        req.session.user = user;

        req.session.successMessage = "Successfully logged in!";
        return res.redirect('/');
    } catch (error) {
        console.error("Error during signin:", error);
        req.session.errorMessage = "Server error. Please try again.";
        req.session.activeTab = 'signin';
        return res.redirect('/login');
    }
});

router.get('/logout', (req, res) => {
    req.session.user = null; // Clear the user session
    req.session.successMessage = "Successfully logged out!";
    res.redirect('/login'); // Redirect to login page after logout
});

module.exports = router;

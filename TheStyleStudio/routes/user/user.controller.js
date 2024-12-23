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
            return res.render('login', {
                errorMessage: "All fields are required.",
                successMessage: null,
                activeTab: 'signup',
                layout: false
            });
        }

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.render('login', {
                errorMessage: "User already exists with this email.",
                successMessage: null,
                activeTab: 'signup',
                layout: false
            });
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

        // Redirect to login page with success message
        return res.render('login', {
            errorMessage: null,
            successMessage: "Successfully registered! Please login.",
            activeTab: 'signin',
            layout: false
        });
    } catch (error) {
        console.error("Error during signup:", error);
        return res.render('login', {
            errorMessage: "Server error. Please try again.",
            successMessage: null,
            activeTab: 'signup',
            layout: false
        });
    }
});



router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if all required fields are filled
        if (!email || !password) {
            return res.render('login', {
                errorMessage: "All fields are required.",
                successMessage: null,
                activeTab: 'signin',
                layout: false
            });
        }

        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.render('login', {
                errorMessage: "User does not exist. Please sign up.",
                successMessage: null,
                activeTab: 'signin',
                layout: false
            });
        }

        // Validate the password using bcrypt
        const isValid = await bcrypt.compare(password, user.password); // Compare hashed password
        if (!isValid) {
            return res.render('login', {
                errorMessage: "Invalid password. Please try again.",
                successMessage: null,
                activeTab: 'signin',
                layout: false
            });
        }

        // Save the user session
        req.session.user = user;

        req.session.successMessage = "Successfully logged in!";
        console.log("Redirecting to homepage");
        res.redirect('/');
    } catch (error) {
        console.error("Error during signin:", error);
        return res.render('login', {
            errorMessage: "Server error. Please try again.",
            successMessage: null,
            activeTab: 'signin',
            layout: false
        });
    }
});




router.get('/logout', (req, res) => {
    const user = req.body;
    req.session.user = null; 
    req.session.successMessage = "Successfully logged out!";
    res.redirect('/'); 
});





module.exports = router;
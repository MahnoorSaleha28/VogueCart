// Creates an admin account, or changes the password of an existing one.
// Usage:
//   node scripts/addAdmin.js <email> <password>    full admin
//   node scripts/addAdmin.js <email> --demo        read-only demo admin, signed in with the "View demo" button
require("dotenv").config({
  path: require("path").join(__dirname, "..", "..", ".env"),
});
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const crypto = require("crypto");
const mongoose = require("mongoose");
const Admin = require("../models/admin.model"); // Adjust the path if necessary

const args = process.argv.slice(2);
const isDemo = args.includes("--demo");
const [email, givenPassword] = args.filter((arg) => arg !== "--demo");
// Nobody types the demo password, so it's random
const password = isDemo ? crypto.randomBytes(24).toString("hex") : givenPassword;

if (!email || !password) {
  console.error("Usage: node scripts/addAdmin.js <email> <password>");
  console.error("   or: node scripts/addAdmin.js <email> --demo");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Please use a password of at least 8 characters.");
  process.exit(1);
}

// Function to add an admin
async function addAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // The model's pre-save hook hashes the password
    let admin = await Admin.findOne({ email });
    const role = isDemo ? "demo" : "admin";
    if (admin) {
      admin.password = password;
      admin.role = role;
      await admin.save();
      console.log(`Updated ${email} (${role})`);
    } else {
      admin = new Admin({ email, password, role });
      await admin.save();
      console.log(`Created ${email} (${role})`);
    }
    process.exit(); // Exit the script
  } catch (err) {
    console.error("Could not save admin:", err.message);
    process.exit(1); // Exit with an error code
  }
}
addAdmin();

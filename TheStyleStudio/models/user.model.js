const mongoose = require("mongoose");

let usersSchema = mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'] 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: [String], 
    enum: ["user", "admin"],
    default: ["user"], 
  }
});

let UserModel = mongoose.model("User", usersSchema);

module.exports = UserModel;

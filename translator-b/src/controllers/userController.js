const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res) => {
  try {
    const { 
        name, 
        email, 
        password 
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ 
        email 
    });
    if (user) return res.status(400).json({ 
        message: "User already exists" 
    });

    // Create new user
    user = new User({ 
        name, email, password 
    });
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ 
        id: user._id 
    }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ 
        message: "User registered successfully", token 
    });
  } catch (error) {
    res.status(500).json({ 
        message: "Server error", error 
    });
  }
};

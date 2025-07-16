import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";

// Signup a new user
export const signup = async (req, res) => {
  const { fullName, email, password, bio } = req.body;

  try {
    if (!fullName || !email || !password || !bio) {
      return res.json({ success: false, message: "Missing Details" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Account already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      bio,
    });

    const token = generateToken(newUser._id);

    const user = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      bio: newUser.bio,
      profilePic: newUser.profilePic || "",
    };

    res.json({
      success: true,
      user,
      token,
      message: "Account created successfully",
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Login a user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const userRecord = await User.findOne({ email });
    if (!userRecord) {
      return res.json({ success: false, message: "User not found" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, userRecord.password);
    if (!isPasswordCorrect) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(userRecord._id);

    const user = {
      _id: userRecord._id,
      fullName: userRecord.fullName,
      email: userRecord.email,
      bio: userRecord.bio,
      profilePic: userRecord.profilePic || "",
    };

    res.json({
      success: true,
      user,
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Check if user is authenticated
export const checkAuth = (req, res) => {
  const user = {
    _id: req.user._id,
    fullName: req.user.fullName,
    email: req.user.email,
    bio: req.user.bio,
    profilePic: req.user.profilePic || "",
  };

  res.json({ success: true, user });
};

// Update user profile details
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, bio, fullName } = req.body;
    const userId = req.user._id;
    let updatedUser;

    if (!profilePic) {
      updatedUser = await User.findByIdAndUpdate(
        userId,
        { bio, fullName },
        { new: true }
      );
    } else {
      const upload = await cloudinary.uploader.upload(profilePic, {
        folder: "profile_pics",
      });

      updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          profilePic: upload.secure_url,
          bio,
          fullName,
        },
        { new: true }
      );
    }

    const user = {
      _id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      bio: updatedUser.bio,
      profilePic: updatedUser.profilePic || "",
    };

    res.json({ success: true, user });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

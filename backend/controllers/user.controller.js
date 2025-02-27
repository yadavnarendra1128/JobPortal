import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

// REGISTER
export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;

    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res
        .status(400)
        .json({ message: "All fields are required.", success: false });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({
          message: "User already exists with this email.",
          success: false,
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let profilePhoto = null;
    let resume = null;
    let resumeOriginalName = null;

    // Handle file upload (image or PDF)
    if (req.file) {
      const file = req.file;
      const fileUri = getDataUri(file);
      const fileType = file.mimetype;

      let cloudResponse;
      if (fileType.startsWith("image/")) {
        cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
          resource_type: "image",
        });
        profilePhoto = cloudResponse.secure_url;
      } else {
        return res
          .status(400)
          .json({ message: "Unsupported file type", success: false });
      }
    }

    // Create user
    const user = await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      profile: {
        profilePhoto,
        resume,
        resumeOriginalName,
      },
    });

    return res
      .status(201)
      .json({ message: "Account created successfully.", success: true });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
};

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ message: "All fields are required.", success: false });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Incorrect email or password.", success: false });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res
        .status(400)
        .json({ message: "Incorrect email or password.", success: false });
    }

    if (role !== user.role) {
      return res
        .status(400)
        .json({
          message: "Account doesn't exist with the specified role.",
          success: false,
        });
    }

    const token = jwt.sign({ userId: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 86400000,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({ message: `Welcome back ${user.fullname}`, user, success: true });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
};

// LOGOUT
export const logout = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", { maxAge: 0 })
      .json({ message: "Logged out successfully.", success: true });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const userId = req.id; // Middleware authentication

    let user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found.", success: false });
    }

    let profilePhoto = user.profile.profilePhoto;
    let resume = user.profile.resume;
    let resumeOriginalName = user.profile.resumeOriginalName;

    // Handle file upload (image or PDF)
    if (req.file) {
      const file = req.file;
      const fileType = file.mimetype;

      // Function to convert file buffer to Base64 URI
      const getDataUri = (file) => {
        const base64String = file.buffer.toString("base64");
        return `data:${file.mimetype};base64,${base64String}`;
      };

      const fileUri = getDataUri(file);
      let cloudResponse;

      try {
        if (fileType === "application/pdf") {
          cloudResponse = await cloudinary.uploader.upload(fileUri, {
            resource_type: "image", // Important for PDFs
            folder: "pdf_uploads", // Organize PDFs separately (optional)
          });
          resume = cloudResponse.secure_url;
          resumeOriginalName = file.originalname;
        } else if (fileType.startsWith("image/")) {
          cloudResponse = await cloudinary.uploader.upload(fileUri, {
            resource_type: "image",
            folder: "profile_photos", // Organize images separately (optional)
          });
          profilePhoto = cloudResponse.secure_url;
        } else {
          return res
            .status(400)
            .json({ message: "Unsupported file type", success: false });
        }
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res.status(500).json({ message: "File upload failed", error });
      }
    }

    // Update fields if provided
    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.profile.bio = bio;
    if (skills) user.profile.skills = skills.split(",");

    // Update profile fields
    user.profile.profilePhoto = profilePhoto;
    user.profile.resume = resume;
    user.profile.resumeOriginalName = resumeOriginalName;

    await user.save();

    return res
      .status(200)
      .json({ message: "Profile updated successfully.", user, success: true });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
};

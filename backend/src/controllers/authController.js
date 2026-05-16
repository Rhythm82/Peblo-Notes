import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import generateOtp from "../utils/generateOtp.js";
import { sendOtpEmail } from "../utils/sendEmail.js";

const OTP_EXPIRY_MINUTES = 10;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

function validatePassword(password) {
  if (typeof password !== "string") return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 16) return "Password must be at most 16 characters.";
  if (!/[0-9]/.test(password))
    return "Password must contain at least one number.";
  if (!/[A-Za-z]/.test(password)) {
    return "Password must contain at least one uppercase or lowercase letter.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one symbol.";
  }
  return null;
}

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function setAuthCookie(res, token) {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: sevenDays,
  });
}

async function signup(req, res, next) {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid email address." });
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const existingUser = await User.findOne({ email }).select("+password");
    if (existingUser?.isVerified) {
      return res.status(409).json({
        message: "Email already exists. Please login instead.",
      });
    }

    const otp = generateOtp();
    const hashedPassword = await bcrypt.hash(password, 12);
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    const user =
      existingUser ||
      new User({
        name,
        email,
      });

    user.name = name;
    user.password = hashedPassword;
    user.isVerified = false;
    user.otpHash = otpHash;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    try {
      await sendOtpEmail(email, otp);
    } catch (error) {
      console.error("OTP email failed:", error);
      return res
        .status(500)
        .json({ message: "Could not send OTP email. Please try again." });
    }

    return res.status(201).json({
      message: "Signup successful. Please verify the OTP sent to your email.",
      email,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ message: "Email already exists. Please login." });
    }
    return next(error);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const otp = req.body.otp?.trim();

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await User.findOne({ email }).select("+otpHash +otpExpiresAt");
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found for this email." });
    }

    if (user.isVerified) {
      const token = signToken(user._id);
      setAuthCookie(res, token);
      return res.json({
        message: "Email is already verified.",
        token,
        user: user.toSafeObject(),
      });
    }

    if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP expired. Please sign up again." });
    }

    const isOtpValid = await bcrypt.compare(otp, user.otpHash);
    if (!isOtpValid) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = signToken(user._id);
    setAuthCookie(res, token);

    return res.json({
      message: "Email verified successfully.",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(404)
        .json({ message: "No account found with this email." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
    }

    const token = signToken(user._id);
    setAuthCookie(res, token);

    return res.json({
      message: "Login successful.",
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    return next(error);
  }
}

function me(req, res) {
  return res.json({
    user: req.user.toSafeObject(),
  });
}

function logout(_req, res) {
  res.clearCookie("token");
  return res.json({ message: "Logged out successfully." });
}

export {
  signup,
  verifyOtp,
  login,
  me,
  logout,
};

const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');
const { protect, adminOnly } = require('../Middelwares/authMiddleware');
const { uploadAvatar } = require('../Middelwares/uploadMiddleware');
const { cloudinary } = require('../Middelwares/uploadMiddleware');

// Helper to generate JWT
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      res.status(400);
      throw new Error('User with this email already exists');
    }

    const user = await User.create({ name, email, password, phone });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id),
      },
    });
  })
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Please provide email and password');
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error('Your account has been deactivated');
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id),
      },
    });
  })
);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get(
  '/profile',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).lean();
    res.json({ success: true, data: user });
  })
);

// @route   PUT /api/auth/profile
// @desc    Update current user profile
// @access  Private
router.put(
  '/profile',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updated = await user.save();

    res.json({
      success: true,
      data: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        avatar: updated.avatar,
        token: generateToken(updated._id),
      },
    });
  })
);

// @route   PUT /api/auth/avatar
// @desc    Upload/update user avatar
// @access  Private
router.put(
  '/avatar',
  protect,
  uploadAvatar.single('avatar'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    // Delete old avatar from Cloudinary if exists
    if (user.avatar && user.avatar.public_id) {
      await cloudinary.uploader.destroy(user.avatar.public_id);
    }

    user.avatar = {
      public_id: req.file.filename,
      url: req.file.path,
    };

    await user.save();
    res.json({ success: true, data: user.avatar });
  })
);

// @route   GET /api/auth/users (Admin)
// @desc    Get all users
// @access  Admin
router.get(
  '/users',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: users.length, data: users });
  })
);

// @route   DELETE /api/auth/users/:id (Admin)
// @desc    Deactivate a user
// @access  Admin
router.delete(
  '/users/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }
    user.isActive = false;
    await user.save();
    res.json({ success: true, message: 'User deactivated successfully' });
  })
);

const { sendResetEmail } = require('../utils/emailBroadcaster');
const crypto = require('crypto');

// @route   POST /api/auth/forgot-password
// @desc    Request password reset link
// @access  Public
router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('User not found with this email');
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    // We assume the frontend has a /reset-password/:token route
    const resetUrl = `${req.get('origin')}/reset-password/${resetToken}`;

    try {
      await sendResetEmail({
        email: user.email,
        name: user.name,
        resetUrl
      });

      res.json({ success: true, message: 'Email sent successfully' });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      res.status(500);
      throw new Error('Email could not be sent');
    }
  })
);

// @route   PUT /api/auth/reset-password/:token
// @desc    Reset password
// @access  Public
router.put(
  '/reset-password/:token',
  asyncHandler(async (req, res) => {
    // Hash the token from the URL to match the one in DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired reset token');
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful' });
  })
);

module.exports = router;


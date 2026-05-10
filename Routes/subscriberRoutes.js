const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const nodemailer = require('nodemailer');
const Subscriber = require('../Models/Subscriber');
const { protect, adminOnly } = require('../Middelwares/authMiddleware');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// @route   POST /api/subscribers
// @desc    Subscribe to newsletter
// @access  Public
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      res.status(400);
      throw new Error('Please provide an email');
    }

    const subscriberExists = await Subscriber.findOne({ email });

    if (subscriberExists) {
      if (!subscriberExists.active) {
        subscriberExists.active = true;
        await subscriberExists.save();
        return res.status(200).json({ success: true, message: 'Welcome back! You have re-subscribed.' });
      }
      res.status(400);
      throw new Error('Email is already subscribed');
    }

    await Subscriber.create({ email });

    // Send confirmation email (non-blocking)
    transporter.sendMail({
      from: `"Matabbukhari Newsletter" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Matabbukhari Newsletter! 🌿',
      html: `
        <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 15px; max-width: 600px; margin: auto; border: 1px solid #c9a84c;">
          <h2 style="color: #c9a84c; text-align: center;">Welcome to the Family!</h2>
          <p>Hi there,</p>
          <p>Thank you for joining the <strong>Matabbukhari</strong> newsletter. You'll be the first to know about our new arrivals, special offers, and health tips.</p>
          <div style="background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 18px; color: #c9a84c;">Stay tuned for amazing updates!</p>
          </div>
          <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
            © ${new Date().getFullYear()} Matabbukhari. All rights reserved.
          </p>
        </div>
      `,
    }).catch((e) => console.error('Subscription email error:', e.message));

    res.status(201).json({ success: true, message: 'Successfully subscribed to newsletter!' });
  })
);

// @route   GET /api/subscribers
// @desc    Get all subscribers
// @access  Private/Admin
router.get(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const subscribers = await Subscriber.find({}).sort({ createdAt: -1 });
    res.json({ success: true, count: subscribers.length, data: subscribers });
  })
);

// @route   POST /api/subscribers/broadcast
// @desc    Send email to all subscribers
// @access  Private/Admin
router.post(
  '/broadcast',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { subject, message } = req.body;

    if (!subject || !message) {
      res.status(400);
      throw new Error('Please provide subject and message');
    }

    const subscribers = await Subscriber.find({ active: true });

    if (subscribers.length === 0) {
      res.status(400);
      throw new Error('No active subscribers found');
    }

    const emails = subscribers.map((s) => s.email);

    // Send broadcast email
    // Note: For many subscribers, consider using a queue or batching
    const mailOptions = {
      from: `"Matabbukhari" <${process.env.EMAIL_USER}>`,
      bcc: emails, // Use BCC to hide other emails
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 40px; border-radius: 15px; max-width: 600px; margin: auto; border: 1px solid #c9a84c;">
          <h2 style="color: #c9a84c; text-align: center;">${subject}</h2>
          <div style="font-size: 16px; line-height: 1.6;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <hr style="border: 0; border-top: 1px solid #333; margin: 30px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            You are receiving this email because you subscribed to Matabbukhari newsletter.
            <br>
            © ${new Date().getFullYear()} Matabbukhari.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: `Broadcast sent to ${emails.length} subscribers` });
  })
);

// @route   DELETE /api/subscribers/:id
// @desc    Delete subscriber
// @access  Private/Admin
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const subscriber = await Subscriber.findById(req.params.id);
    if (!subscriber) {
      res.status(404);
      throw new Error('Subscriber not found');
    }
    await subscriber.deleteOne();
    res.json({ success: true, message: 'Subscriber removed' });
  })
);

module.exports = router;

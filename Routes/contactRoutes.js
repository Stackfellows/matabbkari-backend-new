const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Contact = require('../Models/Contact');
const { protect, adminOnly } = require('../Middelwares/authMiddleware');
const transporter = require('../utils/emailTransporter');

// @route   POST /api/contact
// @access  Public
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, email, phone, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      res.status(400);
      throw new Error('Please fill in all required fields');
    }

    const contact = await Contact.create({ name, email, phone, subject, message });

    // Auto-reply to customer (non-blocking)
    transporter.sendMail({
      from: `"Matabbukhari Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `We received your message — ${subject}`,
      html: `<div style="font-family:Arial,sans-serif;background:#0a0a0a;color:#fff;padding:30px;border-radius:12px;max-width:580px;margin:auto"><h2 style="color:#c9a84c">شکریہ آپ کے پیغام کا</h2><p>Dear <strong>${name}</strong>,</p><p>We received your inquiry and will reply within <strong>24–48 hours</strong>.</p><blockquote style="background:#1a1a1a;padding:12px;border-left:3px solid #c9a84c;border-radius:6px">${message}</blockquote><p style="color:#888;font-size:12px;text-align:center;margin-top:20px">© ${new Date().getFullYear()} Matabbukhari</p></div>`,
    }).catch((e) => console.error('Auto-reply error:', e.message));

    // Notify admin (non-blocking)
    transporter.sendMail({
      from: `"Contact Form" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `📩 New Inquiry: ${subject}`,
      html: `<h3>New Contact Submission</h3><p><b>Name:</b> ${name}</p><p><b>Email:</b> ${email}</p><p><b>Phone:</b> ${phone || 'N/A'}</p><p><b>Subject:</b> ${subject}</p><p><b>Message:</b> ${message}</p>`,
    }).catch((e) => console.error('Admin notify error:', e.message));

    res.status(201).json({ success: true, message: 'Message sent. We will reply within 24–48 hours.' });
  })
);

// @route   GET /api/contact  — Admin only
router.get('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const { isRead, page = 1, limit = 20 } = req.query;
  const query = isRead !== undefined ? { isRead: isRead === 'true' } : {};
  const skip = (Number(page) - 1) * Number(limit);
  const total = await Contact.countDocuments(query);
  const contacts = await Contact.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
  res.json({ success: true, count: contacts.length, total, pages: Math.ceil(total / Number(limit)), data: contacts });
}));

// @route   PUT /api/contact/:id/read  — Admin only
router.put('/:id/read', protect, adminOnly, asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, { isRead: true, repliedAt: Date.now() }, { new: true });
  if (!contact) { res.status(404); throw new Error('Message not found'); }
  res.json({ success: true, data: contact });
}));

// @route   DELETE /api/contact/:id  — Admin only
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) { res.status(404); throw new Error('Message not found'); }
  res.json({ success: true, message: 'Message deleted' });
}));

module.exports = router;

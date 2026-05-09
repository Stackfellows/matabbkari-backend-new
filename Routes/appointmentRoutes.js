const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Appointment = require('../Models/Appointment');
const { protect, adminOnly } = require('../Middelwares/authMiddleware');
const { uploadAppointmentReports } = require('../Middelwares/uploadMiddleware');
const nodemailer = require('nodemailer');


// @route   POST /api/appointments
// @desc    Create a new appointment
// @access  Public
router.post(
  '/',
  uploadAppointmentReports.array('reports', 5),
  asyncHandler(async (req, res) => {
    const { fullName, email, phone, date, message, appointmentType } = req.body;

    const reports = req.files ? req.files.map(file => ({
      public_id: file.filename,
      url: file.path
    })) : [];

    const appointment = await Appointment.create({
      fullName,
      email,
      phone,
      date,
      message,
      appointmentType,
      reports
    });

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #2b5a41; text-align: center;">Appointment Booked!</h2>
        <p>Dear <strong>${fullName}</strong>,</p>
        <p>Your appointment has been successfully submitted. Our team will review your request and get back to you shortly.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
          <p><strong>Type:</strong> ${appointmentType}</p>
          <p><strong>Date:</strong> ${new Date(date).toLocaleDateString()}</p>
          <p><strong>Phone:</strong> ${phone}</p>
        </div>
        <p style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">© Matabbukhari — Premium Herbal Wellness</p>
      </div>
    `;

    transporter.sendMail({
      from: `"Matabbukhari" <${process.env.EMAIL_USER}>`,
      to: [email, process.env.EMAIL_USER].join(', '),
      subject: `📅 Appointment Received — ${fullName}`,
      html: emailHtml,
    }).catch(err => console.error('Appointment email error:', err));

    res.status(201).json({ success: true, data: appointment });
  })
);


// @route   GET /api/appointments
// @desc    Get all appointments (Admin)
// @access  Admin
router.get(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json({ success: true, data: appointments });
  })
);

// @route   PUT /api/appointments/:id/status
// @desc    Update appointment status (Admin)
// @access  Admin
router.put(
  '/:id/status',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    appointment.status = status;
    await appointment.save();

    res.json({ success: true, data: appointment });
  })
);

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment (Admin)
// @access  Admin
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      res.status(404);
      throw new Error('Appointment not found');
    }

    await appointment.deleteOne();
    res.json({ success: true, message: 'Appointment deleted' });
  })
);

module.exports = router;

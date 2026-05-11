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

    const appointmentData = {
      fullName,
      email,
      phone,
      date,
      message,
      appointmentType,
      reports
    };

    // Attach user if logged in
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        appointmentData.user = decoded.id;
      } catch (_) {}
    }

    const appointment = await Appointment.create(appointmentData);

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
      replyTo: process.env.EMAIL_USER,
      subject: `📅 Appointment Received — ${fullName}`,
      text: `Dear ${fullName},\n\nYour appointment for ${appointmentType} on ${new Date(date).toLocaleDateString()} has been received and is being reviewed.\n\n© Matabbukhari Wellness`,
      html: emailHtml,
    }).catch(err => console.error('Appointment email error:', err));

    res.status(201).json({ success: true, data: appointment });
  })
);

// @route   GET /api/appointments/my
// @desc    Get logged-in user's appointments
// @access  Private
router.get(
  '/my',
  protect,
  asyncHandler(async (req, res) => {
    // Search by both userId (if linked) and email
    const appointments = await Appointment.find({ 
      $or: [
        { user: req.user._id },
        { email: req.user.email }
      ]
    }).sort({ createdAt: -1 }).lean();
    
    res.json({ success: true, count: appointments.length, data: appointments });
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

    const oldStatus = appointment.status;
    appointment.status = status;
    await appointment.save();

    // Send email ONLY if status changed to 'Confirmed'
    if (status === 'Confirmed' && oldStatus !== 'Confirmed') {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      const confirmHtml = `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; color: #1a1a1a; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
             <h1 style="color: #2b5a41; margin: 0; font-size: 28px;">Appointment Confirmed!</h1>
             <p style="color: #666; margin-top: 5px;">Matabbukhari Luxury Wellness</p>
          </div>
          
          <p>As-salamu alaykum <strong>${appointment.fullName}</strong>,</p>
          <p>We are pleased to inform you that your consultation request has been <strong>Confirmed</strong> by our experts.</p>
          
          <div style="background: #f8faf9; padding: 25px; border-radius: 15px; border: 1px solid #e8edea; margin: 25px 0;">
            <h3 style="color: #2b5a41; margin-top: 0; border-bottom: 1px solid #d1dbd4; pb: 10px;">Booking Details</h3>
            <p style="margin: 10px 0;"><strong>Service:</strong> ${appointment.appointmentType}</p>
            <p style="margin: 10px 0;"><strong>Date:</strong> ${new Date(appointment.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p style="margin: 10px 0;"><strong>Patient Name:</strong> ${appointment.fullName}</p>
          </div>

          <p>Our Hakeem will contact you via your provided phone number (<strong>${appointment.phone}</strong>) at the scheduled time.</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px;">
            <p>If you need to reschedule, please contact us at least 24 hours in advance.</p>
            <p>© 2026 Matabbukhari. All Rights Reserved.</p>
          </div>
        </div>
      `;

      transporter.sendMail({
        from: `"Matabbukhari Support" <${process.env.EMAIL_USER}>`,
        to: appointment.email,
        replyTo: process.env.EMAIL_USER,
        subject: `✅ Appointment Confirmed — Matabbukhari`,
        text: `As-salamu alaykum ${appointment.fullName},\n\nYour appointment for ${appointment.appointmentType} on ${new Date(appointment.date).toLocaleDateString()} has been confirmed.\n\n© Matabbukhari Wellness`,
        html: confirmHtml,
      }).catch(err => console.error('Status Update Email Error:', err));
    }

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

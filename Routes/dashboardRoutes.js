const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Order = require('../Models/Order');
const User = require('../Models/User');
const Appointment = require('../Models/Appointment');
const Expense = require('../Models/Expense');
const { protect, adminOnly } = require('../Middelwares/authMiddleware');

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics (Admin)
// @access  Admin
router.get(
  '/stats',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const totalOrders = await Order.countDocuments();
    const registeredUsers = await User.countDocuments({ role: 'user' });
    const uniqueBuyers = await Order.distinct('shippingAddress.email');
    
    // Total customers = registered users + unique buyers who might not have accounts
    // We combine them and remove duplicates
    const userEmails = await User.find({ role: 'user' }).distinct('email');
    const allCustomerEmails = new Set([...userEmails, ...uniqueBuyers]);
    const totalUsers = allCustomerEmails.size;

    const totalAppointments = await Appointment.countDocuments();


    const orders = await Order.find();
    const totalSales = orders.reduce((acc, order) => acc + order.totalPrice, 0);

    const expenses = await Expense.find();
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

    res.json({

      success: true,
      data: {
        totalSales,
        totalOrders,
        totalUsers,
        totalAppointments,
        totalExpenses
      }
    });

  })
);


module.exports = router;

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
// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics (Admin)
// @access  Admin
router.get(
  '/stats',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    // Parallelize all independent counts and aggregations
    const [
      totalOrders,
      totalUsersCount,
      uniqueBuyers,
      totalAppointments,
      salesResult,
      expenseResult
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Order.distinct('shippingAddress.email'),
      Appointment.countDocuments(),
      // Use aggregation for total sales (much faster than fetching all and reducing)
      Order.aggregate([
        { $group: { _id: null, total: { $sum: '$totalPrice' } } }
      ]),
      // Use aggregation for total expenses
      Expense.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Total sales and expenses from aggregation results
    const totalSales = salesResult.length > 0 ? salesResult[0].total : 0;
    const totalExpenses = expenseResult.length > 0 ? expenseResult[0].total : 0;

    // Total users logic (registered + unique guest buyers)
    // Note: This still fetches user emails, which is fine for small/medium sets
    const userEmails = await User.find({ role: 'user' }).distinct('email');
    const allCustomerEmails = new Set([...userEmails, ...uniqueBuyers]);
    const totalUsers = allCustomerEmails.size;

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

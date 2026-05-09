const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Expense = require('../Models/Expense');
const { protect, adminOnly } = require('../Middelwares/authMiddleware');

// @route   POST /api/expenses
// @desc    Add a new expense
// @access  Admin
router.post(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { title, amount, category, date, description } = req.body;
    const expense = await Expense.create({ title, amount, category, date, description });
    res.status(201).json({ success: true, data: expense });
  })
);

// @route   GET /api/expenses
// @desc    Get all expenses
// @access  Admin
router.get(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json({ success: true, count: expenses.length, data: expenses });
  })
);

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Admin
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      res.status(404);
      throw new Error('Expense not found');
    }
    await expense.deleteOne();
    res.json({ success: true, message: 'Expense deleted' });
  })
);

module.exports = router;

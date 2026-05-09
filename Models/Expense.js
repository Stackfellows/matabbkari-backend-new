const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { 
    type: String, 
    required: true,
    enum: ['Inventory', 'Marketing', 'Utilities', 'Salaries', 'Rent', 'Other']
  },
  date: { type: Date, default: Date.now },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);

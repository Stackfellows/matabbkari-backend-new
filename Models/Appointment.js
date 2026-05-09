const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },

  date: { type: Date, required: true },
  message: { type: String },
  appointmentType: { 
    type: String, 
    enum: ['physical', 'online'], 
    default: 'physical' 
  },
  reports: [{
    public_id: String,
    url: String,
  }],
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);

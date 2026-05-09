const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  discountText: { type: String },
  image: {
    public_id: { type: String },
    url: { type: String }
  },
  link: { type: String, default: '/shop' },
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);

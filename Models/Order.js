const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name: { type: String, required: true },
  image: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    customOrderId: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // For guest orders
    guestInfo: {
      name: String,
      email: String,
      phone: String,
    },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String, required: true },
      email: { type: String },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      province: String,
      postalCode: String,
      country: { type: String, default: 'Pakistan' },
    },
    paymentMethod: {
      type: String,
      enum: ['Cash on Delivery', 'JazzCash', 'EasyPaisa', 'Bank Transfer'],
      default: 'Cash on Delivery',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    transactionId: String,
    paymentScreenshot: {
      public_id: String,
      url: String,
    },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Pending',
    },
    itemsPrice: { type: Number, required: true, default: 0 },
    shippingPrice: { type: Number, required: true, default: 0 },
    totalPrice: { type: Number, required: true, default: 0 },
    trackingNumber: String,
    notes: String,
    deliveredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);

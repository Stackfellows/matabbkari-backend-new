const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const Order = require('../Models/Order');
const { protect, adminOnly } = require('../Middelwares/authMiddleware');
const nodemailer = require('nodemailer');
const { uploadPaymentScreenshot } = require('../Middelwares/uploadMiddleware');

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send order confirmation email
const sendOrderConfirmationEmail = async (order) => {
  const recipientEmail = order.user
    ? order.guestInfo?.email
    : order.guestInfo?.email;

  if (!recipientEmail && !order.shippingAddress) return;

  const email = recipientEmail || order.shippingAddress.email || order.guestInfo?.email;
  if (!email) return;

  const itemsList = order.orderItems
    .map((item) => `<li>${item.name} × ${item.quantity} — Rs. ${item.price * item.quantity}</li>`)
    .join('');

  const orderIdToDisplay = order.customOrderId || order._id.toString().slice(-8).toUpperCase();

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background-color: #1a3626; padding: 40px 20px; text-align: center; }
        .header h1 { color: #d4af37; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; }
        .header p { color: #a9bfae; margin: 10px 0 0 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
        .content { padding: 40px; color: #333333; }
        .greeting { font-size: 18px; font-weight: 300; margin-bottom: 20px; color: #1a3626; }
        .order-title { font-size: 14px; text-transform: uppercase; color: #888888; letter-spacing: 1px; border-bottom: 1px solid #eeeeee; padding-bottom: 10px; margin-bottom: 20px; }
        .item-list { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .item-list th { text-align: left; padding: 12px 0; border-bottom: 1px solid #eeeeee; color: #1a3626; font-weight: 500; font-size: 14px; }
        .item-list td { padding: 15px 0; border-bottom: 1px solid #eeeeee; font-size: 14px; }
        .item-name { font-weight: 500; color: #333333; }
        .item-price { text-align: right; color: #1a3626; font-weight: 500; }
        .totals { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .totals td { padding: 10px 0; font-size: 14px; color: #555555; }
        .totals .label { text-align: right; padding-right: 20px; }
        .totals .amount { text-align: right; font-weight: 500; color: #1a3626; width: 100px; }
        .totals .grand-total { font-size: 18px; font-weight: bold; color: #d4af37; border-top: 2px solid #1a3626; padding-top: 15px; }
        .totals .grand-total-label { font-size: 16px; font-weight: bold; color: #1a3626; border-top: 2px solid #1a3626; padding-top: 15px; }
        .details-box { background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 30px; }
        .details-box h4 { margin: 0 0 10px 0; color: #1a3626; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
        .details-box p { margin: 5px 0; font-size: 14px; color: #666666; line-height: 1.5; }
        .footer { background-color: #1a3626; padding: 30px; text-align: center; }
        .footer p { color: #a9bfae; font-size: 12px; margin: 0 0 10px 0; }
        .footer a { color: #d4af37; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Matabbukhari</h1>
          <p>Premium Herbal Wellness</p>
        </div>
        <div class="content">
          <div class="greeting">Dear ${order.shippingAddress.fullName},</div>
          <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">Thank you for choosing Matabbukhari. We are delighted to confirm that your order has been successfully received and is currently being prepared with the utmost care.</p>
          
          <div class="order-title">Order Summary — #${orderIdToDisplay}</div>
          
          <table class="item-list">
            <thead>
              <tr>
                <th>Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems.map(item => `
                <tr>
                  <td class="item-name">${item.name}</td>
                  <td style="text-align: center; color: #666;">${item.quantity}</td>
                  <td class="item-price">Rs. ${(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <table class="totals">
            <tr>
              <td class="label">Subtotal</td>
              <td class="amount">Rs. ${order.itemsPrice.toLocaleString()}</td>
            </tr>
            <tr>
              <td class="label">Shipping</td>
              <td class="amount">Rs. ${order.shippingPrice.toLocaleString()}</td>
            </tr>
            <tr>
              <td class="label grand-total-label">Grand Total</td>
              <td class="amount grand-total">Rs. ${order.totalPrice.toLocaleString()}</td>
            </tr>
          </table>
          
          <div class="details-box">
            <h4>Shipping & Payment</h4>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            <p><strong>Delivery To:</strong><br/>
              ${order.shippingAddress.street}<br/>
              ${order.shippingAddress.city}, ${order.shippingAddress.country || 'Pakistan'}<br/>
              Phone: ${order.shippingAddress.phone}
            </p>
          </div>
          
          <p style="color: #666; line-height: 1.6; text-align: center; font-style: italic; margin-top: 40px;">"Wellness rooted in tradition, delivered with luxury."</p>
        </div>
        <div class="footer">
          <p>If you have any questions, please reply to this email or contact our support.</p>
          <p>&copy; ${new Date().getFullYear()} <a href="https://matabbukhari.com">Matabbukhari</a>. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Matabbukhari" <${process.env.EMAIL_USER}>`,
    to: [email, process.env.EMAIL_USER].join(', '),
    subject: `✅ Order Confirmed — #${orderIdToDisplay}`,
    html: emailHtml,
  });
};

// Send order status update email
const sendStatusUpdateEmail = async (order, type, newStatus) => {
  const recipientEmail = order.user
    ? order.guestInfo?.email
    : order.guestInfo?.email;

  const email = recipientEmail || order.shippingAddress?.email || order.guestInfo?.email;
  if (!email) return;

  const orderIdToDisplay = order.customOrderId || order._id.toString().slice(-8).toUpperCase();
  
  let subject = '';

  if (type === 'payment') {
    if (newStatus === 'Failed') {
      subject = `⚠️ Payment Failed for Order #${orderIdToDisplay}`;
    } else if (newStatus === 'Paid') {
      subject = `✅ Payment Received for Order #${orderIdToDisplay}`;
    } else {
      return;
    }
  } else if (type === 'order') {
    subject = `📦 Order Update: ${newStatus} — #${orderIdToDisplay}`;
  }

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Update</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background-color: #1a3626; padding: 40px 20px; text-align: center; }
        .header h1 { color: #d4af37; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; }
        .header p { color: #a9bfae; margin: 10px 0 0 0; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
        .content { padding: 40px 40px 60px 40px; color: #333333; text-align: center; }
        .greeting { font-size: 18px; font-weight: 300; margin-bottom: 20px; color: #1a3626; text-align: left; }
        .status-box { display: inline-block; padding: 15px 30px; border: 2px solid #d4af37; border-radius: 4px; color: #d4af37; font-size: 20px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin: 20px 0; }
        .status-box.failed { border-color: #ef4444; color: #ef4444; }
        .status-box.success { border-color: #22c55e; color: #22c55e; }
        .message { color: #666; line-height: 1.8; font-size: 15px; margin-bottom: 20px; }
        .tracking-box { background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin-top: 30px; text-align: center; }
        .tracking-box h4 { margin: 0 0 10px 0; color: #1a3626; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .tracking-box p { margin: 0; font-size: 18px; font-weight: bold; color: #333; letter-spacing: 2px; }
        .footer { background-color: #1a3626; padding: 30px; text-align: center; }
        .footer p { color: #a9bfae; font-size: 12px; margin: 0 0 10px 0; }
        .footer a { color: #d4af37; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Matabbukhari</h1>
          <p>Premium Herbal Wellness</p>
        </div>
        <div class="content">
          <div class="greeting">Dear ${order.shippingAddress?.fullName || 'Customer'},</div>
          
          ${type === 'payment' && newStatus === 'Failed' ? `
            <div class="status-box failed">Payment Failed</div>
            <p class="message">We encountered an issue processing the payment for your recent order <strong>#${orderIdToDisplay}</strong>.</p>
            <p class="message">Please contact our support team to resolve this issue and complete your purchase securely.</p>
          ` : type === 'payment' && newStatus === 'Paid' ? `
            <div class="status-box success">Payment Successful</div>
            <p class="message">We have successfully received your payment for order <strong>#${orderIdToDisplay}</strong>.</p>
            <p class="message">Your order is now being processed and prepared for dispatch.</p>
          ` : `
            <div class="status-box">${newStatus}</div>
            <p class="message">The status of your order <strong>#${orderIdToDisplay}</strong> has been updated.</p>
            <p class="message">We are committed to delivering luxury herbal wellness straight to your doorstep.</p>
            
            ${order.trackingNumber ? `
              <div class="tracking-box">
                <h4>Tracking Number</h4>
                <p>${order.trackingNumber}</p>
              </div>
            ` : ''}
          `}
        </div>
        <div class="footer">
          <p>If you have any questions, please reply to this email or contact our support.</p>
          <p>&copy; ${new Date().getFullYear()} <a href="https://matabbukhari.com">Matabbukhari</a>. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Matabbukhari" <${process.env.EMAIL_USER}>`,
    to: [email, process.env.EMAIL_USER].join(', '),
    subject,
    html: emailHtml,
  });
};
// @route   POST /api/orders
// @desc    Create a new order (guest or authenticated)
// @access  Public
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      orderItems, shippingAddress, paymentMethod,
      itemsPrice, shippingPrice, totalPrice, guestInfo,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items provided');
    }

    // Generate Custom Order ID
    const count = await Order.countDocuments();
    const customOrderId = `matabbukhari${String(count + 1).padStart(3, '0')}`;

    const orderData = {
      customOrderId,
      orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      itemsPrice,
      shippingPrice,
      totalPrice,
      guestInfo,
    };

    // Attach user if logged in
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      const jwt = require('jsonwebtoken');
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        orderData.user = decoded.id;
      } catch (_) {}
    }

    const order = await Order.create(orderData);

    // Send confirmation email (non-blocking)
    sendOrderConfirmationEmail(order).catch((err) =>
      console.error('Email send error:', err.message)
    );

    res.status(201).json({ success: true, data: order });
  })
);

// @route   PUT /api/orders/:id/pay
// @desc    Submit payment screenshot and transaction ID
// @access  Public
router.put(
  '/:id/pay',
  uploadPaymentScreenshot.single('screenshot'),
  asyncHandler(async (req, res) => {
    const { transactionId } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (transactionId) order.transactionId = transactionId;
    
    if (req.file) {
      order.paymentScreenshot = {
        public_id: req.file.filename,
        url: req.file.path,
      };
      order.paymentStatus = 'Paid'; // Automatically set to paid or pending review
    }

    await order.save();
    res.json({ success: true, data: order });
  })
);

// @route   GET /api/orders/my
// @desc    Get logged-in user's orders
// @access  Private
router.get(
  '/my',
  protect,
  asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  })
);

// @route   GET /api/orders/track/:id
// @desc    Track order by ID or customOrderId (public — for order tracking page)
// @access  Public
router.get(
  '/track/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { customOrderId: req.params.id }
      ]
    }).select(
      'customOrderId orderStatus paymentStatus shippingAddress orderItems trackingNumber totalPrice createdAt deliveredAt'
    );
    if (!order) {
      res.status(404);
      throw new Error('Order not found. Please check your Order ID.');
    }
    res.json({ success: true, data: order });
  })
);

// @route   GET /api/orders (Admin)
// @desc    Get all orders
// @access  Admin
router.get(
  '/',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { orderStatus: status } : {};
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / Number(limit)),
      data: orders,
    });
  })
);

// @route   GET /api/orders/:id (Admin)
// @desc    Get single order details
// @access  Admin
router.get(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email phone');
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    res.json({ success: true, data: order });
  })
);

// @route   PUT /api/orders/:id/status (Admin)
// @desc    Update order status
// @access  Admin
router.put(
  '/:id/status',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { orderStatus, trackingNumber, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    let statusChanged = false;
    let paymentChanged = false;

    if (orderStatus && order.orderStatus !== orderStatus) {
      order.orderStatus = orderStatus;
      statusChanged = true;
    }
    
    if (paymentStatus && order.paymentStatus !== paymentStatus) {
      order.paymentStatus = paymentStatus;
      paymentChanged = true;
    }
    
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (orderStatus === 'Delivered') order.deliveredAt = Date.now();

    await order.save();

    // Send emails asynchronously
    if (statusChanged) {
      sendStatusUpdateEmail(order, 'order', orderStatus).catch(err => console.error('Email error:', err));
    }
    if (paymentChanged) {
      sendStatusUpdateEmail(order, 'payment', paymentStatus).catch(err => console.error('Email error:', err));
    }

    res.json({ success: true, data: order });
  })
);

// @route   DELETE /api/orders/:id (Admin)
// @desc    Delete an order
// @access  Admin
router.delete(
  '/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    await order.deleteOne();
    res.json({ success: true, message: 'Order deleted successfully' });
  })
);

module.exports = router;

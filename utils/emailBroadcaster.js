const Subscriber = require('../Models/Subscriber');
const transporter = require('./emailTransporter');
const path = require('path');

const sendBroadcastEmail = async ({ subject, title, body, imageUrl }) => {
  try {
    const subscribers = await Subscriber.find({ active: true });
    if (subscribers.length === 0) return;

    const emails = subscribers.map((s) => s.email);

    const mailOptions = {
      from: `"Matabbukhari Wellness" <${process.env.EMAIL_USER}>`,
      bcc: emails,
      replyTo: process.env.EMAIL_USER,
      subject: subject,
      text: `${title}\n\n${body}\n\nVisit us at: https://matabbukhari.com`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #f4f7f5;
              font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              width: 100%;
              background-color: #f4f7f5;
              padding: 20px 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            }
            .banner-img {
              width: 100%;
              height: auto;
              display: block;
            }
            .content {
              padding: 40px 30px;
              color: #2c3e50;
            }
            .brand-tag {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #c9a84c;
              margin-bottom: 12px;
            }
            .content-title {
              font-size: 24px;
              font-weight: 700;
              color: #1a3a2a;
              margin: 0 0 20px 0;
              line-height: 1.3;
            }
            .body-text {
              font-size: 15px;
              line-height: 1.7;
              color: #4a5568;
              margin-bottom: 30px;
            }
            .product-img-container {
              text-align: center;
              margin: 25px 0;
            }
            .product-image {
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
            }
            .cta-container {
              text-align: center;
              margin-top: 30px;
            }
            .cta-button {
              background-color: #2b5a41;
              color: #ffffff !important;
              padding: 16px 36px;
              text-decoration: none;
              border-radius: 30px;
              font-weight: 700;
              display: inline-block;
              letter-spacing: 1px;
              text-transform: uppercase;
              font-size: 13px;
              transition: all 0.3s ease;
              box-shadow: 0 6px 20px rgba(43, 90, 65, 0.25);
            }
            .footer {
              background-color: #1a1a1a;
              color: #a0aec0;
              padding: 40px 30px;
              text-align: center;
              font-size: 12px;
              line-height: 1.6;
            }
            .social-links {
              margin-bottom: 20px;
            }
            .social-link {
              color: #c9a84c;
              text-decoration: none;
              margin: 0 10px;
              font-weight: 600;
            }
            .address {
              color: #718096;
              margin-top: 15px;
              border-top: 1px solid #2d3748;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="email-container">
              <!-- Header Banner -->
              <img src="https://res.cloudinary.com/ddkuwdplt/image/upload/v1781758773/bill-recpt_cslryn.png" alt="Matabbukhari Banner" class="banner-img" />
              
              <div class="content">
                <div class="brand-tag">Premium Herbal Wellness</div>
                <h1 class="content-title">${title}</h1>
                
                ${imageUrl ? `
                  <div class="product-img-container">
                    <img src="${imageUrl}" alt="Product" class="product-image" />
                  </div>
                ` : ''}
                
                <div class="body-text">
                  ${body.replace(/\n/g, '<br>')}
                </div>

                <div class="cta-container">
                  <a href="https://matabbukhari.com" class="cta-button">Explore More</a>
                </div>
              </div>

              <div class="footer">
                <div class="social-links">
                  <a href="https://facebook.com/matabbukhari" class="social-link">Facebook</a>
                  <a href="https://instagram.com/matabbukhari" class="social-link">Instagram</a>
                </div>
                <p>© ${new Date().getFullYear()} Matabbukhari Wellness. All rights reserved.</p>
                <p>You're receiving this because you're subscribed to our natural healing updates.</p>
                <p class="address">82-C Habib Park Multan Chungi Mansoorah, Lahore, Pakistan</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Broadcast email sent to ${emails.length} subscribers: ${subject}`);
  } catch (error) {
    console.error('Broadcast email error:', error.message);
  }
};

const sendResetEmail = async ({ email, resetUrl, name }) => {
  try {
    const mailOptions = {
      from: `"Matabbukhari Support" <${process.env.EMAIL_USER}>`,
      to: email,
      replyTo: process.env.EMAIL_USER,
      subject: '🔐 Password Reset Request — Matabbukhari',
      text: `As-salamu alaykum ${name},\n\nYou requested a password reset. Please use the following link to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\n© Matabbukhari Wellness`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              background-color: #f4f7f5;
              font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              width: 100%;
              background-color: #f4f7f5;
              padding: 20px 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
            }
            .banner-img {
              width: 100%;
              height: auto;
              display: block;
            }
            .content {
              padding: 40px 30px;
              color: #2c3e50;
            }
            .brand-tag {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 2px;
              color: #c9a84c;
              margin-bottom: 12px;
            }
            .content-title {
              font-size: 22px;
              font-weight: 700;
              color: #1a3a2a;
              margin: 0 0 20px 0;
              line-height: 1.3;
            }
            .body-text {
              font-size: 15px;
              line-height: 1.7;
              color: #4a5568;
              margin-bottom: 30px;
            }
            .cta-container {
              text-align: center;
              margin-top: 30px;
            }
            .cta-button {
              background-color: #2b5a41;
              color: #ffffff !important;
              padding: 15px 35px;
              text-decoration: none;
              border-radius: 30px;
              font-weight: 700;
              display: inline-block;
              font-size: 14px;
              transition: all 0.3s ease;
              box-shadow: 0 6px 20px rgba(43, 90, 65, 0.25);
            }
            .warning {
              color: #e53e3e;
              font-size: 13px;
              margin-top: 25px;
              background-color: #fff5f5;
              padding: 12px;
              border-radius: 8px;
              border-left: 4px solid #e53e3e;
            }
            .footer {
              background-color: #1a1a1a;
              color: #a0aec0;
              padding: 40px 30px;
              text-align: center;
              font-size: 12px;
              line-height: 1.6;
            }
            .social-links {
              margin-bottom: 20px;
            }
            .social-link {
              color: #c9a84c;
              text-decoration: none;
              margin: 0 10px;
              font-weight: 600;
            }
            .address {
              color: #718096;
              margin-top: 15px;
              border-top: 1px solid #2d3748;
              padding-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="email-container">
              <!-- Header Banner -->
              <img src="https://res.cloudinary.com/ddkuwdplt/image/upload/v1781758773/bill-recpt_cslryn.png" alt="Matabbukhari Banner" class="banner-img" />
              
              <div class="content">
                <div class="brand-tag">Account Security</div>
                <h1 class="content-title">Password Reset Request</h1>
                
                <div class="body-text">
                  <p>As-salamu alaykum <strong>${name}</strong>,</p>
                  <p>We received a request to reset your password. Click the button below to secure your account and set a new password:</p>
                </div>

                <div class="cta-container">
                  <a href="${resetUrl}" class="cta-button">Reset Password</a>
                </div>

                <div class="warning">
                  <strong>Important:</strong> This link will expire in 1 hour. If you did not make this request, you can safely ignore this email.
                </div>
              </div>

              <div class="footer">
                <div class="social-links">
                  <a href="https://facebook.com/matabbukhari" class="social-link">Facebook</a>
                  <a href="https://instagram.com/matabbukhari" class="social-link">Instagram</a>
                </div>
                <p>© ${new Date().getFullYear()} Matabbukhari Wellness. All rights reserved.</p>
                <p class="address">82-C Habib Park Multan Chungi Mansoorah, Lahore, Pakistan</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Reset email error:', error.message);
    throw new Error('Email could not be sent');
  }
};

module.exports = { sendBroadcastEmail, sendResetEmail };


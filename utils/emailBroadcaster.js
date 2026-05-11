const nodemailer = require('nodemailer');
const Subscriber = require('../Models/Subscriber');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

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
          <style>
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              background-color: #f9f9f9;
              color: #333;
            }
            .header {
              background-color: #0a0a0a;
              padding: 40px 20px;
              text-align: center;
              border-bottom: 3px solid #c9a84c;
            }
            .logo {
              width: 150px;
              height: auto;
              margin-bottom: 10px;
            }
            .brand-tagline {
              color: #c9a84c;
              font-size: 12px;
              letter-spacing: 3px;
              text-transform: uppercase;
              font-weight: bold;
            }
            .hero-section {
              background-color: #ffffff;
              padding: 50px 40px;
              text-align: center;
            }
            .content-title {
              color: #0a0a0a;
              font-size: 28px;
              margin-bottom: 20px;
              font-weight: 700;
              line-height: 1.2;
            }
            .product-image {
              width: 100%;
              max-width: 520px;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              margin: 20px 0;
            }
            .body-text {
              font-size: 16px;
              line-height: 1.8;
              color: #555;
              text-align: left;
              margin-bottom: 30px;
            }
            .cta-container {
              text-align: center;
              padding: 40px 20px;
              background-color: #ffffff;
            }
            .cta-button {
              background-color: #2b5a41;
              color: #ffffff !important;
              padding: 18px 40px;
              text-decoration: none;
              border-radius: 50px;
              font-weight: bold;
              display: inline-block;
              letter-spacing: 1px;
              text-transform: uppercase;
              font-size: 14px;
              box-shadow: 0 4px 15px rgba(43, 90, 65, 0.3);
            }
            .footer {
              background-color: #0a0a0a;
              color: #888;
              padding: 40px 20px;
              text-align: center;
              font-size: 12px;
            }
            .social-icons {
              margin-bottom: 20px;
            }
            .social-icon {
              display: inline-block;
              margin: 0 10px;
              color: #c9a84c;
              text-decoration: none;
            }
            .divider {
              height: 1px;
              background-color: #333;
              margin: 30px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <img src="https://matabbukhari.com/logo.png" alt="Matabbukhari" class="logo">
              <div class="brand-tagline">Tradition of Natural Healing</div>
            </div>
            
            <div class="hero-section">
              <h1 class="content-title">${title}</h1>
              
              ${imageUrl ? `<img src="${imageUrl}" alt="Update" class="product-image">` : ''}
              
              <div class="body-text">
                ${body.replace(/\n/g, '<br>')}
              </div>
            </div>

            <div class="cta-container">
              <a href="https://matabbukhari.com" class="cta-button">Explore More</a>
            </div>

            <div class="footer">
              <div class="social-icons">
                <a href="#" class="social-icon">Facebook</a>
                <a href="#" class="social-icon">Instagram</a>
                <a href="#" class="social-icon">Twitter</a>
              </div>
              <p>© ${new Date().getFullYear()} Matabbukhari. All rights reserved.</p>
              <p>You're receiving this because you're a valued member of our wellness community.</p>
              <div class="divider"></div>
              <p>82-C Habib Park Multan Chungi Mansoorah, Lahore, Pakistan</p>
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
          <style>
            .container { max-width: 600px; margin: 0 auto; font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #ffffff; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { width: 120px; margin-bottom: 10px; }
            .content { color: #333; line-height: 1.6; }
            .button-container { text-align: center; margin: 35px 0; }
            .button { background-color: #2b5a41; color: #ffffff !important; padding: 15px 35px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #888; font-size: 12px; }
            .warning { color: #e74c3c; font-size: 13px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2 style="color: #2b5a41;">Matabbukhari</h2>
            </div>
            <div class="content">
              <p>As-salamu alaykum <strong>${name}</strong>,</p>
              <p>You are receiving this email because a password reset request was made for your account. Please click the button below to reset your password:</p>
              
              <div class="button-container">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>

              <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
              
              <p class="warning">This link will expire in 1 hour for your security.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Matabbukhari Wellness. Lahore, Pakistan.</p>
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

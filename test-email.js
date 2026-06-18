const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const run = async () => {
  try {
    console.log('Sending test email to:', process.env.EMAIL_USER);
    
    // We will test 2 methods:
    // Method 1: Using the Cloudinary URL directly in the HTML tag
    // Method 2: Using the local CID attachment
    
    const mailOptions = {
      from: `"Matabbukhari Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Matabbukhari Email Banner Test',
      html: `
        <h3>Matabbukhari Email Banner Test</h3>
        <p>This email tests different ways of displaying the header banner.</p>
        
        <h4>1. Cloudinary Direct Link (Without q_auto/f_auto transformations):</h4>
        <img src="https://res.cloudinary.com/ddkuwdplt/image/upload/v1781758773/bill-recpt_cslryn.png" alt="Cloudinary Direct (No Trans)" style="width: 100%; max-width: 600px; display: block;" />
        
        <h4>2. Cloudinary Link with q_auto,f_auto (Corrected Comma):</h4>
        <img src="https://res.cloudinary.com/ddkuwdplt/image/upload/q_auto,f_auto/v1781758773/bill-recpt_cslryn.png" alt="Cloudinary Corrected Comma" style="width: 100%; max-width: 600px; display: block;" />

        <h4>3. Local CID Attachment (bill-recpt.png):</h4>
        <img src="cid:local_bill_recpt" alt="Local CID Attachment" style="width: 100%; max-width: 600px; display: block;" />
      `,
      attachments: [
        {
          filename: 'bill-recpt.png',
          path: path.join(__dirname, 'images/bill-recpt.png'),
          cid: 'local_bill_recpt'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully! Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

run();

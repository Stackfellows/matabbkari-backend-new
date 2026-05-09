const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage for products
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'matabbukhari/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// Cloudinary storage for avatars
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'matabbukhari/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
  },
});

// Cloudinary storage for payments
const paymentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'matabbukhari/amount',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

// Cloudinary storage for appointments
const appointmentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'matabbukhari/appointments',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
  },
});

// Cloudinary storage for offers
const offerStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Matabbukhari/Offers',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const uploadProductImage = multer({ storage: productStorage });
const uploadAvatar = multer({ storage: avatarStorage });
const uploadPaymentScreenshot = multer({ storage: paymentStorage });
const uploadAppointmentReports = multer({ storage: appointmentStorage });
const uploadOfferImage = multer({ storage: offerStorage });

module.exports = { 
  cloudinary, 
  uploadProductImage, 
  uploadAvatar, 
  uploadPaymentScreenshot,
  uploadAppointmentReports,
  uploadOfferImage
};

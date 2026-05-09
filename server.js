const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load env vars FIRST before anything else
dotenv.config();

const connectDB = require('./DB/db');
const { notFound, errorHandler } = require('./Middelwares/errorMiddleware');

// Route imports
const authRoutes    = require('./Routes/authRoutes');
const productRoutes = require('./Routes/productRoutes');
const orderRoutes   = require('./Routes/orderRoutes');
const contactRoutes = require('./Routes/contactRoutes');
const aiRoutes      = require('./Routes/aiRoutes');
const appointmentRoutes = require('./Routes/appointmentRoutes');
const dashboardRoutes = require('./Routes/dashboardRoutes');
const expenseRoutes = require('./Routes/expenseRoutes');
const offerRoutes   = require('./Routes/offerRoutes');

// Connect to MongoDB
connectDB();

const app = express();

// ─── Core Middleware ─────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://matabbukhari.vercel.app',
    'https://matabbukhari.netlify.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🌿 Matabbukhari API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth:         '/api/auth',
      products:     '/api/products',
      orders:       '/api/orders',
      contact:      '/api/contact',
      ai:           '/api/ai',
      appointments: '/api/appointments',
      dashboard:    '/api/dashboard',
      expenses:     '/api/expenses',
      offers:       '/api/offers',
    },
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'OK', uptime: process.uptime() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/contact',  contactRoutes);
app.use('/api/ai',       aiRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/expenses',  expenseRoutes);
app.use('/api/offers',    offerRoutes);

// ─── Error Handlers (must be LAST) ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3300;
const server = app.listen(PORT, () => {
  console.log(`\n🚀  Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`📡  Health: http://localhost:${PORT}/api/health\n`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error('❌  Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

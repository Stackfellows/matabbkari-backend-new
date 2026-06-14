const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cluster = require('cluster');
const os = require('os');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

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
const subscriberRoutes = require('./Routes/subscriberRoutes');
const testimonialRoutes = require('./Routes/testimonialRoutes');

const app = express();

// ─── Core Middleware ─────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://matabbukhari.vercel.app',
    'https://matabbukhari.netlify.app',
    'https://matabbukhari.com',
    'https://www.matabbukhari.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Security & Performance Middleware ───────────────────────────────────────
app.use(compression()); // Compress response bodies
app.use(helmet()); // Secure HTTP headers
app.use(mongoSanitize()); // Prevent NoSQL Injection

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per `window`
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api', limiter);



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
      subscribers:  '/api/subscribers',
      testimonials: '/api/testimonials',
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
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/testimonials', testimonialRoutes);

// ─── Error Handlers (must be LAST) ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Connect & Start ────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3300;

const isMaster = cluster.isPrimary || cluster.isMaster;

if (isMaster) {
  const numCPUs = os.cpus().length;
  console.log(`\n👨‍💼 Primary cluster setting up ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('online', (worker) => {
    console.log(`👷 Worker ${worker.process.pid} is online`);
  });

  cluster.on('exit', (worker, code, signal) => {
    console.log(`❌ Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  connectDB().then(() => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Worker ${process.pid} running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    process.on('unhandledRejection', (err) => {
      console.error(`❌ Worker ${process.pid} Unhandled Rejection:`, err.message);
      server.close(() => process.exit(1));
    });
  });
}

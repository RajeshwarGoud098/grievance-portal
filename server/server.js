const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');

dotenv.config();

const authRoutes       = require('./routes/auth');
const complaintRoutes  = require('./routes/complaints');
const departmentRoutes = require('./routes/departments');
const userRoutes       = require('./routes/users');

const { requestLogger, errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

/* ------------------------------------------------------------------ */
/*  Core Middleware                                                      */
/* ------------------------------------------------------------------ */
// Issue #8: CORS URL from environment variable
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger); // Issue #15: HTTP request logging

/* ------------------------------------------------------------------ */
/*  Routes                                                              */
/* ------------------------------------------------------------------ */
app.use('/api/auth',        authRoutes);
app.use('/api/complaints',  complaintRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users',       userRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

/* ------------------------------------------------------------------ */
/*  Error Handling (Issue #9 — must be LAST)                           */
/* ------------------------------------------------------------------ */
app.use(notFound);
app.use(errorHandler);

/* ------------------------------------------------------------------ */
/*  Connect & Start                                                      */
/* ------------------------------------------------------------------ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

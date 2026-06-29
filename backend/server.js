import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

import authRoutes from './routes/authRoutes.js';
import apiRoutes from './routes/apiRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Auth routes (public)
app.use('/api/auth', authRoutes);

// JWT Middleware for protected routes
app.use('/api', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded; // { id }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

// Protected data routes
app.use('/api', apiRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Nexus PM Backend is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

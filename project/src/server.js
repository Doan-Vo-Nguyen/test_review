const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');  // Import route đăng ký và đăng nhập
const userRoutes = require('./routes/userRoutes');  // Import route quản lý người dùng
const examRoutes = require('./routes/examRoutes');  // Import route quản lý đề thi
const practiceRoutes = require('./routes/practiceRoutes');  // Import route luyện tập
const resultRoutes = require('./routes/resultRoutes');  // Import route quản lý kết quả thi
const connection = require('./config/init-db');  // Kết nối MySQL

const app = express();

// CORS middleware configuration - Fixed
app.use(cors({
  origin: [
    'http://127.0.0.1:3000', 
    'http://localhost:3000', 
    'http://localhost:5500', 
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Handle preflight requests explicitly
// app.options('*', cors());
app.use(express.json());

// Middleware để xử lý JSON trong request body
app.use(bodyParser.json());

// Additional middleware for parsing URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Sử dụng các route đã khai báo
app.use('/api/auth', authRoutes);  // Route cho đăng ký và đăng nhập
app.use('/api/user', userRoutes);  // API quản lý người dùng - Updated to match frontend
app.use('/api/exams', examRoutes);  // API quản lý đề thi - Updated to match frontend
app.use('/api/practice', practiceRoutes);  // API quản lý luyện tập - Updated to match frontend
app.use('/api/results', resultRoutes);  // API quản lý kết quả thi - Updated to match frontend

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('/{*any}', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
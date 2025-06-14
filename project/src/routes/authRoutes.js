const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');  // Kết nối MySQL
const router = express.Router();

// API đăng ký người dùng
router.post('/register', async (req, res) => {
  try {
    const { email, username, phone, password } = req.body;

    // Kiểm tra nếu người dùng đã tồn tại
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email hoặc tên người dùng đã tồn tại' });
    }

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);

    // Thêm người dùng vào cơ sở dữ liệu
    await pool.execute(
      'INSERT INTO users (email, username, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [email, username, phone, hashedPassword, 'student']
    );

    res.status(201).json({ message: 'Đăng ký thành công!' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

// API đăng nhập và tạo JWT token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Debug log
    console.log('Login attempt:', { email, body: req.body });

    if (!email || !password) {
      return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
    }

    const [users] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ message: 'Email không đúng' });
    }

    const user = users[0];

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu không đúng' });
    }

    // Tạo JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Trả về token cho client
    res.json({ 
      message: 'Đăng nhập thành công', 
      token,
      role: user.role
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

module.exports = router;

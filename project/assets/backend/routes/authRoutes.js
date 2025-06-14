
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('../db');  // Kết nối MySQL
const router = express.Router();

// API đăng ký người dùng
router.post('/register', (req, res) => {
  const { email, username, phone, password } = req.body;

  // Kiểm tra nếu người dùng đã tồn tại
  connection.query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (result.length > 0) {
      return res.status(400).json({ message: 'Email hoặc tên người dùng đã tồn tại' });
    }

    // Mã hóa mật khẩu
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ message: 'Lỗi mã hóa mật khẩu' });

      // Thêm người dùng vào cơ sở dữ liệu
      connection.query('INSERT INTO users (email, username, phone, password, role) VALUES (?, ?, ?, ?, ?)', 
        [email, username, phone, hashedPassword, 'student'], (err, result) => {
          if (err) return res.status(500).json({ message: 'Lỗi khi tạo tài khoản', error: err });
          res.status(201).json({ message: 'Đăng ký thành công!' });
        });
    });
  });
});

// API đăng nhập và tạo JWT token
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  connection.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi server' });
    if (result.length === 0) return res.status(400).json({ message: 'Tên người dùng không đúng' });

    // So sánh mật khẩu
    bcrypt.compare(password, result[0].password, (err, isMatch) => {
      if (err) return res.status(500).json({ message: 'Lỗi so sánh mật khẩu' });
      if (!isMatch) return res.status(400).json({ message: 'Mật khẩu không đúng' });

      // Tạo JWT token
      const token = jwt.sign({ userId: result[0].id, role: result[0].role }, process.env.JWT_SECRET || 'secretkey', { expiresIn: '1h' });

      // Trả về token cho client
      res.json({ message: 'Đăng nhập thành công', token });
    });
  });
});

module.exports = router;

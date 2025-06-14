// backend/routes/userRoutes.js

const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('../db');  // Kết nối MySQL
const router = express.Router();

// API: Tạo tài khoản người dùng
router.post('/create', (req, res) => {
  const { email, username, phone, password, role } = req.body;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).json({ message: 'Lỗi mã hóa mật khẩu' });

    connection.query('INSERT INTO users (email, username, phone, password, role) VALUES (?, ?, ?, ?, ?)', 
      [email, username, phone, hashedPassword, role], (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi tạo tài khoản', error: err });
        res.status(201).json({ message: 'Tạo tài khoản thành công!' });
      });
  });
});

// API: Cập nhật tài khoản người dùng
router.put('/update/:id', (req, res) => {
  const { id } = req.params;
  const { email, username, phone, password, role } = req.body;

  let query = 'UPDATE users SET email = ?, username = ?, phone = ?, role = ? WHERE id = ?';
  const values = [email, username, phone, role, id];

  if (password) {
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) return res.status(500).json({ message: 'Lỗi mã hóa mật khẩu' });
      query = 'UPDATE users SET email = ?, username = ?, phone = ?, password = ?, role = ? WHERE id = ?';
      values.splice(3, 0, hashedPassword);  // Thêm mật khẩu đã mã hóa vào mảng giá trị
      connection.query(query, values, (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi cập nhật tài khoản', error: err });
        res.status(200).json({ message: 'Cập nhật tài khoản thành công!' });
      });
    });
  } else {
    connection.query(query, values, (err, result) => {
      if (err) return res.status(500).json({ message: 'Lỗi khi cập nhật tài khoản', error: err });
      res.status(200).json({ message: 'Cập nhật tài khoản thành công!' });
    });
  }
});

// API: Xóa tài khoản người dùng
router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  
  connection.query('DELETE FROM users WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi xóa tài khoản', error: err });
    res.status(200).json({ message: 'Xóa tài khoản thành công!' });
  });
});

module.exports = router;

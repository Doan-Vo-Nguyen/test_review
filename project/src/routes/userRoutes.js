// backend/routes/userRoutes.js

const express = require('express');
const bcrypt = require('bcryptjs');
const connection = require('../db');  // Kết nối MySQL
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

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

// Get user stats
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get topics stats
    const topicsQuery = `
      SELECT 
        COUNT(DISTINCT t.id) as totalTopics,
        COUNT(DISTINCT CASE WHEN ut.completed = true THEN t.id END) as completedTopics
      FROM topics t
      LEFT JOIN user_topics ut ON t.id = ut.topic_id AND ut.user_id = ?
    `;
    
    // Get exams stats
    const examsQuery = `
      SELECT 
        COUNT(DISTINCT r.exam_id) as completedExams,
        AVG(r.score) as averageScore
      FROM results r
      WHERE r.user_id = ?
    `;

    const [topicsStats] = await db.query(topicsQuery, [userId]);
    const [examsStats] = await db.query(examsQuery, [userId]);

    res.json({
      topicsCompleted: topicsStats[0].completedTopics || 0,
      totalTopics: topicsStats[0].totalTopics || 0,
      examsCompleted: examsStats[0].completedExams || 0,
      averageScore: parseFloat(examsStats[0].averageScore || 0).toFixed(1)
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Lỗi khi tải thống kê' });
  }
});

// Get user activity
router.get('/activity', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      (SELECT 
        'exam' as type,
        CONCAT('Hoàn thành bài thi ', e.title) as description,
        r.created_at as date
      FROM results r
      JOIN exams e ON r.exam_id = e.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
      LIMIT 5)
      
      UNION ALL
      
      (SELECT 
        'topic' as type,
        CONCAT('Ôn tập chủ đề ', t.title) as description,
        ut.updated_at as date
      FROM user_topics ut
      JOIN topics t ON ut.topic_id = t.id
      WHERE ut.user_id = ? AND ut.completed = true
      ORDER BY ut.updated_at DESC
      LIMIT 5)
      
      ORDER BY date DESC
      LIMIT 10
    `;

    const activities = await db.query(query, [userId, userId]);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ message: 'Lỗi khi tải hoạt động' });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.user.id;

    const query = `
      UPDATE users 
      SET name = ?, email = ?, phone = ?
      WHERE id = ?
    `;

    await db.query(query, [name, email, phone, userId]);
    res.json({ message: 'Cập nhật thông tin thành công' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Lỗi khi cập nhật thông tin' });
  }
});

module.exports = router;

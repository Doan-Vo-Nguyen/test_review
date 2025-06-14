const express = require('express');
const connection = require('../db');
const router = express.Router();

// API: Xem kết quả thi của thí sinh
router.get('/results/:user_id', (req, res) => {
  const { user_id } = req.params;

  connection.query('SELECT * FROM exam_results WHERE user_id = ?', [user_id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi lấy kết quả thi', error: err });
    res.status(200).json({ results });
  });
});

// API: Báo cáo thống kê kết quả thi
router.get('/report', (req, res) => {
  connection.query('SELECT exam_id, AVG(score) AS average_score FROM exam_results GROUP BY exam_id', (err, report) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi tạo báo cáo', error: err });
    res.status(200).json({ report });
  });
});

module.exports = router;
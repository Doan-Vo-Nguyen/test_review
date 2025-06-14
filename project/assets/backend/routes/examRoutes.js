// backend/routes/examRoutes.js
const express = require('express');
const connection = require('../db');  // Kết nối MySQL
const router = express.Router();

// API: Tạo đề thi
router.post('/create', (req, res) => {
  const { title, description, timeLimit, numQuestions, passingScore } = req.body;

  // Thêm đề thi vào cơ sở dữ liệu
  connection.query('INSERT INTO exams (title, description, time_limit, num_questions, passing_score) VALUES (?, ?, ?, ?, ?)', 
    [title, description, timeLimit, numQuestions, passingScore], (err, result) => {
      if (err) return res.status(500).json({ message: 'Lỗi khi tạo đề thi', error: err });
      res.status(201).json({ message: 'Tạo đề thi thành công!' });
    });
});
// API: Lấy danh sách đề thi
router.get('/', (req, res) => {
  connection.query('SELECT * FROM exams', (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi lấy danh sách đề thi', error: err });
    res.status(200).json({ exams: result });
  });
});

// API: Xóa đề thi
router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;

  connection.query('DELETE FROM exams WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi xóa đề thi', error: err });
    res.status(200).json({ message: 'Đề thi đã được xóa thành công!' });
  });
});

// API: Lấy thông tin đề thi (với ID đề thi)
router.get('/:examId', (req, res) => {
  const { examId } = req.params;

  // Lấy thông tin đề thi
  connection.query('SELECT * FROM exams WHERE id = ?', [examId], (err, examResult) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi lấy đề thi', error: err });
    
    if (examResult.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    // Lấy các câu hỏi của đề thi
    connection.query('SELECT * FROM questions WHERE exam_id = ?', [examId], (err, questions) => {
      if (err) return res.status(500).json({ message: 'Lỗi khi lấy câu hỏi', error: err });

      const exam = examResult[0];
      res.status(200).json({
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          time_limit: exam.time_limit,
          num_questions: exam.num_questions,
          passing_score: exam.passing_score,
          questions: questions
        }
      });
    });
  });
});

module.exports = router;

module.exports = router;

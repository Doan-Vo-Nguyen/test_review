// backend/routes/examRoutes.js
const express = require('express');
const connection = require('../db');  // Kết nối MySQL
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// ==========================================
// GENERAL EXAM ROUTES
// ==========================================

// API: Lấy danh sách đề thi
router.get('/', (req, res) => {
  connection.query('SELECT * FROM exams WHERE is_active = 1', (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi lấy danh sách đề thi', error: err });
    res.status(200).json({ exams: result });
  });
});

// API: Debug route to check all exams
router.get('/debug/all', (req, res) => {
  connection.query('SELECT * FROM exams', (err, result) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi lấy danh sách đề thi', error: err });
    res.status(200).json({ 
      message: 'Debug: All exams',
      count: result.length,
      exams: result 
    });
  });
});

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

// API: Lấy thông tin đề thi (với ID đề thi)
router.get('/:examId', (req, res) => {
  const { examId } = req.params;

  // Lấy thông tin đề thi
  connection.query('SELECT * FROM exams WHERE id = ?', [examId], (err, examResult) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi lấy đề thi', error: err });
    
    if (examResult.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    const exam = examResult[0];
    res.status(200).json({
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        time_limit: exam.time_limit,
        num_questions: exam.num_questions,
        passing_score: exam.passing_score
      }
    });
  });
});

// API: Lấy danh sách câu hỏi cho đề thi (dành cho practice)
router.get('/:examId/questions', (req, res) => {
  const { examId } = req.params;
  const { shuffle = false } = req.query;

  // Lấy thông tin đề thi trước
  connection.query('SELECT * FROM exams WHERE id = ?', [examId], (err, examResult) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi lấy đề thi', error: err });
    
    if (examResult.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    // Lấy các câu hỏi của đề thi
    let questionQuery = 'SELECT * FROM questions WHERE exam_id = ?';
    if (shuffle === 'true') {
      questionQuery += ' ORDER BY RAND()';
    }

    connection.query(questionQuery, [examId], (err, questions) => {
      if (err) return res.status(500).json({ message: 'Lỗi khi lấy câu hỏi', error: err });

      // Parse options for each question
      questions.forEach(question => {
        if (question.options) {
          try {
            question.options = JSON.parse(question.options);
          } catch (e) {
            question.options = [];
          }
        }
      });

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

// ==========================================
// PRACTICE EXAM ROUTES
// ==========================================

// API: Get practice exams (simple version without auth)
router.get('/practice/simple', (req, res) => {
  const query = `
    SELECT 
      e.id,
      e.title,
      e.description,
      e.time_limit,
      e.passing_score,
      COUNT(q.id) as question_count
    FROM exams e
    LEFT JOIN questions q ON e.id = q.exam_id
    WHERE e.is_active = 1
    GROUP BY e.id, e.title, e.description, e.time_limit, e.passing_score
    ORDER BY e.title
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error in practice/simple:', err);
      return res.status(500).json({ message: 'Lỗi khi lấy danh sách đề luyện tập', error: err.message });
    }
    
    console.log('Simple practice exams found:', results.length);
    
    res.status(200).json({ 
      exams: results.map(exam => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        time_limit: exam.time_limit,
        passing_score: exam.passing_score,
        question_count: exam.question_count,
        attempt_count: 0,
        best_score: 0
      }))
    });
  });
});

// API: Get practice exams (with user stats)
router.get('/practice/available', auth, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT 
      e.id,
      e.title,
      e.description,
      e.time_limit,
      e.passing_score,
      COUNT(q.id) as question_count,
      COALESCE((SELECT COUNT(*) FROM exam_results er WHERE er.exam_id = e.id AND er.user_id = ? AND er.is_practice = 1), 0) as attempt_count,
      COALESCE((SELECT MAX(er.score) FROM exam_results er WHERE er.exam_id = e.id AND er.user_id = ? AND er.is_practice = 1), 0) as best_score
    FROM exams e
    LEFT JOIN questions q ON e.id = q.exam_id
    WHERE e.is_active = 1
    GROUP BY e.id, e.title, e.description, e.time_limit, e.passing_score
    ORDER BY e.title
  `;

  connection.query(query, [userId, userId], (err, results) => {
    if (err) {
      console.error('Error in practice/available:', err);
      return res.status(500).json({ message: 'Lỗi khi lấy danh sách đề luyện tập', error: err.message });
    }
    
    console.log('Practice exams found:', results.length);
    
    res.status(200).json({ 
      exams: results.map(exam => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        time_limit: exam.time_limit,
        passing_score: exam.passing_score,
        question_count: exam.question_count,
        attempt_count: exam.attempt_count || 0,
        best_score: exam.best_score || 0
      }))
    });
  });
});

// API: Start practice exam
router.post('/practice/start', auth, (req, res) => {
  const { examId } = req.body;
  const userId = req.user.id;

  // Get exam details
  connection.query('SELECT * FROM exams WHERE id = ? AND is_active = 1', [examId], (err, examResult) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi lấy thông tin đề thi', error: err });
    
    if (examResult.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi hoặc đề thi không khả dụng' });
    }

    const exam = examResult[0];
    
    // Get questions for this exam (randomized for practice)
    connection.query(
      'SELECT id, question_text, question_type, options, correct_answer FROM questions WHERE exam_id = ? ORDER BY RAND()',
      [examId],
      (err, questions) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi lấy câu hỏi', error: err });

        if (questions.length === 0) {
          return res.status(400).json({ message: 'Đề thi này chưa có câu hỏi' });
        }

        // Parse options for each question
        questions.forEach(question => {
          if (question.options) {
            try {
              question.options = JSON.parse(question.options);
            } catch (e) {
              question.options = [];
            }
          }
          // Remove correct answer from response for practice
          delete question.correct_answer;
        });

        res.status(200).json({
          exam: {
            id: exam.id,
            title: exam.title,
            description: exam.description,
            time_limit: exam.time_limit,
            passing_score: exam.passing_score,
            is_practice: true
          },
          questions: questions,
          totalQuestions: questions.length
        });
      }
    );
  });
});

// API: Submit practice exam
router.post('/practice/submit', auth, (req, res) => {
  const { examId, answers, timeSpent } = req.body;
  const userId = req.user.id;

  // Get exam details and correct answers
  connection.query('SELECT * FROM exams WHERE id = ?', [examId], (err, examResult) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi lấy thông tin đề thi', error: err });
    
    if (examResult.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    const exam = examResult[0];

    // Get correct answers
    connection.query(
      'SELECT id, question_text, correct_answer, options FROM questions WHERE exam_id = ?',
      [examId],
      (err, questions) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi lấy đáp án', error: err });

        // Calculate score
        let correctCount = 0;
        const totalQuestions = questions.length;
        const detailedResults = [];

        questions.forEach(question => {
          const userAnswer = answers[question.id];
          const isCorrect = userAnswer === question.correct_answer;
          
          if (isCorrect) correctCount++;
          
          // Parse options for display
          let parsedOptions = [];
          if (question.options) {
            try {
              parsedOptions = JSON.parse(question.options);
            } catch (e) {
              parsedOptions = [];
            }
          }
          
          detailedResults.push({
            question_id: question.id,
            question_text: question.question_text,
            user_answer: userAnswer || null,
            correct_answer: question.correct_answer,
            is_correct: isCorrect,
            options: parsedOptions
          });
        });

        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
        const passed = score >= exam.passing_score;

        // Save practice result
        const practiceResult = {
          user_id: userId,
          exam_id: examId,
          score: score,
          total_questions: totalQuestions,
          correct_answers: correctCount,
          duration: timeSpent || 0,
          passed: passed,
          is_practice: true,
          created_at: new Date()
        };

        connection.query(
          `INSERT INTO exam_results (user_id, exam_id, score, total_questions, correct_answers, 
           duration, passed, is_practice, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [practiceResult.user_id, practiceResult.exam_id, practiceResult.score, 
           practiceResult.total_questions, practiceResult.correct_answers, 
           practiceResult.duration, practiceResult.passed, practiceResult.is_practice, practiceResult.created_at],
          (err, result) => {
            if (err) {
              console.error('Error saving practice result:', err);
              return res.status(500).json({ message: 'Lỗi khi lưu kết quả luyện tập', error: err });
            }

            // Return detailed results
            res.status(200).json({
              message: 'Hoàn thành bài luyện tập',
              result: {
                score: score,
                totalQuestions: totalQuestions,
                correctAnswers: correctCount,
                passed: passed,
                duration: timeSpent || 0,
                isPractice: true,
                passingScore: exam.passing_score
              },
              detailedAnswers: detailedResults,
              summary: {
                examTitle: exam.title,
                scorePercentage: `${score}%`,
                passStatus: passed ? 'Đạt' : 'Chưa đạt',
                timeSpent: formatTime(timeSpent || 0)
              }
            });
          }
        );
      }
    );
  });
});

// API: Get user's practice history
router.get('/practice/history', auth, (req, res) => {
  const userId = req.user.id;
  const { limit = 10, offset = 0 } = req.query;

  const query = `
    SELECT 
      er.id,
      er.score,
      er.total_questions,
      er.correct_answers,
      er.duration,
      er.passed,
      er.created_at,
      e.title as exam_title,
      e.description as exam_description
    FROM exam_results er
    JOIN exams e ON er.exam_id = e.id
    WHERE er.user_id = ? AND er.is_practice = 1
    ORDER BY er.created_at DESC
    LIMIT ? OFFSET ?
  `;

  connection.query(query, [userId, parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi lấy lịch sử luyện tập', error: err });
    
    res.status(200).json({ 
      history: results.map(result => ({
        ...result,
        duration_formatted: formatTime(result.duration),
        score_percentage: `${result.score}%`,
        date_formatted: new Date(result.created_at).toLocaleDateString('vi-VN')
      }))
    });
  });
});

// ==========================================
// FORMAL EXAM ROUTES
// ==========================================

// API: Get available formal exams (requires authentication check for eligibility)
router.get('/formal/available', auth, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT 
      e.id,
      e.title,
      e.description,
      e.time_limit,
      e.passing_score,
      COUNT(q.id) as question_count,
      CASE WHEN er.id IS NOT NULL THEN 1 ELSE 0 END as already_taken
    FROM exams e
    LEFT JOIN questions q ON e.id = q.exam_id
    LEFT JOIN exam_results er ON e.id = er.exam_id AND er.user_id = ? AND er.is_practice = 0
    WHERE e.is_active = 1
    GROUP BY e.id, e.title, e.description, e.time_limit, e.passing_score, er.id
    ORDER BY e.title
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error in formal/available:', err);
      return res.status(500).json({ message: 'Lỗi khi lấy danh sách bài thi chính thức', error: err.message });
    }
    
    console.log('Formal exams found:', results.length);
    
    res.status(200).json({ 
      exams: results.map(exam => ({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        time_limit: exam.time_limit,
        passing_score: exam.passing_score,
        question_count: exam.question_count,
        already_taken: exam.already_taken,
        can_take: !exam.already_taken
      }))
    });
  });
});

// ==========================================
// SHARED UTILITY ROUTES
// ==========================================

// Get all topics with user progress
router.get('/topics', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        t.id,
        t.title,
        t.description,
        IFNULL(ut.progress, 0) as progress
      FROM topics t
      LEFT JOIN user_topics ut ON t.id = ut.topic_id AND ut.user_id = ?
      ORDER BY t.title
    `;

    const topics = await db.query(query, [userId]);
    res.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    res.status(500).json({ message: 'Lỗi khi tải chủ đề' });
  }
});

// Get all available exams
router.get('/exams', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.duration,
        COUNT(q.id) as questionCount
      FROM exams e
      LEFT JOIN questions q ON e.id = q.exam_id
      GROUP BY e.id
      ORDER BY e.title
    `;

    const exams = await db.query(query);
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Lỗi khi tải danh sách bài thi' });
  }
});

// Get user's exam history
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        r.id,
        e.title as examTitle,
        r.score,
        r.duration,
        r.created_at as date,
        CASE 
          WHEN r.completed = 1 THEN 'Hoàn thành'
          ELSE 'Đang làm'
        END as status
      FROM results r
      JOIN exams e ON r.exam_id = e.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `;

    const history = await db.query(query, [userId]);
    res.json(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ message: 'Lỗi khi tải lịch sử làm bài' });
  }
});

// Helper function to format time
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

module.exports = router;

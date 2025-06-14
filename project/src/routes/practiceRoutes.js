// backend/routes/practiceRoutes.js
const express = require('express');
const connection = require('../db');  // Kết nối MySQL
const router = express.Router();
const auth = require('../middleware/auth');

// ==========================================
// PRACTICE EXAM ROUTES
// ==========================================

// API: Get all available practice exams
router.get('/available', auth, (req, res) => {
  const userId = req.user.id;
  const query = `
    SELECT 
      p.id,
      p.title,
      p.description,
      p.time_limit,
      p.num_questions,
      p.created_at,
      COUNT(q.id) as actual_question_count,
      COALESCE(practice_stats.attempt_count, 0) as attempt_count,
      COALESCE(practice_stats.best_score, 0) as best_score,
      COALESCE(practice_stats.last_attempt, NULL) as last_attempt
    FROM practice p
    LEFT JOIN questions q ON p.id = q.exam_id
    LEFT JOIN (
      SELECT 
        practice_id,
        COUNT(*) as attempt_count,
        MAX(score) as best_score,
        MAX(created_at) as last_attempt
      FROM practice_exams 
      WHERE user_id = ?
      GROUP BY practice_id
    ) practice_stats ON p.id = practice_stats.practice_id
    GROUP BY p.id, p.title, p.description, p.time_limit, p.num_questions, p.created_at
    ORDER BY p.created_at DESC
  `;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching practice exams:', err);
      return res.status(500).json({ message: 'Lỗi khi lấy danh sách đề luyện tập', error: err.message });
    }
    
    console.log('Practice exams found:', results.length);
    
    res.status(200).json({ 
      exams: results.map(practice => ({
        id: practice.id,
        title: practice.title,
        description: practice.description,
        time_limit: practice.time_limit,
        num_questions: practice.num_questions,
        actual_question_count: practice.actual_question_count,
        attempt_count: practice.attempt_count || 0,
        best_score: practice.best_score || 0,
        last_attempt: practice.last_attempt,
        created_at: practice.created_at
      }))
    });
  });
});

// API: Get simple practice list (without auth - fallback)
router.get('/simple', (req, res) => {
  console.log('Simple practice API called');
  
  const query = `
    SELECT 
      p.id,
      p.title,
      p.description,
      p.time_limit,
      p.num_questions,
      p.created_at,
      COALESCE(COUNT(q.id), 0) as actual_question_count
    FROM practice p
    LEFT JOIN questions q ON p.id = q.exam_id
    GROUP BY p.id, p.title, p.description, p.time_limit, p.num_questions, p.created_at
    ORDER BY p.created_at DESC
  `;

  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching simple practice list:', err);
      return res.status(500).json({ 
        message: 'Lỗi khi lấy danh sách đề luyện tập', 
        error: err.message,
        sql_error: err.sqlMessage 
      });
    }
    
    console.log('Simple practice query results:', results);
    
    res.status(200).json({ 
      exams: results.map(practice => ({
        id: practice.id,
        title: practice.title,
        description: practice.description,
        time_limit: practice.time_limit,
        num_questions: practice.num_questions,
        actual_question_count: practice.actual_question_count,
        attempt_count: 0,
        best_score: 0,
        created_at: practice.created_at
      }))
    });
  });
});

// API: Start a practice exam
router.post('/start', auth, (req, res) => {
  const { practiceId } = req.body;
  const userId = req.user.id;

  // Get practice details
  connection.query('SELECT * FROM practice WHERE id = ?', [practiceId], (err, practiceResult) => {
    if (err) {
      console.error('Error fetching practice:', err);
      return res.status(500).json({ message: 'Lỗi khi lấy thông tin đề luyện tập', error: err.message });
    }
    
    if (practiceResult.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đề luyện tập' });
    }

    const practice = practiceResult[0];
    
    // Get questions for this practice (randomized)
    connection.query(
      'SELECT id, question_text, question_type, options FROM questions WHERE exam_id = ? ORDER BY RAND() LIMIT ?',
      [practiceId, practice.num_questions],
      (err, questions) => {
        if (err) {
          console.error('Error fetching questions:', err);
          return res.status(500).json({ message: 'Lỗi khi lấy câu hỏi', error: err.message });
        }

        if (questions.length === 0) {
          return res.status(400).json({ message: 'Đề luyện tập này chưa có câu hỏi' });
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
        });

        res.status(200).json({
          practice: {
            id: practice.id,
            title: practice.title,
            description: practice.description,
            time_limit: practice.time_limit,
            num_questions: practice.num_questions,
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
router.post('/submit', auth, (req, res) => {
  const { practiceId, answers, timeSpent } = req.body;
  const userId = req.user.id;

  // Get practice details
  connection.query('SELECT * FROM practice WHERE id = ?', [practiceId], (err, practiceResult) => {
    if (err) {
      console.error('Error fetching practice:', err);
      return res.status(500).json({ message: 'Lỗi khi lấy thông tin đề luyện tập', error: err.message });
    }
    
    if (practiceResult.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đề luyện tập' });
    }

    const practice = practiceResult[0];

    // Get correct answers
    connection.query(
      'SELECT id, question_text, correct_answer, options FROM questions WHERE exam_id = ?',
      [practiceId],
      (err, questions) => {
        if (err) {
          console.error('Error fetching correct answers:', err);
          return res.status(500).json({ message: 'Lỗi khi lấy đáp án', error: err.message });
        }

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

        // Save practice result to practice_exams table
        const insertQuery = `
          INSERT INTO practice_exams (user_id, practice_id, score, total_questions, correct_answers, created_at) 
          VALUES (?, ?, ?, ?, ?, NOW())
        `;

        connection.query(
          insertQuery,
          [userId, practiceId, score, totalQuestions, correctCount],
          (err, result) => {
            if (err) {
              console.error('Error saving practice result:', err);
              return res.status(500).json({ message: 'Lỗi khi lưu kết quả luyện tập', error: err.message });
            }

            // Return detailed results
            res.status(200).json({
              message: 'Hoàn thành bài luyện tập',
              result: {
                id: result.insertId,
                score: score,
                totalQuestions: totalQuestions,
                correctAnswers: correctCount,
                duration: timeSpent || 0,
                isPractice: true
              },
              detailedAnswers: detailedResults,
              summary: {
                practiceTitle: practice.title,
                scorePercentage: `${score}%`,
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
router.get('/history', auth, (req, res) => {
  const userId = req.user.id;
  const { limit = 10, offset = 0 } = req.query;

  const query = `
    SELECT 
      pe.id,
      pe.score,
      pe.total_questions,
      pe.correct_answers,
      pe.created_at,
      p.title as practice_title,
      p.description as practice_description,
      p.time_limit
    FROM practice_exams pe
    JOIN practice p ON pe.practice_id = p.id
    WHERE pe.user_id = ?
    ORDER BY pe.created_at DESC
    LIMIT ? OFFSET ?
  `;

  connection.query(query, [userId, parseInt(limit), parseInt(offset)], (err, results) => {
    if (err) {
      console.error('Error fetching practice history:', err);
      return res.status(500).json({ message: 'Lỗi khi lấy lịch sử luyện tập', error: err.message });
    }
    
    res.status(200).json({ 
      history: results.map(result => ({
        id: result.id,
        score: result.score,
        total_questions: result.total_questions,
        correct_answers: result.correct_answers,
        created_at: result.created_at,
        practice_title: result.practice_title,
        practice_description: result.practice_description,
        time_limit: result.time_limit,
        score_percentage: `${result.score}%`,
        date_formatted: new Date(result.created_at).toLocaleDateString('vi-VN'),
        time_formatted: new Date(result.created_at).toLocaleTimeString('vi-VN')
      }))
    });
  });
});

// API: Get practice statistics for a user
router.get('/stats', auth, (req, res) => {
  const userId = req.user.id;

  const statsQuery = `
    SELECT 
      COUNT(*) as total_attempts,
      AVG(score) as average_score,
      MAX(score) as best_score,
      MIN(score) as lowest_score,
      COUNT(DISTINCT practice_id) as practices_attempted
    FROM practice_exams 
    WHERE user_id = ?
  `;

  const recentQuery = `
    SELECT 
      pe.score,
      pe.created_at,
      p.title
    FROM practice_exams pe
    JOIN practice p ON pe.practice_id = p.id
    WHERE pe.user_id = ?
    ORDER BY pe.created_at DESC
    LIMIT 5
  `;

  connection.query(statsQuery, [userId], (err, statsResults) => {
    if (err) {
      console.error('Error fetching practice stats:', err);
      return res.status(500).json({ message: 'Lỗi khi lấy thống kê luyện tập', error: err.message });
    }

    connection.query(recentQuery, [userId], (err, recentResults) => {
      if (err) {
        console.error('Error fetching recent practices:', err);
        return res.status(500).json({ message: 'Lỗi khi lấy lịch sử gần đây', error: err.message });
      }

      const stats = statsResults[0];
      
      res.status(200).json({
        stats: {
          total_attempts: stats.total_attempts || 0,
          average_score: Math.round(stats.average_score || 0),
          best_score: stats.best_score || 0,
          lowest_score: stats.lowest_score || 0,
          practices_attempted: stats.practices_attempted || 0
        },
        recent_attempts: recentResults.map(attempt => ({
          score: attempt.score,
          title: attempt.title,
          created_at: attempt.created_at,
          date_formatted: new Date(attempt.created_at).toLocaleDateString('vi-VN')
        }))
      });
    });
  });
});

// API: Get specific practice details
router.get('/:practiceId', auth, (req, res) => {
  const { practiceId } = req.params;
  const userId = req.user.id;

  const query = `
    SELECT 
      p.*,
      COUNT(q.id) as actual_question_count,
      COALESCE(user_stats.attempt_count, 0) as user_attempts,
      COALESCE(user_stats.best_score, 0) as user_best_score
    FROM practice p
    LEFT JOIN questions q ON p.id = q.exam_id
    LEFT JOIN (
      SELECT 
        practice_id,
        COUNT(*) as attempt_count,
        MAX(score) as best_score
      FROM practice_exams 
      WHERE user_id = ? AND practice_id = ?
    ) user_stats ON p.id = user_stats.practice_id
    WHERE p.id = ?
    GROUP BY p.id
  `;

  connection.query(query, [userId, practiceId, practiceId], (err, results) => {
    if (err) {
      console.error('Error fetching practice details:', err);
      return res.status(500).json({ message: 'Lỗi khi lấy thông tin đề luyện tập', error: err.message });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đề luyện tập' });
    }

    const practice = results[0];
    res.status(200).json({
      practice: {
        id: practice.id,
        title: practice.title,
        description: practice.description,
        time_limit: practice.time_limit,
        num_questions: practice.num_questions,
        actual_question_count: practice.actual_question_count,
        user_attempts: practice.user_attempts,
        user_best_score: practice.user_best_score,
        created_at: practice.created_at
      }
    });
  });
});

// ==========================================
// DEBUG AND TEST ROUTES
// ==========================================

// API: Test route to check if practice routes are working
router.get('/test', (req, res) => {
  res.status(200).json({
    message: 'Practice routes are working!',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/practice/available',
      'GET /api/practice/simple',
      'POST /api/practice/start',
      'POST /api/practice/submit'
    ]
  });
});

// API: Insert sample practice data (for testing)
router.post('/seed', (req, res) => {
  const samplePractices = [
    {
      title: 'Luyện tập Bảo hiểm cơ bản',
      description: 'Ôn tập các kiến thức cơ bản về bảo hiểm xã hội và y tế',
      time_limit: 30,
      num_questions: 15
    },
    {
      title: 'Luyện tập Luật Bảo hiểm',
      description: 'Các quy định pháp luật về bảo hiểm trong lao động',
      time_limit: 45,
      num_questions: 20
    },
    {
      title: 'Luyện tập Thực hành Bảo hiểm',
      description: 'Các tình huống thực tế trong quá trình làm việc với bảo hiểm',
      time_limit: 60,
      num_questions: 25
    }
  ];

  let completed = 0;
  let errors = [];

  samplePractices.forEach((practice, index) => {
    const insertQuery = `
      INSERT INTO practice (title, description, time_limit, num_questions, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `;

    connection.query(
      insertQuery,
      [practice.title, practice.description, practice.time_limit, practice.num_questions],
      (err, result) => {
        completed++;
        
        if (err) {
          console.error(`Error inserting practice ${index + 1}:`, err);
          errors.push(`Practice ${index + 1}: ${err.message}`);
        }

        if (completed === samplePractices.length) {
          if (errors.length > 0) {
            res.status(500).json({
              message: 'Some sample data insertion failed',
              errors: errors,
              inserted: samplePractices.length - errors.length
            });
          } else {
            res.status(201).json({
              message: 'Sample practice data inserted successfully',
              inserted: samplePractices.length
            });
          }
        }
      }
    );
  });
});

// ==========================================
// ADMIN PRACTICE MANAGEMENT ROUTES
// ==========================================

// API: Create new practice exam (Admin only)
router.post('/create', auth, (req, res) => {
  const { title, description, time_limit, num_questions } = req.body;

  if (!title || !time_limit || !num_questions) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  const insertQuery = `
    INSERT INTO practice (title, description, time_limit, num_questions, created_at) 
    VALUES (?, ?, ?, ?, NOW())
  `;

  connection.query(
    insertQuery,
    [title, description || null, time_limit, num_questions],
    (err, result) => {
      if (err) {
        console.error('Error creating practice:', err);
        return res.status(500).json({ message: 'Lỗi khi tạo đề luyện tập', error: err.message });
      }

      res.status(201).json({
        message: 'Tạo đề luyện tập thành công',
        practice: {
          id: result.insertId,
          title,
          description,
          time_limit,
          num_questions
        }
      });
    }
  );
});

// API: Update practice exam (Admin only)
router.put('/:practiceId', auth, (req, res) => {
  const { practiceId } = req.params;
  const { title, description, time_limit, num_questions } = req.body;

  if (!title || !time_limit || !num_questions) {
    return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  }

  const updateQuery = `
    UPDATE practice 
    SET title = ?, description = ?, time_limit = ?, num_questions = ?
    WHERE id = ?
  `;

  connection.query(
    updateQuery,
    [title, description || null, time_limit, num_questions, practiceId],
    (err, result) => {
      if (err) {
        console.error('Error updating practice:', err);
        return res.status(500).json({ message: 'Lỗi khi cập nhật đề luyện tập', error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Không tìm thấy đề luyện tập' });
      }

      res.status(200).json({
        message: 'Cập nhật đề luyện tập thành công'
      });
    }
  );
});

// API: Delete practice exam (Admin only)
router.delete('/:practiceId', auth, (req, res) => {
  const { practiceId } = req.params;

  // First, delete related practice_exams
  connection.query(
    'DELETE FROM practice_exams WHERE practice_id = ?',
    [practiceId],
    (err) => {
      if (err) {
        console.error('Error deleting practice results:', err);
        return res.status(500).json({ message: 'Lỗi khi xóa kết quả luyện tập', error: err.message });
      }

      // Then delete the practice
      connection.query(
        'DELETE FROM practice WHERE id = ?',
        [practiceId],
        (err, result) => {
          if (err) {
            console.error('Error deleting practice:', err);
            return res.status(500).json({ message: 'Lỗi khi xóa đề luyện tập', error: err.message });
          }

          if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy đề luyện tập' });
          }

          res.status(200).json({
            message: 'Xóa đề luyện tập thành công'
          });
        }
      );
    }
  );
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
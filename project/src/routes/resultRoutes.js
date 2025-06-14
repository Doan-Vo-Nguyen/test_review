const express = require('express');
const connection = require('../db');
const router = express.Router();
const auth = require('../middleware/auth');

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

// API: Start an exam session (both practice and real exam)
router.post('/start-exam', auth, (req, res) => {
  const { examId, isPractice = false } = req.body;
  const userId = req.user.id;

  // First, get exam details
  connection.query('SELECT * FROM exams WHERE id = ?', [examId], (err, examResult) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi lấy thông tin đề thi', error: err });
    
    if (examResult.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi' });
    }

    const exam = examResult[0];
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (exam.time_limit * 60 * 1000));

    // Create exam session
    const sessionData = {
      user_id: userId,
      exam_id: examId,
      start_time: startTime,
      end_time: endTime,
      is_practice: isPractice,
      status: 'in_progress'
    };

    connection.query(
      'INSERT INTO exam_sessions (user_id, exam_id, start_time, end_time, is_practice, status) VALUES (?, ?, ?, ?, ?, ?)',
      [sessionData.user_id, sessionData.exam_id, sessionData.start_time, sessionData.end_time, sessionData.is_practice, sessionData.status],
      (err, result) => {
        if (err) return res.status(500).json({ message: 'Lỗi khi tạo phiên thi', error: err });
        
        const sessionId = result.insertId;
        res.status(201).json({ 
          message: 'Phiên thi đã được tạo',
          sessionId: sessionId,
          examData: exam,
          startTime: startTime,
          endTime: endTime
        });
      }
    );
  });
});

// API: Get exam session with questions
router.get('/session/:sessionId', auth, (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user.id;

  // Get session details
  connection.query(
    `SELECT es.*, e.title, e.description, e.time_limit, e.passing_score 
     FROM exam_sessions es 
     JOIN exams e ON es.exam_id = e.id 
     WHERE es.id = ? AND es.user_id = ?`,
    [sessionId, userId],
    (err, sessionResult) => {
      if (err) return res.status(500).json({ message: 'Lỗi khi lấy thông tin phiên thi', error: err });
      
      if (sessionResult.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy phiên thi' });
      }

      const session = sessionResult[0];
      
      // Check if session is still valid
      const now = new Date();
      if (now > new Date(session.end_time)) {
        return res.status(400).json({ message: 'Phiên thi đã hết thời gian' });
      }

      // Get questions for this exam
      connection.query(
        'SELECT id, question_text, question_type, options FROM questions WHERE exam_id = ? ORDER BY RAND()',
        [session.exam_id],
        (err, questions) => {
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

          res.status(200).json({
            session: session,
            questions: questions,
            timeRemaining: Math.max(0, Math.floor((new Date(session.end_time) - now) / 1000))
          });
        }
      );
    }
  );
});

// API: Submit exam answers
router.post('/submit-exam', auth, (req, res) => {
  const { sessionId, answers } = req.body;
  const userId = req.user.id;

  // First, verify the session belongs to the user and is still active
  connection.query(
    `SELECT es.*, e.passing_score 
     FROM exam_sessions es 
     JOIN exams e ON es.exam_id = e.id 
     WHERE es.id = ? AND es.user_id = ? AND es.status = 'in_progress'`,
    [sessionId, userId],
    (err, sessionResult) => {
      if (err) return res.status(500).json({ message: 'Lỗi khi xác thực phiên thi', error: err });
      
      if (sessionResult.length === 0) {
        return res.status(404).json({ message: 'Phiên thi không hợp lệ hoặc đã kết thúc' });
      }

      const session = sessionResult[0];
      const examId = session.exam_id;

      // Get correct answers
      connection.query(
        'SELECT id, correct_answer FROM questions WHERE exam_id = ?',
        [examId],
        (err, correctAnswers) => {
          if (err) return res.status(500).json({ message: 'Lỗi khi lấy đáp án', error: err });

          // Calculate score
          let correctCount = 0;
          const totalQuestions = correctAnswers.length;
          const detailedResults = [];

          correctAnswers.forEach(question => {
            const userAnswer = answers[question.id];
            const isCorrect = userAnswer === question.correct_answer;
            
            if (isCorrect) correctCount++;
            
            detailedResults.push({
              question_id: question.id,
              user_answer: userAnswer || null,
              correct_answer: question.correct_answer,
              is_correct: isCorrect
            });
          });

          const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
          const passed = score >= session.passing_score;
          const completedAt = new Date();
          const duration = Math.floor((completedAt - new Date(session.start_time)) / 1000);

          // Update session status
          connection.query(
            'UPDATE exam_sessions SET status = ?, completed_at = ?, score = ?, duration = ? WHERE id = ?',
            ['completed', completedAt, score, duration, sessionId],
            (err) => {
              if (err) return res.status(500).json({ message: 'Lỗi khi cập nhật phiên thi', error: err });

              // Save exam result
              connection.query(
                `INSERT INTO exam_results (user_id, exam_id, session_id, score, total_questions, correct_answers, 
                 duration, passed, is_practice, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [userId, examId, sessionId, score, totalQuestions, correctCount, duration, passed, session.is_practice, completedAt],
                (err, resultInsert) => {
                  if (err) return res.status(500).json({ message: 'Lỗi khi lưu kết quả', error: err });

                  const resultId = resultInsert.insertId;

                  // Save detailed answers
                  const answerInserts = detailedResults.map(result => [
                    resultId, result.question_id, result.user_answer, result.correct_answer, result.is_correct
                  ]);

                  if (answerInserts.length > 0) {
                    connection.query(
                      `INSERT INTO exam_answers (result_id, question_id, user_answer, correct_answer, is_correct) VALUES ?`,
                      [answerInserts],
                      (err) => {
                        if (err) console.error('Error saving detailed answers:', err);
                      }
                    );
                  }

                  // Return results
                  res.status(200).json({
                    message: 'Bài thi đã được nộp thành công',
                    result: {
                      sessionId: sessionId,
                      score: score,
                      totalQuestions: totalQuestions,
                      correctAnswers: correctCount,
                      passed: passed,
                      duration: duration,
                      isPractice: session.is_practice,
                      completedAt: completedAt,
                      detailedResults: detailedResults
                    }
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// API: Get user's exam history with detailed results
router.get('/history', auth, (req, res) => {
  const userId = req.user.id;
  const { isPractice } = req.query;

  let query = `
    SELECT 
      er.id,
      er.score,
      er.total_questions,
      er.correct_answers,
      er.duration,
      er.passed,
      er.is_practice,
      er.created_at,
      e.title as exam_title,
      e.description as exam_description,
      es.start_time,
      es.end_time
    FROM exam_results er
    JOIN exams e ON er.exam_id = e.id
    JOIN exam_sessions es ON er.session_id = es.id
    WHERE er.user_id = ?
  `;

  const params = [userId];

  if (isPractice !== undefined) {
    query += ' AND er.is_practice = ?';
    params.push(isPractice === 'true');
  }

  query += ' ORDER BY er.created_at DESC';

  connection.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Lỗi khi lấy lịch sử thi', error: err });
    
    res.status(200).json({ 
      history: results.map(result => ({
        ...result,
        duration_formatted: formatDuration(result.duration),
        score_percentage: `${result.score}%`
      }))
    });
  });
});

// API: Get detailed result of a specific exam
router.get('/result/:resultId', auth, (req, res) => {
  const { resultId } = req.params;
  const userId = req.user.id;

  // Get main result data
  connection.query(
    `SELECT 
      er.*,
      e.title as exam_title,
      e.description as exam_description,
      es.start_time,
      es.end_time
    FROM exam_results er
    JOIN exams e ON er.exam_id = e.id
    JOIN exam_sessions es ON er.session_id = es.id
    WHERE er.id = ? AND er.user_id = ?`,
    [resultId, userId],
    (err, resultData) => {
      if (err) return res.status(500).json({ message: 'Lỗi khi lấy kết quả', error: err });
      
      if (resultData.length === 0) {
        return res.status(404).json({ message: 'Không tìm thấy kết quả' });
      }

      const result = resultData[0];

      // Get detailed answers
      connection.query(
        `SELECT 
          ea.*,
          q.question_text,
          q.options
        FROM exam_answers ea
        JOIN questions q ON ea.question_id = q.id
        WHERE ea.result_id = ?
        ORDER BY q.id`,
        [resultId],
        (err, answers) => {
          if (err) return res.status(500).json({ message: 'Lỗi khi lấy chi tiết đáp án', error: err });

          // Parse options for each question
          answers.forEach(answer => {
            if (answer.options) {
              try {
                answer.options = JSON.parse(answer.options);
              } catch (e) {
                answer.options = [];
              }
            }
          });

          res.status(200).json({
            result: {
              ...result,
              duration_formatted: formatDuration(result.duration),
              score_percentage: `${result.score}%`
            },
            answers: answers
          });
        }
      );
    }
  );
});

// API: Get practice exam statistics for a user
router.get('/practice-stats', auth, (req, res) => {
  const userId = req.user.id;

  const queries = [
    // Total practice exams taken
    `SELECT COUNT(*) as total_practice FROM exam_results WHERE user_id = ? AND is_practice = 1`,
    
    // Average practice score
    `SELECT AVG(score) as avg_practice_score FROM exam_results WHERE user_id = ? AND is_practice = 1`,
    
    // Best practice score
    `SELECT MAX(score) as best_score FROM exam_results WHERE user_id = ? AND is_practice = 1`,
    
    // Practice exams by subject
    `SELECT e.title, COUNT(*) as count, AVG(er.score) as avg_score
     FROM exam_results er 
     JOIN exams e ON er.exam_id = e.id 
     WHERE er.user_id = ? AND er.is_practice = 1 
     GROUP BY e.id, e.title`,
    
    // Recent practice results (last 10)
    `SELECT er.score, er.created_at, e.title 
     FROM exam_results er 
     JOIN exams e ON er.exam_id = e.id 
     WHERE er.user_id = ? AND er.is_practice = 1 
     ORDER BY er.created_at DESC 
     LIMIT 10`
  ];

  Promise.all(queries.map(query => {
    return new Promise((resolve, reject) => {
      connection.query(query, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
  }))
  .then(results => {
    res.status(200).json({
      totalPractice: results[0][0].total_practice,
      averageScore: Math.round(results[1][0].avg_practice_score || 0),
      bestScore: results[2][0].best_score || 0,
      subjectStats: results[3],
      recentResults: results[4]
    });
  })
  .catch(err => {
    console.error('Error getting practice stats:', err);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê luyện tập', error: err });
  });
});

// Helper function to format duration
function formatDuration(seconds) {
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
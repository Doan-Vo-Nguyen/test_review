const mysql = require('mysql2/promise');

const {
  DB_HOST = '127.0.0.1',
  DB_USER = 'user',
  DB_PASSWORD = 'password',
  DB_NAME = 'httracnghiem',
  DB_PORT = '3308'
} = process.env;

async function initializeDatabase() {
  let connection;
  
  try {
    // Wait for MySQL to be ready
    console.log('Waiting for MySQL to be ready...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Create connection
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT
    });

    console.log('Connected to MySQL database');

    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create exams table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        time_limit INT DEFAULT 60,
        num_questions INT DEFAULT 10,
        passing_score INT DEFAULT 70,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Create questions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exam_id INT,
        question_text TEXT NOT NULL,
        question_type ENUM('multiple_choice', 'true_false', 'essay') DEFAULT 'multiple_choice',
        options JSON,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      )
    `);

    // Create exam_sessions table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exam_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        exam_id INT NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        completed_at TIMESTAMP NULL,
        status ENUM('in_progress', 'completed', 'expired', 'violated') DEFAULT 'in_progress',
        is_practice BOOLEAN DEFAULT FALSE,
        score INT DEFAULT 0,
        duration INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE
      )
    `);

    // Create exam_results table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exam_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        exam_id INT NOT NULL,
        session_id INT,
        score INT NOT NULL,
        total_questions INT NOT NULL,
        correct_answers INT NOT NULL,
        duration INT NOT NULL,
        passed BOOLEAN DEFAULT FALSE,
        is_practice BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
        FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE SET NULL
      )
    `);

    // Create exam_answers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS exam_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        result_id INT NOT NULL,
        question_id INT NOT NULL,
        user_answer TEXT,
        correct_answer TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (result_id) REFERENCES exam_results(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);

    // Create topics table (for categorizing exams)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS topics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create user_topics table (for tracking user progress by topic)
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_topics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        topic_id INT NOT NULL,
        progress INT DEFAULT 0,
        last_studied TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_topic (user_id, topic_id)
      )
    `);

    // Create indexes for better performance
    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_status 
      ON exam_sessions(user_id, status)
    `);

    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_exam_results_user_exam 
      ON exam_results(user_id, exam_id)
    `);

    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_questions_exam 
      ON questions(exam_id)
    `);

    await connection.execute(`
      CREATE INDEX IF NOT EXISTS idx_exam_answers_result 
      ON exam_answers(result_id)
    `);

    // Insert sample data
    await insertSampleData(connection);

    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function insertSampleData(connection) {
  try {
    // Check if sample data already exists
    const [existingExams] = await connection.execute('SELECT COUNT(*) as count FROM exams');
    if (existingExams[0].count > 0) {
      console.log('Sample data already exists, skipping insertion');
      return;
    }

    // Insert sample topics
    await connection.execute(`
      INSERT INTO topics (title, description) VALUES 
      ('Bảo hiểm xã hội', 'Các kiến thức về bảo hiểm xã hội'),
      ('Bảo hiểm y tế', 'Các kiến thức về bảo hiểm y tế'),
      ('Bảo hiểm thất nghiệp', 'Các kiến thức về bảo hiểm thất nghiệp'),
      ('Luật lao động', 'Các kiến thức về luật lao động liên quan đến bảo hiểm')
    `);

    // Insert sample exams
    await connection.execute(`
      INSERT INTO exams (title, description, time_limit, num_questions, passing_score) VALUES 
      ('Kiểm tra kiến thức Bảo hiểm xã hội cơ bản', 'Bài kiểm tra các kiến thức cơ bản về bảo hiểm xã hội', 45, 20, 70),
      ('Bài thi Bảo hiểm y tế nâng cao', 'Bài thi chuyên sâu về bảo hiểm y tế', 60, 30, 75),
      ('Luyện tập Bảo hiểm thất nghiệp', 'Bài luyện tập về quy định bảo hiểm thất nghiệp', 30, 15, 60),
      ('Tổng hợp kiến thức Luật lao động', 'Bài thi tổng hợp các kiến thức về luật lao động', 90, 50, 80)
    `);

    // Insert sample questions for first exam
    const sampleQuestions = [
      {
        question_text: 'Tuổi nghỉ hưu của nam giới theo quy định hiện hành là bao nhiêu?',
        question_type: 'multiple_choice',
        options: JSON.stringify(['60 tuổi', '62 tuổi', '65 tuổi', '67 tuổi']),
        correct_answer: '62 tuổi',
        explanation: 'Theo Luật Bảo hiểm xã hội 2014, tuổi nghỉ hưu của nam giới là 62 tuổi'
      },
      {
        question_text: 'Mức đóng bảo hiểm xã hội của người lao động là bao nhiêu phần trăm so với mức lương?',
        question_type: 'multiple_choice',
        options: JSON.stringify(['6%', '8%', '10%', '12%']),
        correct_answer: '8%',
        explanation: 'Người lao động đóng 8% mức lương đóng bảo hiểm xã hội'
      },
      {
        question_text: 'Thời gian đóng bảo hiểm xã hội tối thiểu để được hưởng lương hưu là 20 năm.',
        question_type: 'true_false',
        options: JSON.stringify(['Đúng', 'Sai']),
        correct_answer: 'true',
        explanation: 'Đúng, thời gian đóng BHXH tối thiểu để hưởng lương hưu là 20 năm'
      },
      {
        question_text: 'Bảo hiểm xã hội bao gồm những chế độ nào?',
        question_type: 'multiple_choice',
        options: JSON.stringify(['Ốm đau, thai sản', 'Tai nạn lao động', 'Nghỉ hưu, tử tuất', 'Tất cả các đáp án trên']),
        correct_answer: 'Tất cả các đáp án trên',
        explanation: 'BHXH bao gồm các chế độ: ốm đau, thai sản, tai nạn lao động, bệnh nghề nghiệp, hưu trí, tử tuất'
      },
      {
        question_text: 'Người sử dụng lao động có nghĩa vụ đóng bảo hiểm xã hội cho người lao động.',
        question_type: 'true_false',
        options: JSON.stringify(['Đúng', 'Sai']),
        correct_answer: 'true',
        explanation: 'Đúng, người sử dụng lao động có trách nhiệm đóng BHXH cho người lao động'
      }
    ];

    for (let i = 0; i < sampleQuestions.length; i++) {
      const q = sampleQuestions[i];
      await connection.execute(`
        INSERT INTO questions (exam_id, question_text, question_type, options, correct_answer, explanation) 
        VALUES (1, ?, ?, ?, ?, ?)
      `, [q.question_text, q.question_type, q.options, q.correct_answer, q.explanation]);
    }

    console.log('Sample data inserted successfully');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase }; 
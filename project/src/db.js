
const mysql = require('mysql2');

// Cấu hình kết nối MySQL
const connection = mysql.createConnection({
  host: '127.0.0.1',
  user: 'user',
  password: 'password',  
  database: 'httracnghiem',
  port: 3308  
});

// Kết nối với cơ sở dữ liệu
connection.connect((err) => {
  if (err) {
    console.error('Lỗi kết nối MySQL:', err.message);
  } else {
    console.log('Kết nối MySQL thành công!');
  }
});

module.exports = connection;

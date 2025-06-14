const jwt = require('jsonwebtoken');
const connection = require('../config/db');

const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ message: 'Không tìm thấy token xác thực' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        
        // Get user from database
        connection.query(
            'SELECT id, email, username, role FROM users WHERE id = ?',
            [decoded.userId],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ message: 'Lỗi server' });
                }
                
                if (results.length === 0) {
                    return res.status(401).json({ message: 'Không tìm thấy người dùng' });
                }

                // Add user to request object
                req.user = results[0];
                next();
            }
        );
    } catch (error) {
        res.status(401).json({ message: 'Token không hợp lệ' });
    }
};

module.exports = auth; 
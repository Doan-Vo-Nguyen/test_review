// Function to show messages
function showMessage(message, type = 'info') {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.textContent = message;

  // Set background color based on message type
  switch (type) {
    case 'success':
      messageElement.style.backgroundColor = '#4CAF50';
      break;
    case 'error':
      messageElement.style.backgroundColor = '#f44336';
      break;
    case 'info':
      messageElement.style.backgroundColor = '#2196F3';
      break;
    default:
      messageElement.style.backgroundColor = '#2196F3';
  }

  messageElement.style.color = '#fff';
  document.body.appendChild(messageElement);

  // Remove message after 3 seconds
  setTimeout(() => {
    messageElement.remove();
  }, 3000);
}

// Xử lý đăng ký người dùng
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', function(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const username = document.getElementById('username').value;
    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;

    // Gửi yêu cầu đăng ký tới backend
    fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, phone, password })
    })
    .then(response => response.json())
    .then(data => {
      const messageElement = document.createElement('div');
      messageElement.classList.add('message');
      messageElement.textContent = data.message;

      if (data.message === 'Đăng ký thành công!') {
        messageElement.style.backgroundColor = '#4CAF50';
        messageElement.style.color = '#fff';
        setTimeout(() => {
          window.location.href = 'login.html';  // Chuyển đến trang đăng nhập sau khi đăng ký thành công
        }, 2000);
      } else {
        messageElement.style.backgroundColor = '#f44336';
        messageElement.style.color = '#fff';
      }

      document.body.appendChild(messageElement);
      setTimeout(() => {
        messageElement.remove();
      }, 5000);
    })
    .catch(error => {
      const messageElement = document.createElement('div');
      messageElement.classList.add('message');
      messageElement.textContent = 'Lỗi server: ' + error;
      messageElement.style.backgroundColor = '#f44336';
      messageElement.style.color = '#fff';
      document.body.appendChild(messageElement);
      setTimeout(() => {
        messageElement.remove();
      }, 5000);
    });
  });
}

// Đăng nhập người dùng
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    console.log('Login form submitted'); // Debug log

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    console.log('Attempting login for username:', username); // Debug log

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          username: username,
          password: password
        })
      });

      console.log('Response status:', response.status); // Debug log

      const data = await response.json();
      console.log('Response data:', data); // Debug log

      if (response.ok) {
        showMessage('Đăng nhập thành công!', 'success');
        
        // Store token and basic user info in localStorage
        if (data.token) {
          localStorage.setItem('token', data.token);
          
          // Create a basic user object from the username
          const userInfo = {
            email: username, // Use username as email for now
            name: username,
            phone: '',
            id: Date.now() // Temporary ID
          };
          
          localStorage.setItem('user', JSON.stringify(userInfo));
        } else {
          showMessage('Lỗi: Không nhận được token xác thực', 'error');
          return;
        }

        // Redirect to home page after successful login
        setTimeout(() => {
          window.location.href = 'home.html';
        }, 1000);
      } else {
        showMessage(data.message || 'Đăng nhập thất bại', 'error');
      }

    } catch (error) {
      console.error('Login error:', error); // Debug log
      showMessage('Lỗi kết nối server', 'error');
    }
  });
}

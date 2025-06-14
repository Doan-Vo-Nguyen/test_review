document.addEventListener('DOMContentLoaded', () => {
  console.log('Admin login page loaded');
  
  // Check if admin is already logged in
  const adminData = localStorage.getItem('admin');
  console.log('Checking existing admin data:', adminData);
  
  if (adminData) {
    try {
      const admin = JSON.parse(adminData);
      console.log('Parsed admin data:', admin);
      if (admin && admin.token && admin.role === 'admin') {
        console.log('Admin already logged in, redirecting to home.html');
        window.location.href = 'home.html';
        return;
      }
    } catch (error) {
      console.error('Error parsing admin data:', error);
      localStorage.removeItem('admin');
    }
  }

  const adminLoginForm = document.getElementById('adminLoginForm');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  if (adminLoginForm) {
    console.log('Admin login form found, adding event listener');
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Admin login form submitted');
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      console.log('Login attempt with username:', username);

      // Clear previous messages
      if (errorMessage) {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
      }
      if (successMessage) {
        successMessage.textContent = '';
        successMessage.style.display = 'none';
      }

      try {
        // Use the same login endpoint but treat username as email for admin login
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: username, password })
        });

        const data = await response.json();

        if (response.ok) {
          // Check if the user has admin role
          if (data.role !== 'admin') {
            throw new Error('Bạn không có quyền truy cập vào trang quản trị');
          }

          // Store admin data and token
          localStorage.setItem('admin', JSON.stringify({
            username: username,
            email: username,
            token: data.token,
            role: data.role
          }));

          // Debug log
          console.log('Admin login successful, redirecting to home.html');

          // Show success message
          if (successMessage) {
            successMessage.textContent = 'Đăng nhập thành công!';
            successMessage.style.display = 'block';
          }

          // Small delay to show success message then redirect
          setTimeout(() => {
            console.log('Redirecting now...');
            window.location.href = 'home.html';
          }, 500);
        } else {
          throw new Error(data.message || 'Đăng nhập thất bại');
        }
      } catch (error) {
        console.error('Admin login error:', error);
        if (errorMessage) {
          errorMessage.textContent = error.message || 'Có lỗi xảy ra khi đăng nhập';
          errorMessage.style.display = 'block';
        }
      }
    });
  }
}); 
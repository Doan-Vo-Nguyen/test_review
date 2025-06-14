document.addEventListener('DOMContentLoaded', () => {
  const adminLoginForm = document.getElementById('adminLoginForm');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('http://localhost:3000/api/auth/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
          // Verify that the user is an admin
          if (data.role !== 'admin') {
            throw new Error('Tài khoản không có quyền admin');
          }

          // Store admin data and token
          localStorage.setItem('admin', JSON.stringify(data));

          // Show success message
          if (successMessage) {
            successMessage.textContent = 'Đăng nhập thành công!';
            successMessage.style.display = 'block';
          }

          // Redirect to admin dashboard
          window.location.href = 'home.html';
        } else {
          throw new Error(data.message || 'Đăng nhập thất bại');
        }
      } catch (error) {
        if (errorMessage) {
          errorMessage.textContent = error.message || 'Có lỗi xảy ra khi đăng nhập';
          errorMessage.style.display = 'block';
        }
      }
    });
  }
}); 
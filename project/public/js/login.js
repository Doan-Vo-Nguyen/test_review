document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  const userData = localStorage.getItem('user');
  if (userData) {
    const { role } = JSON.parse(userData);
    // Redirect to appropriate page if already logged in
    if (role === 'admin') {
      window.location.href = '../../src/admin/home.html';
    } else {
      window.location.href = '../../src/users/home.html';
    }
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          // Store user data and token
          localStorage.setItem('user', JSON.stringify({
            email: email,
            token: data.token,
            role: data.role
          }));

          // Show success message
          if (successMessage) {
            successMessage.textContent = 'Đăng nhập thành công!';
            successMessage.style.display = 'block';
          }

          // Small delay to show success message
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check user role and redirect accordingly
          if (data.role === 'admin') {
            window.location.replace('../../src/admin/home.html');
          } else {
            window.location.replace('../../src/users/home.html');
          }
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
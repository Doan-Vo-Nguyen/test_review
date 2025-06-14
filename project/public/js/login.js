document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  const userData = localStorage.getItem('user');
  if (userData) {
    const { role } = JSON.parse(userData);
    // Redirect to appropriate page if already logged in
    if (role === 'admin') {
      window.location.href = '/project/src/admin/home.html';
    } else {
      window.location.href = '/project/src/users/home.html';
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
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
          // Store user data and token with unified format
          const userData = {
            email: email,
            name: data.name || data.user?.name || 'User',
            token: data.token,
            role: data.role,
            id: data.id || data.user?.id
          };
          
          // Store in localStorage with consistent key
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Also store token separately for compatibility with practice/exam pages
          localStorage.setItem('userToken', data.token);

          // For backward compatibility with admin pages, also store admin data if role is admin
          if (data.role === 'admin') {
            const adminData = {
              username: email,
              email: email,
              token: data.token,
              role: data.role
            };
            localStorage.setItem('admin', JSON.stringify(adminData));
          }

          // Show success message
          if (successMessage) {
            successMessage.textContent = 'Đăng nhập thành công!';
            successMessage.style.display = 'block';
          }

          // Small delay to show success message
          await new Promise(resolve => setTimeout(resolve, 500));

          // Check user role and redirect accordingly
          if (data.role === 'admin') {
            window.location.replace('/project/src/admin/home.html');
          } else {
            window.location.replace('/project/src/users/home.html');
          }
        } else {
          throw new Error(data.message || 'Đăng nhập thất bại');
        }
      } catch (error) {
        console.error('Login error:', error);
        if (errorMessage) {
          errorMessage.textContent = error.message || 'Có lỗi xảy ra khi đăng nhập';
          errorMessage.style.display = 'block';
        }
      }
    });
  }
}); 
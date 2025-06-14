document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const username = document.getElementById('username').value;
            const phone = document.getElementById('phone').value;
            const password = document.getElementById('password').value;
            const referral = document.getElementById('referral').value;

            try {
                const response = await fetch('http://localhost:3000/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        username,
                        phone,
                        password,
                        referral: referral || undefined
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Show success message
                    if (successMessage) {
                        successMessage.textContent = 'Đăng ký thành công! Đang chuyển hướng...';
                        successMessage.style.display = 'block';
                    }
                    if (errorMessage) {
                        errorMessage.style.display = 'none';
                    }

                    // Redirect to unified login page after a short delay
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                } else {
                    throw new Error(data.message || 'Đăng ký thất bại');
                }
            } catch (error) {
                if (errorMessage) {
                    errorMessage.textContent = error.message || 'Có lỗi xảy ra khi đăng ký';
                    errorMessage.style.display = 'block';
                }
                if (successMessage) {
                    successMessage.style.display = 'none';
                }
            }
        });
    }
}); 
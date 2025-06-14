// Auth state
const AUTH_PAGES = ['login.html', 'register.html'];
const PROTECTED_PAGES = ['home.html', 'manage_exams.html', 'practice_exam.html', 'take_exam.html', 'history.html', 'profile.html'];

// Check if current page is an auth page
function isAuthPage() {
    const currentPage = window.location.pathname.split('/').pop();
    return AUTH_PAGES.includes(currentPage);
}

// Check if current page is a protected page
function isProtectedPage() {
    const currentPage = window.location.pathname.split('/').pop();
    return PROTECTED_PAGES.includes(currentPage);
}

// Check if user is logged in
function isLoggedIn() {
    const userData = localStorage.getItem('user');
    return userData && userData !== 'null' && userData !== 'undefined';
}

// Get user data safely with comprehensive null checks
function getUserData() {
    try {
        const userData = localStorage.getItem('user');
        if (!userData || userData === 'null' || userData === 'undefined') {
            return getDefaultUserData();
        }
        const parsed = JSON.parse(userData);
        // Ensure all required properties exist
        return {
            name: parsed?.name || 'User',
            email: parsed?.email || '',
            id: parsed?.id || null,
            role: parsed?.role || 'user',
            ...parsed
        };
    } catch (error) {
        console.error('Error parsing user data:', error);
        return getDefaultUserData();
    }
}

// Get default user data structure
function getDefaultUserData() {
    return {
        name: 'User',
        email: '',
        id: null,
        role: 'user'
    };
}

// Set user data safely with validation
function setUserData(data) {
    try {
        if (!data) {
            localStorage.setItem('user', JSON.stringify(getDefaultUserData()));
            return;
        }
        
        // Ensure data has required structure
        const safeData = {
            name: data?.name || 'User',
            email: data?.email || '',
            id: data?.id || null,
            role: data?.role || 'user',
            ...data
        };
        
        localStorage.setItem('user', JSON.stringify(safeData));
    } catch (error) {
        console.error('Error saving user data:', error);
        localStorage.setItem('user', JSON.stringify(getDefaultUserData()));
    }
}

// Mock login for testing (when backend is not available)
function mockLogin(email, password) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate successful login
            resolve({
                ok: true,
                json: () => Promise.resolve({
                    token: 'mock-token-' + Date.now(),
                    user: {
                        name: 'Test User',
                        email: email,
                        id: 1
                    }
                })
            });
        }, 500);
    });
}

// Get unified login path - ALWAYS use the main login page
function getUnifiedLoginPath() {
    // Always use absolute path from root to avoid confusion
    return '/project/public/login.html';
}

// Handle auth state and redirects
function handleAuthState() {
    const loggedIn = isLoggedIn();
    
    if (loggedIn && isAuthPage()) {
        // If user is logged in and tries to access login/register pages
        const userData = getUserData();
        if (userData.role === 'admin') {
            window.location.replace('/project/src/admin/home.html');
        } else {
            window.location.replace('/project/src/users/home.html');
        }
        return false;
    } else if (!loggedIn && isProtectedPage()) {
        // If user is not logged in and tries to access protected pages
        window.location.replace(getUnifiedLoginPath());
        return false;
    }
    return true;
}

// Add a style tag to hide the body initially
const style = document.createElement('style');
style.textContent = 'body { display: none; }';
document.head.appendChild(style);

// Handle authentication and page display
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Skip automatic auth handling for exam pages as they have their own improved logic
    if (currentPage === 'practice_exam.html' || currentPage === 'take_exam.html') {
        // Just make sure the page is visible and let the page handle its own auth
        style.remove();
        return;
    }
    
    if (handleAuthState()) {
        // Update user info in the UI if available
        const userData = getUserData();
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = userData.name;
        }
        
        // Remove the style tag to show the content
        style.remove();
    }
});

// Export functions for use in other files
window.Auth = {
    isLoggedIn,
    isAuthenticated: isLoggedIn,
    handleAuthState,
    getUserData,
    setUserData,
    mockLogin,
    logout: function() {
        // Clear ALL authentication data
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        localStorage.removeItem('user');
        localStorage.removeItem('admin');
        localStorage.removeItem('token'); // Also clear any old token format
        
        // Always redirect to unified login
        window.location.replace(getUnifiedLoginPath());
    },
    login: function(token, userData) {
        if (!token) throw new Error('Token is required');
        localStorage.setItem('userToken', token);
        setUserData(userData);
    }
}; 
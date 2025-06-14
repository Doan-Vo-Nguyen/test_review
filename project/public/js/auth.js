// Auth state
const AUTH_PAGES = ['login.html', 'register.html'];
const PROTECTED_PAGES = ['home.html', 'manage_exams.html', 'practice_exam.html', 'history.html', 'profile.html'];

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
    const token = localStorage.getItem('userToken');
    return !!token;
}

// Get user data safely with comprehensive null checks
function getUserData() {
    try {
        const userData = localStorage.getItem('userData');
        if (!userData || userData === 'null' || userData === 'undefined') {
            return getDefaultUserData();
        }
        const parsed = JSON.parse(userData);
        // Ensure all required properties exist
        return {
            name: parsed?.name || 'User',
            email: parsed?.email || '',
            id: parsed?.id || null,
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
        id: null
    };
}

// Set user data safely with validation
function setUserData(data) {
    try {
        if (!data) {
            localStorage.setItem('userData', JSON.stringify(getDefaultUserData()));
            return;
        }
        
        // Ensure data has required structure
        const safeData = {
            name: data?.name || 'User',
            email: data?.email || '',
            id: data?.id || null,
            ...data
        };
        
        localStorage.setItem('userData', JSON.stringify(safeData));
    } catch (error) {
        console.error('Error saving user data:', error);
        localStorage.setItem('userData', JSON.stringify(getDefaultUserData()));
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

// Handle auth state and redirects
function handleAuthState() {
    const loggedIn = isLoggedIn();
    
    if (loggedIn && isAuthPage()) {
        // If user is logged in and tries to access login/register pages
        window.location.replace('home.html');
        return false;
    } else if (!loggedIn && isProtectedPage()) {
        // If user is not logged in and tries to access protected pages
        window.location.replace('login.html');
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
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        window.location.replace('login.html');
    },
    login: function(token, userData) {
        if (!token) throw new Error('Token is required');
        localStorage.setItem('userToken', token);
        setUserData(userData);
    }
}; 
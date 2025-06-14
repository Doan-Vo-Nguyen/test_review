// Check if admin is logged in
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
        // Check if we're on the login page
        if (window.location.pathname.includes('login.html')) {
          console.log('Admin already logged in, redirecting to home.html');
          window.location.href = 'home.html';
          return;
        }
      }
    } catch (error) {
      console.error('Error parsing admin data:', error);
      localStorage.removeItem('admin');
    }
  } else {
    // If no admin data and we're not on login page, redirect to login
    if (!window.location.pathname.includes('login.html')) {
      console.log('No admin data found, redirecting to login');
      window.location.href = 'login.html';
      return;
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
          const adminData = {
            username: username,
            email: username,
            token: data.token,
            role: data.role
          };
          
          localStorage.setItem('admin', JSON.stringify(adminData));
          console.log('Admin data stored:', adminData);

          // Show success message
          if (successMessage) {
            successMessage.textContent = 'Đăng nhập thành công!';
            successMessage.style.display = 'block';
          }

          // Small delay to show success message then redirect
          setTimeout(() => {
            console.log('Redirecting to home.html...');
            window.location.href = 'home.html';
          }, 1000);
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

// Initialize Sidebar
function initializeSidebar() {
  const toggleBtn = document.getElementById('toggleSidebar');
  const sidebar = document.querySelector('.sidebar');
  
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });
  }

  // Handle navigation
  const navLinks = document.querySelectorAll('.sidebar-nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      showSection(targetId);
      
      // Update active state
      navLinks.forEach(l => l.parentElement.classList.remove('active'));
      link.parentElement.classList.add('active');
    });
  });
}

// Initialize Header
function initializeHeader() {
  const admin = JSON.parse(localStorage.getItem('admin'));
  const adminName = document.getElementById('adminName');
  
  if (adminName && admin) {
    adminName.textContent = admin.username || admin.email;
  }

  // Handle search
  const searchInput = document.querySelector('.search-box input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      searchContent(searchTerm);
    });
  }
}

// Initialize Profile Dropdown
function initializeProfileDropdown() {
  const userProfile = document.querySelector('.user-profile');
  const dropdownMenu = document.createElement('div');
  dropdownMenu.className = 'profile-dropdown';
  dropdownMenu.innerHTML = `
    <ul>
      <li><a href="#settings"><i class="fas fa-cog"></i> Cài đặt hệ thống</a></li>
      <li class="divider"></li>
      <li><a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a></li>
    </ul>
  `;
  userProfile.appendChild(dropdownMenu);

  // Toggle dropdown
  userProfile.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
  });

  // Handle logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
}

// Initialize Dashboard
function initializeDashboard() {
  fetchDashboardStats();
  initializeCharts();
}

// Initialize Exam Management
function initializeExamManagement() {
  const addExamBtn = document.getElementById('addExamBtn');
  if (addExamBtn) {
    addExamBtn.addEventListener('click', () => {
      showModal('addExamModal');
    });
  }

  // Initialize exam form
  const addExamForm = document.getElementById('addExamForm');
  if (addExamForm) {
    addExamForm.addEventListener('submit', (e) => {
      e.preventDefault();
      createExam();
    });
  }

  // Load existing exams
  fetchExams();
}

// Initialize Question Bank
function initializeQuestionBank() {
  const addQuestionBtn = document.getElementById('addQuestionBtn');
  if (addQuestionBtn) {
    addQuestionBtn.addEventListener('click', () => {
      showModal('addQuestionModal');
    });
  }

  // Initialize question form
  const addQuestionForm = document.getElementById('addQuestionForm');
  if (addQuestionForm) {
    addQuestionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      createQuestion();
    });
  }

  // Load existing questions
  fetchQuestions();
}

// Initialize Reports
function initializeReports() {
  const exportReportBtn = document.getElementById('exportReportBtn');
  if (exportReportBtn) {
    exportReportBtn.addEventListener('click', exportReport);
  }

  // Load report data
  fetchReportData();
}

// API Functions
async function fetchDashboardStats() {
  try {
    const token = JSON.parse(localStorage.getItem('admin')).token;
    const response = await fetch('http://localhost:3000/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch stats');
    
    const stats = await response.json();
    updateDashboardStats(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    showMessage('Không thể tải thống kê. Vui lòng thử lại sau.', 'error');
  }
}

async function fetchExams() {
  try {
    const token = JSON.parse(localStorage.getItem('admin')).token;
    const response = await fetch('http://localhost:3000/api/admin/exams', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch exams');
    
    const exams = await response.json();
    displayExams(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    showMessage('Không thể tải danh sách đề thi. Vui lòng thử lại sau.', 'error');
  }
}

async function fetchQuestions() {
  try {
    const token = JSON.parse(localStorage.getItem('admin')).token;
    const response = await fetch('http://localhost:3000/api/admin/questions', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch questions');
    
    const questions = await response.json();
    displayQuestions(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    showMessage('Không thể tải ngân hàng câu hỏi. Vui lòng thử lại sau.', 'error');
  }
}

async function fetchReportData() {
  try {
    const token = JSON.parse(localStorage.getItem('admin')).token;
    const response = await fetch('http://localhost:3000/api/admin/reports', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch report data');
    
    const reportData = await response.json();
    displayReportData(reportData);
  } catch (error) {
    console.error('Error fetching report data:', error);
    showMessage('Không thể tải dữ liệu báo cáo. Vui lòng thử lại sau.', 'error');
  }
}

// Display Functions
function updateDashboardStats(stats) {
  // Update stats cards
  document.querySelector('.stat-card:nth-child(1) p').textContent = stats.totalUsers;
  document.querySelector('.stat-card:nth-child(2) p').textContent = stats.totalExams;
  document.querySelector('.stat-card:nth-child(3) p').textContent = stats.completedExams;
  document.querySelector('.stat-card:nth-child(4) p').textContent = stats.completionRate + '%';
}

function displayExams(exams) {
  const tbody = document.getElementById('examsTableBody');
  if (!tbody) return;

  tbody.innerHTML = exams.map(exam => `
    <tr>
      <td>${exam.title}</td>
      <td>${exam.topic}</td>
      <td>${exam.questionCount}</td>
      <td>${exam.duration} phút</td>
      <td><span class="status-badge status-${exam.status.toLowerCase()}">${exam.status}</span></td>
      <td>
        <div class="action-btns">
          <button class="btn-icon-only btn-edit" onclick="editExam(${exam.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon-only btn-delete" onclick="deleteExam(${exam.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function displayQuestions(questions) {
  const tbody = document.getElementById('questionsTableBody');
  if (!tbody) return;

  tbody.innerHTML = questions.map(question => `
    <tr>
      <td>${question.text}</td>
      <td>${question.topic}</td>
      <td>${question.difficulty}</td>
      <td>${question.usageCount}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon-only btn-edit" onclick="editQuestion(${question.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-icon-only btn-delete" onclick="deleteQuestion(${question.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function displayReportData(data) {
  const tbody = document.getElementById('reportTableBody');
  if (!tbody) return;

  tbody.innerHTML = data.map(item => `
    <tr>
      <td>${item.topic}</td>
      <td>${item.totalUsers}</td>
      <td>${item.completed}</td>
      <td>${item.incomplete}</td>
      <td>${item.completionRate}%</td>
      <td>${item.averageScore}</td>
    </tr>
  `).join('');
}

// Utility Functions
function showSection(sectionId) {
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    section.style.display = section.id === sectionId ? 'block' : 'none';
  });
}

function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
  }
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('show');
  }
}

function showMessage(message, type = 'info') {
  const messageElement = document.createElement('div');
  messageElement.className = `message ${type}`;
  messageElement.textContent = message;
  document.body.appendChild(messageElement);

  setTimeout(() => {
    messageElement.remove();
  }, 3000);
}

function logout() {
  localStorage.removeItem('admin');
  window.location.href = 'login.html';
}

// Initialize modals
document.querySelectorAll('.modal .close-btn, .modal [data-dismiss="modal"]').forEach(btn => {
  btn.addEventListener('click', () => {
    const modal = btn.closest('.modal');
    if (modal) {
      hideModal(modal.id);
    }
  });
}); 
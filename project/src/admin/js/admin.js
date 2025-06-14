// Check if admin is logged in
document.addEventListener('DOMContentLoaded', () => {
  try {
    // First check if there's a regular user session
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      // If user is not an admin, redirect to user home
      if (user.role !== 'admin') {
        window.location.href = '/project/public/home.html';
        return;
      }
    }

    // Then check for admin session
    const adminData = localStorage.getItem('admin');
    if (!adminData) {
      window.location.href = 'login.html';
      return;
    }

    const admin = JSON.parse(adminData);
    if (!admin || !admin.token || admin.role !== 'admin') {
      localStorage.removeItem('admin');
      window.location.href = 'login.html';
      return;
    }

    // Initialize all sections
    initializeSidebar();
    initializeHeader();
    initializeDashboard();
    initializeExamManagement();
    initializeQuestionBank();
    initializeReports();
    initializeProfileDropdown();
  } catch (error) {
    console.error('Error initializing admin page:', error);
    localStorage.removeItem('admin');
    window.location.href = 'login.html';
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
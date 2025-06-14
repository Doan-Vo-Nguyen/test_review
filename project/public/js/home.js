// Check if user is logged in
document.addEventListener('DOMContentLoaded', () => {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) {
      window.location.replace('../../src/users/login.html');
      return;
    }

    const user = JSON.parse(userData);
    if (!user || !user.email) {
      localStorage.removeItem('user');
      window.location.replace('../../src/users/login.html');
      return;
    }

    // Verify user role and redirect if necessary
    if (user.role === 'admin' && !window.location.pathname.includes('/admin/')) {
      window.location.replace('../../src/admin/home.html');
      return;
    } else if (user.role !== 'admin' && window.location.pathname.includes('/admin/')) {
      window.location.replace('../../src/users/home.html');
      return;
    }

    // Initialize all sections
    initializeSidebar();
    initializeHeader();
    initializeDashboard();
    initializeTopics();
    initializeExams();
    initializeHistory();
    initializeProfile();
    initializeProfileDropdown();

    // Update user profile display
    const userProfileName = document.querySelector('.user-profile span');
    if (userProfileName) {
      userProfileName.textContent = user.email;
    }

    // Create profile dropdown
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
      const profileDropdown = document.createElement('div');
      profileDropdown.className = 'profile-dropdown';
      profileDropdown.innerHTML = `
        <ul>
          <li>
            <a href="#profile">
              <i class="fas fa-user"></i>
              Thông tin cá nhân
            </a>
          </li>
          <li>
            <a href="#settings">
              <i class="fas fa-cog"></i>
              Cài đặt
            </a>
          </li>
          <li class="divider"></li>
          <li>
            <a href="#" class="logout-link">
              <i class="fas fa-sign-out-alt"></i>
              Đăng xuất
            </a>
          </li>
        </ul>
      `;
      headerRight.appendChild(profileDropdown);

      // Toggle dropdown on profile click
      const userProfile = document.querySelector('.user-profile');
      if (userProfile) {
        userProfile.addEventListener('click', (e) => {
          e.stopPropagation();
          profileDropdown.classList.toggle('show');
        });
      }

      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        profileDropdown.classList.remove('show');
      });

      // Handle logout
      const logoutLink = profileDropdown.querySelector('.logout-link');
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        const isAdmin = window.location.pathname.includes('/admin/');
        window.location.replace(isAdmin ? '../../src/admin/login.html' : '../../src/users/login.html');
      });
    }

    // Function to load activities
    const loadActivities = () => {
      const activityList = document.querySelector('.activity-list');
      if (activityList) {
        // Here you would typically fetch activities from your backend
        // For now, we'll add some dummy data
        activityList.innerHTML = `
          <div class="activity-item">
            <i class="fas fa-check-circle"></i>
            <div class="activity-info">
              <p>Hoàn thành bài thi: Kiến thức cơ bản về bảo hiểm</p>
              <span>2 giờ trước</span>
            </div>
          </div>
        `;
      }
    };

    // Function to load progress
    const loadProgress = () => {
      const progressList = document.querySelector('.progress-list');
      if (progressList) {
        // Here you would typically fetch progress from your backend
        // For now, we'll add some dummy data
        progressList.innerHTML = `
          <div class="progress-item">
            <h3>Kiến thức cơ bản</h3>
            <div class="progress-bar">
              <div class="progress" style="width: 80%"></div>
            </div>
            <span>80% hoàn thành</span>
          </div>
        `;
      }
    };

    // Load initial data
    loadActivities();
    loadProgress();
  } catch (error) {
    console.error('Error initializing home page:', error);
    localStorage.removeItem('user');
    window.location.replace('../../src/users/login.html');
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
  const user = JSON.parse(localStorage.getItem('user'));
  const userNameElement = document.getElementById('userName');
  
  if (userNameElement && user) {
    userNameElement.textContent = user.name || user.email;
  }

  // Handle search
  const searchInput = document.querySelector('.search-box input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      searchContent(searchTerm);
    });
  }

  // Handle notifications
  const notificationsBtn = document.querySelector('.notifications');
  if (notificationsBtn) {
    notificationsBtn.addEventListener('click', () => {
      // TODO: Implement notifications panel
      showMessage('Tính năng thông báo đang được phát triển!', 'info');
    });
  }
}

// Initialize Dashboard
function initializeDashboard() {
  // Fetch and display stats
  fetchStats();
  // Fetch and display recent activity
  fetchRecentActivity();
}

// Initialize Topics
function initializeTopics() {
  fetchTopics();
}

// Initialize Exams
function initializeExams() {
  fetchExams();
}

// Initialize History
function initializeHistory() {
  fetchHistory();
}

// Initialize Profile
function initializeProfile() {
  const user = JSON.parse(localStorage.getItem('user'));
  const profileForm = document.querySelector('.profile-details');
  
  if (profileForm && user) {
    // Populate form with user data
    document.getElementById('fullName').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';

    // Handle form submission
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      updateProfile();
    });
  }
}

// Initialize Profile Dropdown
function initializeProfileDropdown() {
  const userProfile = document.querySelector('.user-profile');
  const userName = document.getElementById('userName');
  const user = JSON.parse(localStorage.getItem('user'));

  // Create dropdown menu
  const dropdownMenu = document.createElement('div');
  dropdownMenu.className = 'profile-dropdown';
  dropdownMenu.innerHTML = `
    <ul>
      <li><a href="#profile"><i class="fas fa-user-circle"></i> Thông tin cá nhân</a></li>
      <li><a href="#settings"><i class="fas fa-cog"></i> Cài đặt</a></li>
      <li class="divider"></li>
      <li><a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a></li>
    </ul>
  `;
  userProfile.appendChild(dropdownMenu);

  // Update user name
  if (userName && user) {
    userName.textContent = user.name || user.email;
  }

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

  // Handle dropdown menu items
  dropdownMenu.addEventListener('click', (e) => {
    const target = e.target.closest('a');
    if (!target) return;

    e.preventDefault();
    const href = target.getAttribute('href');

    if (href === '#profile') {
      showSection('profile');
    } else if (href === '#settings') {
      showMessage('Tính năng cài đặt đang được phát triển!', 'info');
    }
  });
}

// Logout function
function logout() {
  try {
    // Clear local storage
    localStorage.removeItem('user');
    localStorage.removeItem('token');

    // Redirect to login page
    window.location.replace('../../src/users/login.html');
  } catch (error) {
    console.error('Error during logout:', error);
    showMessage('Có lỗi xảy ra khi đăng xuất', 'error');
  }
}

// Show specific section
function showSection(sectionId) {
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    section.style.display = section.id === sectionId ? 'block' : 'none';
  });
}

// Search functionality
function searchContent(searchTerm) {
  // TODO: Implement search functionality
  console.log('Searching for:', searchTerm);
}

// Fetch and display stats
async function fetchStats() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/user/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch stats');
    
    const stats = await response.json();
    updateStats(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    // Use fallback data
    const fallbackStats = {
      topicsCompleted: 5,
      totalTopics: 10,
      examsCompleted: 12,
      averageScore: 8.5
    };
    updateStats(fallbackStats);
  }
}

// Update stats display
function updateStats(stats) {
  const statCards = document.querySelectorAll('.stat-card');
  if (statCards.length >= 3) {
    // Update topics completed
    const topicsCard = statCards[0].querySelector('.stat-info p');
    if (topicsCard) {
      topicsCard.textContent = `${stats.topicsCompleted || 5}/${stats.totalTopics || 10}`;
    }
    
    // Update exams completed
    const examsCard = statCards[1].querySelector('.stat-info p');
    if (examsCard) {
      examsCard.textContent = stats.examsCompleted || 12;
    }
    
    // Update average score
    const scoreCard = statCards[2].querySelector('.stat-info p');
    if (scoreCard) {
      scoreCard.textContent = stats.averageScore || 8.5;
    }
  }
}

// Fetch and display recent activity
async function fetchRecentActivity() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/user/activity', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch activity');
    
    const activities = await response.json();
    displayActivities(activities);
  } catch (error) {
    console.error('Error fetching activity:', error);
    // Use fallback data
    const fallbackActivities = [
      {
        type: 'exam',
        description: 'Hoàn thành bài thi Bảo hiểm y tế',
        date: new Date().toISOString()
      },
      {
        type: 'topic',
        description: 'Ôn tập chủ đề Bảo hiểm xã hội',
        date: new Date(Date.now() - 86400000).toISOString()
      },
      {
        type: 'profile',
        description: 'Cập nhật thông tin cá nhân',
        date: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    displayActivities(fallbackActivities);
  }
}

// Display activities
function displayActivities(activities) {
  const activityList = document.querySelector('.activity-list');
  if (!activityList) return;

  if (activities.length === 0) {
    activityList.innerHTML = '<p>Chưa có hoạt động nào.</p>';
    return;
  }

  activityList.innerHTML = activities.map(activity => `
    <div class="activity-item">
      <i class="fas ${getActivityIcon(activity.type)}"></i>
      <div class="activity-info">
        <p>${activity.description}</p>
        <small>${formatDate(activity.date)}</small>
      </div>
    </div>
  `).join('');
}

// Fetch and display topics
async function fetchTopics() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/exam/topics', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch topics');
    
    const topics = await response.json();
    displayTopics(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    // Use fallback data
    const fallbackTopics = [
      {
        id: 1,
        title: 'Bảo hiểm y tế',
        description: 'Tìm hiểu về quyền lợi và trách nhiệm trong bảo hiểm y tế',
        progress: 75
      },
      {
        id: 2,
        title: 'Bảo hiểm xã hội',
        description: 'Các quy định về bảo hiểm xã hội và chế độ hưu trí',
        progress: 50
      },
      {
        id: 3,
        title: 'Bảo hiểm thất nghiệp',
        description: 'Điều kiện và thủ tục hưởng bảo hiểm thất nghiệp',
        progress: 25
      }
    ];
    displayTopics(fallbackTopics);
  }
}

// Display topics
function displayTopics(topics) {
  const topicsGrid = document.querySelector('.topics-grid');
  if (!topicsGrid) return;

  if (topics.length === 0) {
    topicsGrid.innerHTML = '<p>Chưa có chủ đề nào.</p>';
    return;
  }

  topicsGrid.innerHTML = topics.map(topic => `
    <div class="topic-card">
      <h4>${topic.title}</h4>
      <p>${topic.description}</p>
      <div class="topic-progress">
        <div class="progress-bar" style="width: ${topic.progress}%"></div>
      </div>
      <button class="btn btn-primary" onclick="startTopic(${topic.id})">Ôn tập</button>
    </div>
  `).join('');
}

// Fetch and display exams
async function fetchExams() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/exam/exams', {
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
    // Use fallback data
    const fallbackExams = [
      {
        id: 1,
        title: 'Kiểm tra Bảo hiểm Y tế',
        description: 'Bài kiểm tra về các quy định bảo hiểm y tế cơ bản',
        duration: 30,
        questionCount: 20
      },
      {
        id: 2,
        title: 'Thi thử Bảo hiểm Xã hội',
        description: 'Đề thi thử về luật bảo hiểm xã hội và các chế độ',
        duration: 45,
        questionCount: 30
      },
      {
        id: 3,
        title: 'Bài tập Bảo hiểm Thất nghiệp',
        description: 'Câu hỏi về quyền lợi và nghĩa vụ trong bảo hiểm thất nghiệp',
        duration: 25,
        questionCount: 15
      }
    ];
    displayExams(fallbackExams);
  }
}

// Display exams
function displayExams(exams) {
  const examsGrid = document.querySelector('.exams-grid');
  if (!examsGrid) return;

  if (exams.length === 0) {
    examsGrid.innerHTML = '<p>Chưa có bài thi nào.</p>';
    return;
  }

  examsGrid.innerHTML = exams.map(exam => `
    <div class="exam-card">
      <h4>${exam.title}</h4>
      <p>${exam.description}</p>
      <div class="exam-info">
        <span><i class="fas fa-clock"></i> ${exam.duration} phút</span>
        <span><i class="fas fa-question-circle"></i> ${exam.questionCount} câu</span>
      </div>
      <button class="btn btn-primary" onclick="startExam(${exam.id})">Bắt đầu thi</button>
    </div>
  `).join('');
}

// Fetch and display history
async function fetchHistory() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/exam/history', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch history');
    
    const history = await response.json();
    displayHistory(history);
  } catch (error) {
    console.error('Error fetching history:', error);
    // Use fallback data
    const fallbackHistory = [
      {
        date: new Date().toISOString(),
        examTitle: 'Kiểm tra Bảo hiểm Y tế',
        score: '8.5/10',
        duration: 28,
        status: 'Hoàn thành'
      },
      {
        date: new Date(Date.now() - 86400000).toISOString(),
        examTitle: 'Thi thử Bảo hiểm Xã hội',
        score: '9.0/10',
        duration: 42,
        status: 'Hoàn thành'
      },
      {
        date: new Date(Date.now() - 172800000).toISOString(),
        examTitle: 'Bài tập Bảo hiểm Thất nghiệp',
        score: '7.5/10',
        duration: 23,
        status: 'Hoàn thành'
      }
    ];
    displayHistory(fallbackHistory);
  }
}

// Display history
function displayHistory(history) {
  const historyTable = document.querySelector('.history-table tbody');
  if (!historyTable) return;

  if (history.length === 0) {
    historyTable.innerHTML = '<tr><td colspan="5">Chưa có lịch sử làm bài.</td></tr>';
    return;
  }

  historyTable.innerHTML = history.map(item => `
    <tr>
      <td>${formatDate(item.date)}</td>
      <td>${item.examTitle}</td>
      <td>${item.score}</td>
      <td>${item.duration} phút</td>
      <td><span class="status ${item.status.toLowerCase()}">${item.status}</span></td>
    </tr>
  `).join('');
}

// Update profile
async function updateProfile() {
  const formData = {
    name: document.getElementById('fullName').value,
    email: document.getElementById('email').value,
    phone: document.getElementById('phone').value
  };

  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:3000/api/user/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) throw new Error('Failed to update profile');

    showMessage('Cập nhật thông tin thành công!', 'success');
  } catch (error) {
    console.error('Error updating profile:', error);
    showMessage('Không thể cập nhật thông tin. Vui lòng thử lại sau.', 'error');
  }
}

// Helper functions
function getActivityIcon(type) {
  const icons = {
    exam: 'fa-file-alt',
    topic: 'fa-book',
    profile: 'fa-user',
    default: 'fa-info-circle'
  };
  return icons[type] || icons.default;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Start topic
function startTopic(topicId) {
  // TODO: Implement topic review functionality
  showMessage('Tính năng ôn tập chủ đề đang được phát triển!', 'info');
}

// Start exam
function startExam(examId) {
  // TODO: Implement exam starting functionality
  showMessage('Tính năng làm bài thi đang được phát triển!', 'info');
}

// Show message
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
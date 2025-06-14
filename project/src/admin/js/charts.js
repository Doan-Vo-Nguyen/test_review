// Initialize all charts when the dashboard is loaded
function initializeCharts() {
  initializeTopicProgressChart();
  initializeScoreDistributionChart();
  initializeTopicCompletionChart();
  initializeExamTrendChart();
}

// Topic Progress Chart
function initializeTopicProgressChart() {
  const ctx = document.getElementById('topicProgressChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Bảo hiểm xe', 'Bảo hiểm nhân thọ', 'Bảo hiểm sức khỏe', 'Bảo hiểm tài sản', 'Bảo hiểm du lịch'],
      datasets: [{
        label: 'Đã hoàn thành',
        data: [65, 45, 80, 30, 55],
        backgroundColor: '#1a237e',
      }, {
        label: 'Chưa hoàn thành',
        data: [35, 55, 20, 70, 45],
        backgroundColor: '#e3f2fd',
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          stacked: true,
        },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: value => value + '%'
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: context => context.raw + '%'
          }
        }
      }
    }
  });
}

// Score Distribution Chart
function initializeScoreDistributionChart() {
  const ctx = document.getElementById('scoreDistributionChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61-70', '71-80', '81-90', '91-100'],
      datasets: [{
        label: 'Số lượng học viên',
        data: [5, 10, 15, 25, 35, 45, 55, 40, 30, 15],
        borderColor: '#1a237e',
        backgroundColor: 'rgba(26, 35, 126, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 10
          }
        }
      },
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Topic Completion Chart
function initializeTopicCompletionChart() {
  const ctx = document.getElementById('topicCompletionChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Đã hoàn thành', 'Đang học', 'Chưa bắt đầu'],
      datasets: [{
        data: [65, 20, 15],
        backgroundColor: ['#1a237e', '#283593', '#e3f2fd']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: context => context.label + ': ' + context.raw + '%'
          }
        }
      }
    }
  });
}

// Exam Trend Chart
function initializeExamTrendChart() {
  const ctx = document.getElementById('examTrendChart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
      datasets: [{
        label: 'Số lượng bài thi',
        data: [120, 150, 180, 220, 250, 280, 310, 350, 380, 420, 450, 480],
        borderColor: '#1a237e',
        backgroundColor: 'rgba(26, 35, 126, 0.1)',
        fill: true,
        tension: 0.4
      }, {
        label: 'Điểm trung bình',
        data: [75, 78, 76, 79, 80, 82, 81, 83, 84, 85, 86, 87],
        borderColor: '#283593',
        backgroundColor: 'rgba(40, 53, 147, 0.1)',
        fill: true,
        tension: 0.4,
        yAxisID: 'score'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          title: {
            display: true,
            text: 'Số lượng bài thi'
          }
        },
        score: {
          beginAtZero: true,
          position: 'right',
          title: {
            display: true,
            text: 'Điểm trung bình'
          },
          grid: {
            drawOnChartArea: false
          },
          max: 100
        }
      },
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

// Update chart data
function updateChartData(chartId, newData) {
  const chart = Chart.getChart(chartId);
  if (!chart) return;

  chart.data = newData;
  chart.update();
}

// Export chart as image
function exportChartAsImage(chartId) {
  const chart = Chart.getChart(chartId);
  if (!chart) return;

  const image = chart.toBase64Image();
  const link = document.createElement('a');
  link.download = `chart-${chartId}-${Date.now()}.png`;
  link.href = image;
  link.click();
}

// Export all charts
function exportAllCharts() {
  const chartIds = [
    'topicProgressChart',
    'scoreDistributionChart',
    'topicCompletionChart',
    'examTrendChart'
  ];

  chartIds.forEach(chartId => {
    exportChartAsImage(chartId);
  });
} 
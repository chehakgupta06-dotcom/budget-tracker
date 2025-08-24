let budget = { amount: 0, period: 'monthly', spent: 0 };
let transactions = [];

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;

  // Theme toggle
  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    const isDark = body.getAttribute('data-theme') === 'dark';
    body.setAttribute('data-theme', isDark ? 'light' : 'dark');
  });

  // Navigation
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();

      // Remove active class from all links and add it to the clicked one
      document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Get the page ID from the clicked link
      const pageId = link.getAttribute('data-page');

      // Hide all pages
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

      // Show the selected page
      document.getElementById(pageId).classList.add('active');

      // Update analytics page if it's selected
      if (pageId === 'analytics') updateAnalytics();
    });
  });

  // Set Budget
  document.getElementById('set-budget').addEventListener('click', () => {
    const amount = parseFloat(document.getElementById('budget-amount').value);
    const period = document.getElementById('budget-period').value;
    if (!isNaN(amount) && amount > 0) {
      budget = { amount, period, spent: 0 };
      transactions = [];
      saveData();
      updateDashboard();
      updateTransactionsList();
      updateAnalytics();
      showAlert('info', '✅ Budget set successfully!');
    } else {
      showAlert('warning', 'Please enter a valid budget amount.');
    }
  });

  // Add Transaction
  document.getElementById('add-transaction').addEventListener('click', () => {
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const category = document.getElementById('transaction-category').value;
    const description = document.getElementById('transaction-description').value;

    if (!isNaN(amount) && amount > 0 && description.trim()) {
      const txn = {
        id: Date.now(),
        type,
        amount,
        category,
        description,
        date: new Date().toLocaleDateString()
      };
      transactions.push(txn);

      if (type === 'expense') budget.spent += amount;
      else budget.spent -= amount;

      saveData();
      updateDashboard();
      updateTransactionsList();
      updateAnalytics();

      document.getElementById('transaction-amount').value = '';
      document.getElementById('transaction-description').value = '';
      showAlert('info', '✅ Transaction added!');
    } else {
      showAlert('warning', 'Please fill in all fields.');
    }
  });

  // Reset All Data
  document.getElementById('reset-data').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all data?')) {
      budget = { amount: 0, period: 'monthly', spent: 0 };
      transactions = [];
      saveData();
      updateDashboard();
      updateTransactionsList();
      updateAnalytics();
      showAlert('info', '🔁 App has been reset.');
    }
  });

  // Load saved data
  const savedBudget = localStorage.getItem('budget');
  const savedTransactions = localStorage.getItem('transactions');
  if (savedBudget) budget = JSON.parse(savedBudget);
  if (savedTransactions) transactions = JSON.parse(savedTransactions);
  updateDashboard();
  updateTransactionsList();
});

// Save data
function saveData() {
  localStorage.setItem('budget', JSON.stringify(budget));
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Dashboard Update
function updateDashboard() {
  document.getElementById('total-budget').textContent = `$${budget.amount.toFixed(2)}`;
  document.getElementById('amount-spent').textContent = `$${budget.spent.toFixed(2)}`;
  document.getElementById('remaining-budget').textContent = `$${(budget.amount - budget.spent).toFixed(2)}`;
  const percent = (budget.spent / budget.amount) * 100;
  document.getElementById('budget-progress').style.width = `${Math.min(percent, 100)}%`;

  if (percent >= 100) showAlert('warning', '🚨 You have exceeded your budget!');
  else if (percent >= 80) showAlert('warning', '⚠️ You have spent 80% of your budget!');
  else if (percent >= 50) showAlert('info', '📊 You’ve spent 50% of your budget.');
}

// Transactions List
function updateTransactionsList() {
  const container = document.getElementById('transactions-list');
  container.innerHTML = '';
  transactions.forEach(t => {
    const div = document.createElement('div');
    div.className = 'transaction-item';
    div.innerHTML = `
      <div>
        <strong>${t.description}</strong>
        <div>${t.category} • ${t.date}</div>
      </div>
      <div class="${t.type === 'expense' ? 'text-red-500' : 'text-green-500'}">
        ${t.type === 'expense' ? '-' : '+'}$${t.amount.toFixed(2)}
      </div>
    `;
    container.appendChild(div);
  });
}

// Chart.js Analytics
let barChart;

function updateAnalytics() {
  const categoryList = document.getElementById('category-list');
  const chartCanvas = document.getElementById('spending-chart');
  categoryList.innerHTML = '';

  const categoryTotals = {};
  transactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
    }
  });

  const totalSpent = budget.spent || 1; // prevent division by zero
  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);

  // Side breakdown
  labels.forEach((cat, idx) => {
    const percent = ((values[idx] / totalSpent) * 100).toFixed(1);
    const div = document.createElement('div');
    div.className = 'card mb-4';
    div.innerHTML = `
      <div class="flex justify-between items-center">
        <div>
          <h3>${cat}</h3>
          <p>$${values[idx].toFixed(2)}</p>
        </div>
        <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div class="h-full bg-primary" style="width: ${percent}%"></div>
        </div>
      </div>
    `;
    categoryList.appendChild(div);
  });

  // Bar Chart
  if (barChart) barChart.destroy();

  barChart = new Chart(chartCanvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Expenses by Category',
        data: values,
        backgroundColor: '#e50914',
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-color') },
          grid: { color: getComputedStyle(document.body).getPropertyValue('--border-color') }
        },
        y: {
          beginAtZero: true,
          ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-color') },
          grid: { color: getComputedStyle(document.body).getPropertyValue('--border-color') }
        }
      },
      plugins: {
        legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-color') } },
        tooltip: { callbacks: { label: ctx => `$${ctx.parsed.y.toFixed(2)}` } }
      }
    }
  });
}

// Alert system
function showAlert(type, message) {
  const div = document.createElement('div');
  div.className = `alert ${type}`;
  div.innerHTML = `
    <div class="alert-content">
      <i class="fas ${type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="alert-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
  `;
  document.querySelector('.container').prepend(div);
  setTimeout(() => div.remove(), 5000);
}

// main.js

document.addEventListener('DOMContentLoaded', function() {
  const tableBody = document.querySelector('#priceTable tbody');
  const addForm = document.getElementById('addForm');
  const lineChartCtx = document.getElementById('lineChart').getContext('2d');
  const searchDate = document.getElementById('searchDate');
  let allData = [];
  let chart;

  // 取得所有價格資料
  function fetchPrices() {
    fetch('/api/prices')
      .then(res => res.json())
      .then(data => {
        // 只保留日期與價格欄位
        allData = data.map(row => ({ Date: row.Date, Price: parseFloat(row.Price) }));
        allData.sort((a, b) => a.Date.localeCompare(b.Date));
        renderTable(allData);
        renderChart(allData);
      });
  }

  // 渲染表格（小數點1位）
  function renderTable(data) {
    tableBody.innerHTML = '';
    data.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${row.Date}</td><td>${row.Price.toFixed(1)}</td>`;
      tableBody.appendChild(tr);
    });
  }

  // 渲染折線圖（小數點1位）
  function renderChart(data) {
    const labels = data.map(row => row.Date);
    const prices = data.map(row => Number(row.Price.toFixed(1)));
    if (chart) chart.destroy();
    chart = new Chart(lineChartCtx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: '萵苣菜本島圓葉 價格',
          data: prices,
          borderColor: 'blue',
          fill: false
        }]
      },
      options: {
        responsive: false,
        scales: {
          x: { display: true, title: { display: true, text: '日期' } },
          y: { display: true, title: { display: true, text: '價格' }, min: 0 }
        }
      }
    });
  }

  // 日期區間查詢功能（新版，配合 index.html 兩個 input 與搜尋按鈕）
  const searchStartDate = document.getElementById('searchStartDate');
  const searchEndDate = document.getElementById('searchEndDate');
  const searchBtn = document.getElementById('searchBtn');

  searchBtn.addEventListener('click', function() {
    let start = searchStartDate.value;
    let end = searchEndDate.value;
    if (!start) {
      renderTable(allData);
      renderChart(allData);
      return;
    }
    if (!end) end = start;
    if (start > end) {
      alert('起始日不得大於結束日');
      return;
    }
    const filtered = allData.filter(row => row.Date >= start && row.Date <= end);
    renderTable(filtered);
    renderChart(filtered);
  });

  // 新增資料
  addForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(addForm);
    const Date = formData.get('date');
    const Price = parseFloat(formData.get('price'));
    if (Price < 0) {
      alert('價格不得為負數');
      return;
    }
    // 日期必須大於現有最大日期
    if (allData.length > 0) {
      const maxDate = allData[allData.length - 1].Date;
      if (Date <= maxDate) {
        alert('日期必須大於現有資料的最大日期');
        return;
      }
    }
    fetch('/api/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Date, Price })
    })
      .then(res => res.json())
      .then(() => {
        fetchPrices();
        addForm.reset();
      });
  });

  fetchPrices();
});

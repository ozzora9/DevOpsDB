// Chart.js 그래프 렌더링
document.addEventListener("DOMContentLoaded", () => {
  // 📈 월별 추이 (Line Chart)
  const lineCtx = document.getElementById("lineChart");
  new Chart(lineCtx, {
    type: "line",
    data: {
      labels: ["5월", "6월", "7월", "8월", "9월", "10월"],
      datasets: [
        {
          label: "블루",
          borderColor: "#339AF0",
          backgroundColor: "rgba(51,154,240,0.2)",
          data: [820, 950, 1020, 1150, 1247, 1280],
          tension: 0.4,
          fill: true
        },
        {
          label: "퍼플",
          borderColor: "#945EFB",
          backgroundColor: "rgba(148,94,251,0.2)",
          data: [730, 810, 920, 1000, 1098, 1130],
          tension: 0.4,
          fill: true
        },
        {
          label: "그린",
          borderColor: "#51C56E",
          backgroundColor: "rgba(81,197,110,0.2)",
          data: [640, 720, 810, 870, 967, 985],
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, position: "bottom" }
      }
    }
  });

  // 🎨 색상 분포 (Pie Chart)
  const pieCtx = document.getElementById("pieChart");
  new Chart(pieCtx, {
    type: "doughnut",
    data: {
      labels: ["블루", "퍼플", "그린", "옐로우", "오렌지", "레드", "브라운", "블랙", "화이트"],
      datasets: [
        {
          data: [1247, 1098, 967, 845, 723, 654, 589, 512, 487],
          backgroundColor: ["#339AF0", "#945EFB", "#51C56E", "#FFD43B", "#FFA94D", "#FF6B6B", "#A17C6B", "#212529", "#F8F9FA"],
          borderWidth: 2,
          borderColor: "#fff"
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" }
      },
      cutout: "60%"
    }
  });
});

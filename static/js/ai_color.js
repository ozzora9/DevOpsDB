// static/js/ai_color.js

const colors = [
  {
    name: "레드 (Red)",
    emoji: "❤️",
    hex: "#FF4B5C",
  },
  {
    name: "오렌지 (Orange)",
    emoji: "🧡",
    hex: "#FF8C42",
  },
  {
    name: "옐로우 (Yellow)",
    emoji: "💛",
    hex: "#FFD93D",
  },
  {
    name: "그린 (Green)",
    emoji: "💚",
    hex: "#4CAF50",
  },
  {
    name: "블루 (Blue)",
    emoji: "💙",
    hex: "#4A90E2",
  },
  {
    name: "퍼플 (Purple)",
    emoji: "💜",
    hex: "#A66DD4",
  },
  {
    name: "핑크 (Pink)",
    emoji: "💗",
    hex: "#FF6BA9",
  },
];

function changeColor() {
  const random = colors[Math.floor(Math.random() * colors.length)];

  document.querySelector(".color-sample").style.background = random.gradient;
  document.getElementById("color-name").textContent = `${random.emoji} ${random.name}`;
  document.getElementById("color-hex").textContent = random.hex;
  document.getElementById("color-desc").textContent = random.desc;
  document.querySelector(".keyword-box").textContent = `감정 키워드: ${random.keywords}`;
}

// static/js/ai_color.js

async function changeColor() {
  try {
    const res = await fetch('/api/color');
    const data = await res.json();

    document.querySelector('.color-sample').style.background = data.gradient;
    document.getElementById('color-name').textContent = `${data.emoji} ${data.name}`;
    document.getElementById('color-hex').textContent = data.hex;
    document.getElementById('color-desc').textContent = data.desc;
    document.querySelector('.keyword-box').textContent = `감정 키워드: ${data.keywords}`;
  } catch (err) {
    console.error('색상 정보를 불러오지 못했습니다:', err);
  }
}

// 페이지가 로드될 때도 자동 실행
document.addEventListener('DOMContentLoaded', changeColor);

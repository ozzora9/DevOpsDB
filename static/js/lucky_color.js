const paletteColors = [
  { id: 1, name: "레드", emoji: "❤️", hex: "#FF4B5C", key: "red" },
  {
    id: 2,
    name: "오렌지",
    emoji: "🧡",
    hex: "#FF8C42",
    key: "orange",
  },
  {
    id: 3,
    name: "옐로우",
    emoji: "💛",
    hex: "#FFD93D",
    key: "yellow",
  },
  { id: 4, name: "그린", emoji: "💚", hex: "#4CAF50", key: "green" },
  { id: 5, name: "블루", emoji: "💙", hex: "#4A90E2", key: "blue" },
  { id: 6, name: "퍼플", emoji: "💜", hex: "#A66DD4", key: "purple" },
  {
    id: 7,
    name: "브라운",
    emoji: "🤎",
    hex: "#8B5E3C",
    key: "brown",
  },
  { id: 8, name: "블랙", emoji: "🖤", hex: "#222", key: "black" },
  {
    id: 9,
    name: "화이트",
    emoji: "🤍",
    hex: "#FFFFFF",
    key: "white",
  },
];

let currentColor = null;

// ✅ 색상 카드 업데이트 함수
function updateColor(c) {
  currentColor = c;
  const sample = document.getElementById("color-sample");
  sample.style.background = c.hex;
  document.getElementById(
    "color-name"
  ).textContent = `${c.emoji} ${c.name}`;
  document.getElementById("color-hex").textContent = c.hex;
}

// ✅ 서버에서 랜덤 컬러 받아오기
async function loadRandomColor() {
  const res = await fetch("/api/color");
  const color = await res.json();
  updateColor(color);
}

// ✅ 특정 색상 정보 찾기
function findColorByKey(key) {
  return paletteColors.find((c) => c.key === key);
}

// ✅ 초기 로드
document.addEventListener("DOMContentLoaded", async () => {
  // URL 파라미터에서 color 키 읽기
  const params = new URLSearchParams(window.location.search);
  const colorKey = params.get("color");

  if (colorKey) {
    // 👉 main.html에서 전달된 색상일 경우: 그 색상으로 표시
    const matched = findColorByKey(colorKey);
    if (matched) {
      updateColor({
        name: matched.name,
        emoji: matched.emoji,
        hex: matched.hex,
        key: matched.key,
        // desc: `${matched.name} 감성을 표현하는 색상이에요.`,
        // keywords: "감성, 색상, 감정",
      });
    } else {
      // 없는 key면 랜덤으로 fallback
      await loadRandomColor();
    }
  } else {
    // 파라미터가 없으면 기본 랜덤 컬러 표시
    await loadRandomColor();
  }

  // 🔄 다른 색상 보기 → 새 랜덤 호출
  document
    .getElementById("refresh-btn")
    .addEventListener("click", loadRandomColor);

  // 📸 사진 찍으러 가기
  document
    .getElementById("upload-btn")
    .addEventListener("click", () => {
      if (currentColor.id) {
        window.location.href = `/upload?color_id=${currentColor.id}`;
      }
    });

  // 🎨 하단 감성 컬러 버튼 생성
  const palette = document.getElementById("color-palette");
  paletteColors.forEach((c) => {
    const btn = document.createElement("button");
    btn.className = "color-btn";
    btn.style.background = c.hex;
    btn.innerHTML = `<span>${c.emoji}</span>`;
    btn.title = c.name;

    btn.addEventListener("click", () => {
      updateColor({
        id: c.id,
        name: c.name,
        emoji: c.emoji,
        hex: c.hex,
        key: c.key,
      });
    });

    palette.appendChild(btn);
  });
});

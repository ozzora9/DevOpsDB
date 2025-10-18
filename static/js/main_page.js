// static/js/main_page.js

const colorCategories = [
  { name: "레드", emoji: "❤️", hex: "#FF4B5C", key: "red" },
  { name: "오렌지", emoji: "🧡", hex: "#FF8C42", key: "orange" },
  { name: "옐로우", emoji: "💛", hex: "#FFD93D", key: "yellow" },
  { name: "그린", emoji: "💚", hex: "#4CAF50", key: "green" },
  { name: "블루", emoji: "💙", hex: "#4A90E2", key: "blue" },
  { name: "퍼플", emoji: "💜", hex: "#A66DD4", key: "purple" },
  { name: "브라운", emoji: "🤎", hex: "#8B5E3C", key: "brown" },
  { name: "블랙", emoji: "🖤", hex: "#222", key: "black" },
  { name: "화이트", emoji: "🤍", hex: "#FFFFFF", key: "white" },
];

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("category-list");

  colorCategories.forEach(c => {
    const btn = document.createElement("button");
    btn.className = "category-btn";
    btn.style.background = c.hex;
    btn.innerHTML = `<span class="emoji">${c.emoji}</span><span>${c.name}</span>`;
    
    btn.addEventListener("click", () => {
      // ✅ 영어 key로 이동
      window.location.href = `/gallery/${c.key}`;
    });
    
    container.appendChild(btn);
  });
});

document.addEventListener("DOMContentLoaded", async () => {
  const colorSample = document.getElementById("color-sample");
  const colorName = document.getElementById("color-name");
  const colorHex = document.getElementById("color-hex");
  const colorDesc = document.getElementById("color-desc");
  const detailBtn = document.querySelector(".today-color-box .btn.small");

  // 🎨 랜덤 색상 가져오기
  const res = await fetch("/api/color");
  const color = await res.json();

  // ✅ 메인 페이지에 표시
  colorSample.style.background = color.hex;
  colorName.textContent = `${color.emoji} ${color.name}`;
  colorHex.textContent = color.hex;
  colorDesc.textContent = color.desc;

  // ✅ “자세히 보기” 버튼 클릭 시 해당 색상 전달
  detailBtn.addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = `/luckycolor?color=${color.key}`;
  });
});


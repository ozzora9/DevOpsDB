document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const titleEl = document.getElementById("gallery-title");
  const descEl = document.getElementById("gallery-desc");
  const iconEl = document.getElementById("color-icon");

  const colorMap = {
    1: { key: "red", name: "레드", hex: "#FF6B6B" },
    2: { key: "orange", name: "오렌지", hex: "#FFA94D" },
    3: { key: "yellow", name: "옐로우", hex: "#FFD43B" },
    4: { key: "green", name: "그린", hex: "#51C56E" },
    5: { key: "blue", name: "블루", hex: "#339AF0" },
    6: { key: "purple", name: "퍼플", hex: "#945EFB" },
    7: { key: "brown", name: "브라운", hex: "#A17C6B" },
    8: { key: "black", name: "블랙", hex: "#212529" },
    9: { key: "white", name: "화이트", hex: "#F8F9FA" },
  };

  // ✅ URL에서 color_id 또는 key 추출
  const pathParts = window.location.pathname.split("/");
  let rawColor = pathParts.length > 2 ? pathParts[2] : "all";
  rawColor = rawColor.replace(/\?.*$/, "");

  // ✅ 숫자 또는 key 모두 대응
  let current;
  if (isNaN(rawColor)) {
    // red, blue 등 문자열이면 key로 매칭
    current = Object.values(colorMap).find(
      (c) => c.key === rawColor
    ) || {
      key: "all",
      name: "전체",
      hex: "#EDE7F6",
    };
  } else {
    // 숫자면 id로 매칭
    const colorId = parseInt(rawColor);
    current = colorMap[colorId] || {
      key: "all",
      name: "전체",
      hex: "#EDE7F6",
    };
  }

  // ✅ 상단 타이틀 & 아이콘 업데이트
  titleEl.textContent = `${current.name} 갤러리`;
  descEl.textContent = `${current.hex}`;
  iconEl.style.background = current.hex;

  // ✅ 버튼 상태 갱신
  filterButtons.forEach((b) => b.classList.remove("active"));
  const targetBtn = document.querySelector(
    `.filter-btn[data-color="${current.key}"]`
  );
  if (targetBtn) targetBtn.classList.add("active");

  // ✅ 버튼 클릭 시 서버로 이동
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.getAttribute("data-color");
      console.log("🔥 버튼 클릭됨:", color);
      window.location.href = `/gallery/${color}`;
    });
  });
});

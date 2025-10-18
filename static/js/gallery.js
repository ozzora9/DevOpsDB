// 🎨 gallery.js (수정된 버전)
document.addEventListener("DOMContentLoaded", () => {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const photoCards = document.querySelectorAll(".photo-card");

  const titleEl = document.getElementById("gallery-title");
  const descEl = document.getElementById("gallery-desc");
  const iconEl = document.getElementById("color-icon");

  // 색상 매핑 테이블 (id ↔ key)
  const colorMap = {
    1: { key: "red", name: "레드", hex: "#FF6B6B" },
    2: { key: "orange", name: "오렌지", hex: "#FFA94D" },
    3: { key: "yellow", name: "옐로우", hex: "#FFD43B" },
    4: { key: "green", name: "그린", hex: "#51C56E" },
    5: { key: "blue", name: "블루", hex: "#339AF0" },
    6: { key: "purple", name: "퍼플", hex: "#945EFB" },
    7: { key: "brown", name: "브라운", hex: "#A17C6B" },
    8: { key: "black", name: "블랙", hex: "#212529" },
    9: { key: "white", name: "화이트", hex: "#F8F9FA" }
  };

  // ✅ URL 경로에서 color_id 추출 (숫자 or "all")
  const pathParts = window.location.pathname.split("/");
  let rawColor = pathParts.length > 2 ? pathParts[2] : "all";
  rawColor = rawColor.replace(/\?.*$/, "");  // ← 쿼리스트링 제거
  const colorId = isNaN(rawColor) ? "all" : parseInt(rawColor);
  const current = colorMap[colorId] || { key: "all", name: "전체", hex: "#EDE7F6" };

  // ✅ 필터링 함수
  function applyFilter(colorKey) {
    // 버튼 active 토글
    filterButtons.forEach(b => b.classList.remove("active"));
    const targetBtn = document.querySelector(`.filter-btn[data-color="${colorKey}"]`);
    if (targetBtn) targetBtn.classList.add("active");

    // 카드 필터링
    photoCards.forEach(card => {
      const cardColor = card.getAttribute("data-color");
      if (colorKey === "all" || cardColor === colorKey) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });

    // 상단 타이틀 업데이트
    titleEl.textContent = `${current.name} 갤러리`;
    descEl.textContent = `${current.hex}`;
    iconEl.style.background = current.hex;
  }

  // ✅ 초기 필터 적용
  applyFilter(current.key);

  // ✅ 버튼 클릭 시
  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.getAttribute("data-color");

      if (color === "all") {
        // 🔹 전체 버튼은 서버에서 전체 다시 렌더링
        window.location.href = "/gallery/all";
        return;
      }

      applyFilter(color);
      window.history.pushState({}, "", `/gallery/${color}`);
    });
  });
});
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
  // ===================================================
  // 🪟 사진 클릭 시 모달 열기 기능 추가
  // ===================================================
  const modal = document.getElementById("photoModal");
  const closeBtn = document.querySelector(".close-btn");
  const modalImg = document.getElementById("modalImage");
  const modalDesc = document.getElementById("modalDesc");
  const modalLoc = document.getElementById("modalLoc");
  const modalUser = document.getElementById("modalUser");
  const modalShotTime = document.getElementById("modalShotTime");
  const likeCount = document.getElementById("likeCount");
  const likeBtn = document.getElementById("likeBtn");
  const commentList = document.getElementById("commentList");
  const commentInput = document.getElementById("commentInput");
  const commentSubmit = document.getElementById("commentSubmit");

  // ✅ 댓글 목록 렌더링 함수
  const renderComments = (comments) => {
    commentList.innerHTML = "";
    comments.forEach((c) => {
      const p = document.createElement("p");
      p.textContent = `💬 ${c.username}: ${c.content}`;
      commentList.appendChild(p);
    });
  };

  // ✅ 각 사진 카드 클릭 시 상세보기
  document.querySelectorAll(".photo-card").forEach((card) => {
    card.addEventListener("click", async () => {
      const photoId = card.getAttribute("data-photo-id");
      modal.style.display = "flex";

      try {
        const res = await fetch(`/photo/${photoId}`);
        const data = await res.json();

        // 모달 채우기
if (data.image_path.startsWith("static/")) {
  modalImg.src = `/${data.image_path}`;
} else {
  modalImg.src = `/static/${data.image_path}`;
}

modalDesc.textContent = data.description || "설명 없음";
modalLoc.textContent = `📍 ${data.location || "위치 미등록"}`;
modalUser.textContent = `👤 ${data.username}`;
modalShotTime.textContent = `📅 ${data.shot_time || "촬영시간 정보 없음"}`;
likeCount.textContent = data.likes_count;
likeBtn.textContent = data.liked ? "❤️ 취소" : "🤍 좋아요";

        renderComments(data.comments);

        // 좋아요 버튼 동작
        likeBtn.onclick = async () => {
          const res = await fetch(`/like/${photoId}`, { method: "POST" });
          const result = await res.json();
          likeCount.textContent = result.likes_count;
          likeBtn.textContent = result.liked ? "❤️ 취소" : "🤍 좋아요";
        };

        // 댓글 등록
        commentSubmit.onclick = async () => {
          const content = commentInput.value.trim();
          if (!content) return;
          const res = await fetch(`/comment/${photoId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });
          const result = await res.json();
          renderComments(result.comments);
          commentInput.value = "";
        };
      } catch (err) {
        console.error("❌ 사진 상세 로딩 실패:", err);
      }
    });
  });

  // ✅ 모달 닫기 버튼
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // ✅ 모달 바깥 클릭 시 닫기
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

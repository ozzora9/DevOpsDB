document.addEventListener("DOMContentLoaded", () => {
  /* ===============================
     🧱 페이지 가드 (이게 핵심)
     =============================== */
  // 갤러리 카드가 없으면 이 JS는 실행 안 함
  if (!document.querySelector(".photo-card")) return;

  /* ===============================
     🎨 상단 필터 / 타이틀
     =============================== */
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

  const pathParts = window.location.pathname.split("/");
  let rawColor = pathParts.length > 2 ? pathParts[2] : "all";
  rawColor = rawColor.replace(/\?.*$/, "");

  let current;
  if (isNaN(rawColor)) {
    current = Object.values(colorMap).find(
      (c) => c.key === rawColor
    ) || { key: "all", name: "전체", hex: "#EDE7F6" };
  } else {
    current = colorMap[parseInt(rawColor)] || {
      key: "all",
      name: "전체",
      hex: "#EDE7F6",
    };
  }

  titleEl.textContent = `${current.name} 갤러리`;
  descEl.textContent = current.hex;
  iconEl.style.background = current.hex;

  filterButtons.forEach((b) => b.classList.remove("active"));
  const targetBtn = document.querySelector(
    `.filter-btn[data-color="${current.key}"]`
  );
  if (targetBtn) targetBtn.classList.add("active");

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color;
      window.location.href = `/gallery/${color}`;
    });
  });

  /* ===============================
     🪟 모달 DOM
     =============================== */
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

  if (!modal || !modalImg) return;

  /* ===============================
     💬 댓글 렌더링
     =============================== */
  const renderComments = (comments) => {
    commentList.innerHTML = "";
    comments.forEach((c) => {
      const p = document.createElement("p");
      p.textContent = `💬 ${c.username}: ${c.content}`;
      commentList.appendChild(p);
    });
  };

  /* ===============================
     📸 사진 클릭 → 모달
     =============================== */
  document.querySelectorAll(".photo-card").forEach((card) => {
    card.addEventListener("click", async () => {
      const photoId = card.dataset.photoId;
      modal.style.display = "flex";

      try {
        const res = await fetch(`/photo/${photoId}`);
        const data = await res.json();

        modalImg.src = data.image_path.startsWith("static/")
          ? `/${data.image_path}`
          : `/static/${data.image_path}`;

        modalDesc.textContent = data.description || "설명 없음";
        if (data.location) {
          modalLoc.textContent = `📍 ${data.location}`;
        } else if (data.gps_latitude && data.gps_longitude) {
          modalLoc.textContent = `📍 ${data.gps_latitude.toFixed(
            5
          )}, ${data.gps_longitude.toFixed(5)}`;
        } else {
          modalLoc.textContent = "📍 위치 미등록";
        }

        modalUser.textContent = `👤 ${data.username}`;
        modalShotTime.textContent = `📅 ${
          data.created_at || "촬영시간 정보 없음"
        }`;
        likeCount.textContent = data.likes_count;
        likeBtn.textContent = data.liked ? "❤️ 취소" : "🤍 좋아요";

        renderComments(data.comments);

        likeBtn.onclick = async () => {
          const res = await fetch(`/like/${photoId}`, {
            method: "POST",
          });
          const result = await res.json();
          likeCount.textContent = result.likes_count;
          likeBtn.textContent = result.liked
            ? "❤️ 취소"
            : "🤍 좋아요";
        };

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

  /* ===============================
     ❌ 모달 닫기
     =============================== */
  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
});

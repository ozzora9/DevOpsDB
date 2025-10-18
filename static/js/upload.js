// 🎨 색상 팔레트 (main.js에서 넘어온 color_id와 매핑)
const paletteColors = [
  { id: 1, name: "레드", emoji: "❤️", hex: "#FF4B5C", key: "red" },
  { id: 2, name: "오렌지", emoji: "🧡", hex: "#FF8C42", key: "orange" },
  { id: 3, name: "옐로우", emoji: "💛", hex: "#FFD93D", key: "yellow" },
  { id: 4, name: "그린", emoji: "💚", hex: "#4CAF50", key: "green" },
  { id: 5, name: "블루", emoji: "💙", hex: "#4A90E2", key: "blue" },
  { id: 6, name: "퍼플", emoji: "💜", hex: "#A66DD4", key: "purple" },
  { id: 7, name: "브라운", emoji: "🤎", hex: "#8B5E3C", key: "brown" },
  { id: 8, name: "블랙", emoji: "🖤", hex: "#222", key: "black" },
  { id: 9, name: "화이트", emoji: "🤍", hex: "#FFFFFF", key: "white" },
];

// ✅ 페이지 로드시 URL 쿼리 또는 hidden input에서 color_id 읽기
document.addEventListener("DOMContentLoaded", () => {
  const colorIdInput = document.getElementById("color_id");
  const sample = document.getElementById("color-sample");
  const colorName = document.getElementById("color-name");
  const colorHex = document.getElementById("color-hex");

  let colorId = colorIdInput.value || new URLSearchParams(window.location.search).get("color_id");

  if (colorId) {
    const color = paletteColors.find(c => c.id === parseInt(colorId));
    if (color) {
      sample.style.background = color.hex;
      colorName.textContent = `${color.emoji} ${color.name}`;
      colorHex.textContent = color.hex;
      colorIdInput.value = color.id;
    }
  } else {
    colorName.textContent = "색상이 선택되지 않았어요";
    colorHex.textContent = "#------";
  }

  // ✅ 업로드 관련 요소
  const uploadArea = document.getElementById("upload-area");
  const fileInput = document.getElementById("file-input");

  // ✅ 클릭 시 파일 선택창 열기
  uploadArea.addEventListener("click", () => fileInput.click());

  // ✅ 파일 선택 시 미리보기
  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다!");
      fileInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      // 기존 내용 숨기기 (아이콘 + 텍스트)
      uploadArea.querySelector("i").style.display = "none";
      uploadArea.querySelector("p").style.display = "none";

      // 기존 미리보기 있으면 제거
      const existingPreview = uploadArea.querySelector(".preview-box");
      if (existingPreview) existingPreview.remove();

      // ✅ 새 미리보기 생성
      const previewBox = document.createElement("div");
      previewBox.classList.add("preview-box");
      previewBox.innerHTML = `
        <img src="${e.target.result}" alt="미리보기" class="preview-image">
        <button type="button" class="remove-btn">❌</button>
      `;
      uploadArea.appendChild(previewBox);

      // ❌ 버튼 클릭 시 미리보기 제거 + 원래 UI 복원
      previewBox.querySelector(".remove-btn").addEventListener("click", () => {
        previewBox.remove();
        fileInput.value = "";
        uploadArea.querySelector("i").style.display = "block";
        uploadArea.querySelector("p").style.display = "block";
      });
    };
    reader.readAsDataURL(file);
  });

  // ✅ 폼 제출 시 유효성 검사
  const form = document.getElementById("upload-form");
  form.addEventListener("submit", e => {
    if (!fileInput.files[0]) {
      e.preventDefault();
      alert("⚠️ 이미지를 선택해주세요.");
      return;
    }
    if (!colorIdInput.value) {
      e.preventDefault();
      alert("🎨 색상이 지정되지 않았습니다.");
      return;
    }

    alert("✅ 업로드가 완료되면 선택한 색상 갤러리로 이동합니다!");
  });
});

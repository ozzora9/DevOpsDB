const fac = new FastAverageColor();

// 🎨 색상 팔레트 (main.js에서 넘어온 color_id와 매핑)
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

// ✅ 페이지 로드시 URL 쿼리 또는 hidden input에서 color_id 읽기
document.addEventListener("DOMContentLoaded", () => {
  const colorIdInput = document.getElementById("color_id");
  const sample = document.getElementById("color-sample");
  const colorName = document.getElementById("color-name");
  const colorHex = document.getElementById("color-hex");

  let colorId =
    colorIdInput.value ||
    new URLSearchParams(window.location.search).get("color_id");

  if (colorId) {
    const color = paletteColors.find(
      (c) => c.id === parseInt(colorId)
    );
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
      const existingPreview =
        uploadArea.querySelector(".preview-box");
      if (existingPreview) existingPreview.remove();

      // ✅ 새 미리보기 생성
      const previewBox = document.createElement("div");
      previewBox.classList.add("preview-box");
      previewBox.innerHTML = `
        <img src="${e.target.result}" alt="미리보기" class="preview-image">
        <button type="button" class="remove-btn">❌</button>
      `;
      uploadArea.appendChild(previewBox);

      const previewImage = previewBox.querySelector(".preview-image");
      previewImage.addEventListener("load", async () => {
        // ✅ 밝은 배경(흰색·회색) 무시하고 평균색 계산
        const color = await fac.getColorAsync(previewImage, {
          ignoredColor: [240, 240, 240, 255], // 거의 흰색 영역 무시
        });

        const [r, g, b] = color.value;
        const { h, s, v } = rgbToHsv(r, g, b);

        // ✅ 콘솔 평균색 확인 
        console.log("🎨 HSV:", h.toFixed(1), s.toFixed(2), v.toFixed(2));

        const detected = getColorCategory(h, s, v);

        // 2. 선택된 color_id 기반 팔레트 색상 가져오기
        const colorId = parseInt(
          document.getElementById("color_id").value
        );
        const selectedColor = paletteColors.find(
          (c) => c.id === colorId
        );

        if (!selectedColor) {
          alert("🎨 색상이 올바르게 선택되지 않았습니다.");
          return;
        }

        const colorMap = {
          빨강: "red",
          주황: "orange",
          노랑: "yellow",
          초록: "green",
          파랑: "blue",
          보라: "purple",
          브라운: "brown",
          검정: "black",
          흰색: "white",
        };

        // 3. 검증 로직
        const isMatch = colorMap[detected] === selectedColor.key;
        selectedColor.key.slice(0, 1);
        if (!isMatch) {
          alert(
            `❌ 이 사진의 대표 색상은 ${detected}로 분석됩니다.\n선택한 ${selectedColor.name} 색상과 일치하지 않습니다.`
          );
          fileInput.value = "";
          previewBox.remove();
          uploadArea.querySelector("i").style.display = "block";
          uploadArea.querySelector("p").style.display = "block";
          return;
        }

        console.log(`✅ 색상 일치: ${selectedColor.name}`);
      });

      // ❌ 버튼 클릭 시 미리보기 제거 + 원래 UI 복원
      previewBox
        .querySelector(".remove-btn")
        .addEventListener("click", () => {
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
  form.addEventListener("submit", (e) => {
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

//⭐ RGB → HSV 변환 함수 추가
function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const d = max - min;
  let h,
    s,
    v = max;

  if (d === 0) h = 0;
  else if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  s = max === 0 ? 0 : d / max;
  return { h, s, v };
}


//⭐
function getColorCategory(h, s, v, r, g, b) {
  // ----- ⚫ 흰색 / 검정 (V < 0.26 검정 유지) -----
  if (v < 0.26) return "검정"; 
  if (v > 0.93 && s < 0.10) return "흰색"; //g

  // ================================
  // ① 저채도(파스텔톤) - 흰색/회색 분류 강화
  // ================================
  if (s < 0.25) {
    
    // ⭐ 핵심 수정: S가 0.10 이하(거의 무채색)일 때 V > 0.5면 '흰색' (회색)으로 분류.
    // H=24.0, S=0.04, V=0.51이 '흰색'으로 분류되도록 합니다.
    if (s <= 0.10 && v > 0.5) {
        return "흰색"; 
    }
    
    // ⭐ 기존의 V > 0.8 흰색 조건 (s < 0.25 범위에서 s > 0.10 인 색상 포괄)
    // S가 0.10 초과지만 여전히 저채도(S < 0.25)이면서 V > 0.8인 밝은 회백색은 '흰색'으로 분류
    if (v > 0.8) return "흰색"; //g
    
    // 기존의 V > 0.8은 그대로 둡니다. (매우 밝은 흰색)
    if (v > 0.8) return "흰색"; 
    
    // 💡 V > 0.6 이상인 밝은 유채색 (노랑/주황/초록)
    if (v > 0.85 && s > 0.10 && h >= 70 && h < 170) return "초록";
    if (h >= 40 && h < 70 && v > 0.6) return "노랑"; 
    if (h >= 20 && h < 40 && v > 0.6) return "주황"; 
    
    if (h >= 245 && h < 330 && v > 0.5) return "보라"; 
    if (h >= 170 && h < 245 && v > 0.5) return "파랑"; 

    if ( (h >= 330 || h < 20) && v > 0.4) return "빨강"; 

    // V <= 0.40 영역은 이미 V < 0.26 검정에 의해 상당 부분 처리됨
    if (v <= 0.40) {
      if ((h >= 15 && h < 45) || (h >= 330 || h < 15)) return "갈색";
    }

    // 이 코드가 '노랑' 오분류의 원인이었으나, 상위 V > 0.5 흰색 조건에 의해 V=0.25가 더 이상 여기 도달하지 않음
    return "노랑";
  }

  // ================================
  // ② 주황·노랑 계열
  // ================================
  if (h >= 40 && h < 70 && v > 0.45 && s > 0.15) { 
    if (h < 55) return "주황"; 
    return "노랑"; 
  }

  // ----- 주황 / 갈색 (H=14.0 문제 해결 로직 유지) -----
  if (h >= 15 && h < 45) {
    if (s >= 0.4) return "주황";
    if (v >= 0.45 && s >= 0.3) return "주황";
    if (s < 0.4 && v < 0.45) return "갈색";
  }

  // ================================
  // ③ 빨강·분홍·노을 영역 (보라 오분류 방지 로직 유지)
  // ================================
  if ((h >= 330 && h <= 360) || (h >= 0 && h < 40)) { 
    if (s >= 0.5 && v > 0.35) return "빨강"; 
    if (s >= 0.4 && v >= 0.45 && v < 0.7) return "주황"; 
  }

  // ❤️ 진한 빨강 유지
  if ((h >= 350 || h < 40) && s >= 0.5 && v > 0.2) return "빨강"; 
  if ((h >= 350 || h < 40) && s >= 0.45 && v > 0.25) return "빨강"; 

  // ================================
  // ④ 일반 색상 / 보라 경계
  // ================================
  if (h >= 240 && h < 345 && s >= 0.15 && v >= 0.2) return "보라"; 
  if (h >= 45 && h < 70) return "노랑";
  if (h >= 70 && h < 170) return "초록";
  
  if (h >= 170 && h < 240 && v >= 0.2) return "파랑"; 
  
  if (h >= 15 && h < 45) return "주황";
  if (h >= 240 && h < 330) return "보라"; 

  // 🔚 기본값
  return "보라";
}
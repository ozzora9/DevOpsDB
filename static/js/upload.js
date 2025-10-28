// 🎨 색상 팔레트
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

// ✅ 페이지 로드시 색상 세팅
document.addEventListener("DOMContentLoaded", () => {
  const colorIdInput = document.getElementById("color_id");
  const sample = document.getElementById("color-sample");
  const colorName = document.getElementById("color-name");
  const colorHex = document.getElementById("color-hex");

  let colorId =
    colorIdInput.value ||
    new URLSearchParams(window.location.search).get("color_id");

  if (colorId) {
    const color = paletteColors.find((c) => c.id === parseInt(colorId));
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

  // ✅ 업로드 관련
  const uploadArea = document.getElementById("upload-area");
  const fileInput = document.getElementById("file-input");

  uploadArea.addEventListener("click", () => fileInput.click());

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
      uploadArea.querySelector("i").style.display = "none";
      uploadArea.querySelector("p").style.display = "none";

      const existingPreview = uploadArea.querySelector(".preview-box");
      if (existingPreview) existingPreview.remove();

      const previewBox = document.createElement("div");
      previewBox.classList.add("preview-box");
      previewBox.innerHTML = `
        <img src="${e.target.result}" alt="미리보기" class="preview-image">
        <button type="button" class="remove-btn">❌</button>
      `;
      uploadArea.appendChild(previewBox);

      const previewImage = previewBox.querySelector(".preview-image");

      // ✅ (수정된 핵심 부분 시작)
      previewImage.addEventListener("load", async () => {
        const { dominantColor, colorRatio } = await analyzeImageDominantColor(previewImage);

        console.table(colorRatio);
        console.log(`🎨 대표 색상: ${dominantColor}`);

        const colorId = parseInt(document.getElementById("color_id").value);
        const selectedColor = paletteColors.find((c) => c.id === colorId);

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

        const targetColorKey = selectedColor.key;
        const matchedColorName = Object.keys(colorMap).find(
          (k) => colorMap[k] === targetColorKey
        );

        const ratio = colorRatio[matchedColorName] || 0;
        const topColor = dominantColor; // 🎯 이미지의 대표색 (가장 많은 색)
        const topRatio = colorRatio[topColor];

        console.log(`대표색: ${topColor} (${topRatio.toFixed(2)}%)`);
        console.log(`선택색: ${selectedColor.name} (${ratio.toFixed(2)}%)`);

        // ✅ 수정된 업로드 검증 방식
        if (topColor === matchedColorName) {
          alert(
            `✅ 대표 색상 '${topColor}'이(가) 선택한 '${selectedColor.name}'과 일치합니다.\n업로드 가능합니다!`
          );
        } else {
          const recommended = colorMap[topColor]
            ? paletteColors.find((c) => c.key === colorMap[topColor])
            : null;

          const recommendationMsg = recommended
            ? `📸 이 사진은 '${recommended.name}' (${topColor}) 색상으로 올리는 게 더 적합합니다.`
            : "";

          alert(
            `❌ 선택한 '${selectedColor.name}'은(는) 대표 색상과 다릅니다.\n` +
            `대표 색상은 '${topColor}' (${topRatio.toFixed(2)}%) 입니다.\n\n${recommendationMsg}`
          );

          fileInput.value = "";
          previewBox.remove();
          uploadArea.querySelector("i").style.display = "block";
          uploadArea.querySelector("p").style.display = "block";
          return;
        }
      });
      // ✅ (수정된 핵심 부분 끝)

      // ❌ 버튼 클릭 시 미리보기 제거
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

  // ✅ 폼 제출 유효성 검사
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

// ========================================================
// 🎨 픽셀 단위 색상 비율 분석 함수
// ========================================================
async function analyzeImageDominantColor(previewImage) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = previewImage.width;
    canvas.height = previewImage.height;
    ctx.drawImage(previewImage, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const colorCount = {
      빨강: 0, 주황: 0, 노랑: 0, 초록: 0, 파랑: 0,
      보라: 0, 브라운: 0, 흰색: 0, 검정: 0
    };

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const { h, s, v } = rgbToHsv(r, g, b);
      const color = getColorCategory(h, s, v, r, g, b);
      if (colorCount[color] !== undefined) colorCount[color]++;
    }

    const totalPixels = data.length / 4;
    const colorRatio = {};
    for (const c in colorCount) {
      colorRatio[c] = (colorCount[c] / totalPixels) * 100;
    }

    const sorted = Object.entries(colorRatio).sort((a, b) => b[1] - a[1]);
    const dominantColor = sorted[0][0];
    resolve({ dominantColor, colorRatio });
  });
}

// ========================================================
// ✅ RGB → HSV 변환 / 색상 분류 함수 (기존 그대로 유지)
// ========================================================
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const d = max - min;
  let h, s, v = max;

  if (d === 0) h = 0;
  else if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  s = max === 0 ? 0 : d / max;
  return { h, s, v };
}


function getColorCategory(h, s, v, r, g, b) {
  
  if (v < 0.15) return "검정"; // ⭐ V < 0.20 에서 V < 0.15로 낮춤
  if (v > 0.93 && s < 0.10) return "흰색"; //g

  // ================================
  // 🧡 갈색 (Brown) 조건 우선 적용 (H: 10~44, S < 0.7, V < 0.8)
  // ================================
  if (h >= 10 && h < 44 && s < 0.8 && v < 0.65) {
    return "갈색";
  }

  // ================================
  // ① 저채도(파스텔톤) - 흰색/회색 분류 강화
  // ================================
  if (s < 0.25) {

    if (s <= 0.10 && v > 0.5) {
        return "흰색"; 
    }

    // 💡 V > 0.6 이상인 밝은 유채색 (새로운 H 범위 적용)
    if (v > 0.6) {
        // 주황 (30~45)
        if (h >= 30 && h < 45) return "주황";
        // 노랑 (45~70)
        if (h >= 45 && h < 70) return "노랑"; 
        // 초록 (70~160)
        if (h >= 70 && h < 160) return "초록";
        // 파랑 (160~255)
        if (h >= 160 && h < 255) return "파랑"; 
        // 보라 (255~330)
        if (h >= 255 && h < 330) return "보라"; 
        // 빨강 (0~30, 330~360)
        if ((h >= 330 || h < 20)) return "빨강"; 
    }

    if (v <= 0.80) { 
      if ((h >= 15 && h < 45) || (h >= 330 || h < 15)) return "브라운"; 
    }

    return "흰색"; 
  }

  // ================================
  // ② 주황·노랑 계열 (새로운 H 범위 적용)
  // ================================
  
  // ⭐ 주황 (30~45)
  if (h >= 30 && h < 45) {
    if (s >= 0.75 && v >= 0.6) return "주황"; 
    return "주황";
  }
  
  // ⭐ 노랑 (45~70)
  if (h >= 45 && h < 70 && v > 0.45 && s > 0.15) { 
    return "노랑";
  }

  // ================================
  // ③ 빨강·분홍·노을 영역 (새로운 H 범위 적용)
  // ================================
  // ⭐ 빨강 (0~30, 330~360)
  if ((h >= 330 && h <= 360) || (h >= 0 && h < 30)) 
    return "빨강";

  // 진한 빨강 유지 (H < 30 기준)
  if ((h >= 350 || h < 30) && s >= 0.5 && v > 0.2) return "빨강"; 
  if ((h >= 350 || h < 30) && s >= 0.45 && v > 0.25) return "빨강"; 

  // ================================
  // ④ 일반 색상 및 잔여 색상 처리 (새로운 H 범위 적용)
  // ================================
  // ⭐ 보라 (255~330)
  if (h >= 255 && h < 330) return "보라"; 

  // ⭐ 초록 (70~160)
  if (h >= 70 && h < 160) return "초록";
  
  // ⭐ 파랑 (160~255)
  if (h >= 160 && h < 255) return "파랑"; 

  // ➡️ 잔여 픽셀 처리
  if (s < 0.45 && v < 0.6) { 
    return "회색"; 
  }
  
  return "기타";
}

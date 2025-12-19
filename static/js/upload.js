const fac = new FastAverageColor();

/* 🎨 색상 팔레트 */
const paletteColors = [
  { id: 1, name: "레드", emoji: "❤️", hex: "#FF4B5C" },
  { id: 2, name: "오렌지", emoji: "🧡", hex: "#FF8C42" },
  { id: 3, name: "옐로우", emoji: "💛", hex: "#FFD93D" },
  { id: 4, name: "그린", emoji: "💚", hex: "#4CAF50" },
  { id: 5, name: "블루", emoji: "💙", hex: "#4A90E2" },
  { id: 6, name: "퍼플", emoji: "💜", hex: "#A66DD4" },
  { id: 7, name: "브라운", emoji: "🤎", hex: "#8B5E3C" },
  { id: 8, name: "블랙", emoji: "🖤", hex: "#222" },
  { id: 9, name: "화이트", emoji: "🤍", hex: "#FFFFFF" },
];

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-input");
  const preview = document.getElementById("preview");
  const uploadArea = document.querySelector(".upload-area");

  const gpsBtn = document.getElementById("gps-btn");
  const submitBtn = document.getElementById("submit-btn");

  const latInput = document.getElementById("gps_lat");
  const lonInput = document.getElementById("gps_lon");

  const colorIdInput = document.getElementById("color_id");
  const sample = document.getElementById("color-sample");
  const colorName = document.getElementById("color-name");
  const colorHex = document.getElementById("color-hex");

  /* ===== 초기 상태 ===== */
  submitBtn.disabled = true;
  fileInput.disabled = true;

  /* ===== 🎨 선택된 색상 표시 ===== */
  const colorId =
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
  }

  /* =================================================
     📍 GPS 버튼 클릭 (아이폰 핵심)
  ================================================= */
  gpsBtn.addEventListener("click", () => {
    if (!("geolocation" in navigator)) {
      alert("이 브라우저는 위치를 지원하지 않습니다.");
      return;
    }

    gpsBtn.disabled = true;
    gpsBtn.textContent = "📡 위치 확인 중...";

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        latInput.value = pos.coords.latitude;
        lonInput.value = pos.coords.longitude;

        alert("📍 위치 확인 완료!");
        console.log("GPS OK:", latInput.value, lonInput.value);

        fileInput.disabled = false;
        submitBtn.disabled = false;

        gpsBtn.textContent = "📍 위치 확인 완료";
      },
      (err) => {
        alert("📍 위치 권한을 허용해야 업로드할 수 있어요.");
        console.error("GPS 실패:", err);

        gpsBtn.disabled = false;
        gpsBtn.textContent = "📍 위치 확인";
        submitBtn.disabled = true;
        fileInput.disabled = true;
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });

  /* =================================================
     📸 사진 선택 → 미리보기 + 색상 검사
  ================================================= */
  fileInput.addEventListener("click", () => {
    fileInput.value = ""; // 같은 사진 재선택 가능
  });

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.src = ev.target.result;
      preview.style.display = "block";
      uploadArea.style.display = "none";

      /* 🎨 색상 분석 */
      try {
        const img = new Image();
        img.src = ev.target.result;
        img.onload = async () => {
          const { value } = await fac.getColorAsync(img);
          const { h, s, v } = rgbToHsv(...value);
          const detected = getColorCategory(h, s, v);

          const selectedColor = paletteColors.find(
            (c) => c.id === parseInt(colorIdInput.value)
          );

          if (selectedColor && detected !== "기타") {
            if (detected !== selectedColor.name) {
              alert(
                `❌ 사진의 대표 색상은 ${detected}입니다.\n선택한 색상과 일치하지 않아요.`
              );
              fileInput.value = "";
              preview.style.display = "none";
              uploadArea.style.display = "block";
            }
          }
        };
      } catch (err) {
        console.warn("색상 분석 실패:", err);
      }
    };

    reader.readAsDataURL(file);
  });
});

/* ===== RGB → HSV ===== */
function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return { h, s, v };
}

/* ===== HSV → 색상 분류 ===== */
function getColorCategory(h, s, v) {
  if (v < 0.15) return "검정";
  if (v > 0.9 && s < 0.15) return "흰색";

  if (h >= 345 || h < 15) return "레드";
  if (h >= 15 && h < 45) return "오렌지";
  if (h >= 45 && h < 70) return "옐로우";
  if (h >= 70 && h < 170) return "그린";
  if (h >= 170 && h < 260) return "블루";
  if (h >= 260 && h < 320) return "퍼플";

  if (h >= 10 && h < 45 && s > 0.4 && v < 0.7) return "브라운";
  return "기타";
}

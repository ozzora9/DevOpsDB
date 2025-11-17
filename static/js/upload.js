const fac = new FastAverageColor();

// ===============================
// 📍 위치 자동 가져오기
// ===============================
navigator.geolocation.getCurrentPosition(
  (pos) => {
    document.getElementById("gps_latitude").value = pos.coords.latitude.toFixed(6);
    document.getElementById("gps_longitude").value = pos.coords.longitude.toFixed(6);
  },
  (err) => console.warn("⚠️ 위치 가져오기 실패:", err)
);

// ===============================
// 🎨 팔레트 색상 (upload에서 선택 표시용)
// ===============================
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

// ===============================
// 📄 색상 자동 표시 (메인에서 넘어온 color_id 유지)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const colorIdInput = document.getElementById("color_id");
  const sample = document.getElementById("color-sample");
  const colorName = document.getElementById("color-name");
  const colorHex = document.getElementById("color-hex");

  let colorId =
    colorIdInput.value ||
    new URLSearchParams(window.location.search).get("color_id");

  const color = paletteColors.find((c) => c.id === parseInt(colorId));

  if (color) {
    sample.style.background = color.hex;
    colorName.textContent = `${color.emoji} ${color.name}`;
    colorHex.textContent = color.hex;
    colorIdInput.value = color.id;
  }

  // ===============================
  // 📷 카메라 + 셔터 버튼
  // ===============================
  const cameraView = document.getElementById("camera-view");
  const shutterBtn = document.querySelector(".shutter-btn");

  let fileInput = document.getElementById("file-input");
  if (!fileInput) {
    fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.name = "image";
    fileInput.id = "file-input";
    fileInput.accept = "image/*";
    fileInput.hidden = true;
    document.getElementById("upload-form").appendChild(fileInput);
  }

  shutterBtn.addEventListener("click", async () => {
    if (!streamVideo) return alert("카메라가 준비되지 않았습니다.");

    const video = cameraView;
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, w, h);

    // blob 생성 → fileInput에 넣기
    canvas.toBlob(async (blob) => {
      if (!blob) return alert("캡쳐 실패!");

      const file = new File([blob], `capture-${Date.now()}.png`, {
        type: "image/png",
      });
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;

      // 미리보기 표시
      const previewEl = document.getElementById("preview");
      previewEl.src = URL.createObjectURL(blob);
      previewEl.style.display = "block";

      // 🔥 색상 포함 검사 실행
      await validateColor(canvas, w, h, colorIdInput.value, fileInput, previewEl);
    });
  });
});

// ===============================
// ⭐ 색상 포함 여부 판단 (스레시홀드 방식)
// ===============================
async function validateColor(canvas, w, h, selectedColorId, fileInput, previewEl) {
  const selectedColor = paletteColors.find((c) => c.id == selectedColorId);
  if (!selectedColor) return alert("🎨 색상이 선택되지 않았습니다.");

  const targetKey = selectedColor.key;

  // 한국어 → 영어 key 변환
  const map = {
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

  let included = 0;
  const sampleCount = 50;
  const ctx = canvas.getContext("2d");

  for (let i = 0; i < sampleCount; i++) {
    const x = Math.floor(Math.random() * w);
    const y = Math.floor(Math.random() * h);
    const pixel = ctx.getImageData(x, y, 1, 1).data;

    const { h: hh, s: ss, v: vv } = rgbToHsv(pixel[0], pixel[1], pixel[2]);
    const cat = getColorCategory(hh, ss, vv);

    if (map[cat] === targetKey) {
      included++;
    }
  }

  // ★ threshold: 2픽셀 이하 → 업로드 거부
  if (included < 2) {
    alert(`❌ 이 사진에는 ${selectedColor.name} 색상이 충분히 포함되지 않았어요.`);
    fileInput.value = "";
    previewEl.style.display = "none";
    return false;
  }

  console.log(`🎉 '${selectedColor.name}'가 ${included}개의 픽셀에서 감지됨 → 업로드 허용`);
  return true;
}

// ===============================
// HSV & 색 분류
// ===============================
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;

  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function getColorCategory(h, s, v) {
  if (v < 0.15) return "검정";
  if (v > 0.9 && s < 0.15) return "흰색";

  if (s < 0.25) {
    if (h >= 70 && h < 170) return "초록";
    if (h >= 45 && h < 70) return "노랑";
    if (h >= 170 && h < 260) return "파랑";
    if (h >= 345 || h < 15) return "빨강";
    if (h >= 15 && h < 45) return "오렌지";
    if (h >= 260 && h < 320) return "보라";
  }

  if (h >= 10 && h < 45 && s > 0.4 && v < 0.7) return "브라운";

  if (h >= 345 || h < 15) return "빨강";
  if (h >= 15 && h < 45) return "오렌지";
  if (h >= 45 && h < 70) return "노랑";
  if (h >= 70 && h < 170) return "초록";
  if (h >= 170 && h < 260) return "파랑";
  if (h >= 260 && h < 320) return "보라";

  return "기타";
}

// ===============================
// 📷 카메라 활성화
// ===============================
let streamVideo;
navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
  streamVideo = stream;
  document.getElementById("camera-view").srcObject = stream;
});

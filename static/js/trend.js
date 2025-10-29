const photos = window.photosData || [];
const myPhotos = window.myPhotosData || [];

// 색상 매핑
const colorKeyMap = {
  1: "red", 2: "orange", 3: "yellow", 4: "green", 5: "blue",
  6: "purple", 7: "brown", 8: "black", 9: "white",
};

const colorHex = {
  red: "#FF4B5C", orange: "#FF8C42", yellow: "#FFD93D",
  green: "#4CAF50", blue: "#4A90E2", purple: "#A66DD4",
  brown: "#8B5E3C", black: "#222222", white: "#FFFFFF"
};

// 📍 마커 아이콘 생성
function getMarkerIcon(colorKey) {
  const fill = colorHex[colorKey] || "#888888";
  const stroke = colorKey === "white" ? "#888" : "#FFF";
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 24 24">
      <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8z"
            fill="${fill}" stroke="${stroke}" stroke-width="1.2"/>
      <circle cx="12" cy="10" r="2.4" fill="#ffffff" opacity="0.9"/>
    </svg>`;
  const url = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  return L.icon({
    iconUrl: url,
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36]
  });
}

// 지도 초기화 (DOMContentLoaded 이후 실행해야 함)
document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("map", { zoomControl: true }).setView([36.3, 127.8], 7);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  let markers = [];

  function showMarkers(data) {
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    data.forEach(p => {
      const lat = p.lat ?? 37.5665;
      const lon = p.lon ?? 126.9780;
      const colorKey = colorKeyMap[p.color_id] || "gray";

      const marker = L.marker([lat, lon], {
        icon: getMarkerIcon(colorKey)
      }).addTo(map);

      marker.bindPopup(`
        <div style="text-align:center">
          <img src="${p.image_path}" width="120" style="border-radius:8px; margin-bottom:6px"><br>
          <b>${colorKey}</b> 계열<br>
          <small>📸 ${p.username || '익명 사용자'}</small>
        </div>
      `);

      markers.push(marker);
    });

    map.setView([36.3, 127.8], 8);
  }

  // 전체 사진 기본 표시
  showMarkers(photos);

  // 버튼 이벤트
  const btnAll = document.getElementById("showAll");
  const btnMine = document.getElementById("showMine");

  btnAll.addEventListener("click", () => {
    btnAll.classList.add("active");
    btnMine.classList.remove("active");
    showMarkers(photos);
  });

  btnMine.addEventListener("click", () => {
    btnMine.classList.add("active");
    btnAll.classList.remove("active");

    if (myPhotos.length > 0) {
      showMarkers(myPhotos);
    } else {
      markers.forEach(m => map.removeLayer(m));
      alert("⚠️ 내 사진이 없습니다. (로그인하지 않았거나 업로드 기록이 없습니다.)");
    }
  });

  // 지도 리사이즈 버그 방지 (로드 후 재계산)
  setTimeout(() => map.invalidateSize(), 300);
});
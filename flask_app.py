from flask import Flask, render_template, request, redirect, url_for, jsonify, session
import os
from werkzeug.utils import secure_filename
from db_config import get_connection, init_db
import hashlib
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import time
from math import radians, sin, cos, sqrt, atan2
from datetime import datetime

# ✅ 거리 계산 (하버사인 공식)
def calc_distance(lat1, lon1, lat2, lon2):
    R = 6371  # km 단위
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

# ✅ 산책 세션 그룹핑 (시간 기준)
def group_by_time(photo_data, gap_min=30):
    sessions = []
    current = [photo_data[0]]

    for i in range(1, len(photo_data)):
        t1 = datetime.strptime(photo_data[i-1][0], "%Y:%m:%d %H:%M:%S")
        t2 = datetime.strptime(photo_data[i][0], "%Y:%m:%d %H:%M:%S")
        diff = (t2 - t1).total_seconds() / 60

        if diff <= gap_min:
            current.append(photo_data[i])
        else:
            sessions.append(current)
            current = [photo_data[i]]

    sessions.append(current)
    return sessions

# ✅ 사용자별 세션 점수 계산
def calc_user_score(email, photo_data):
    sessions = group_by_time(photo_data)
    total_score = 0
    total_dist = 0
    total_photos = 0

    for session in sessions:
        session_dist = 0
        for i in range(1, len(session)):
            _, lat1, lon1 = session[i-1]
            _, lat2, lon2 = session[i]
            session_dist += calc_distance(lat1, lon1, lat2, lon2)
        photo_count = len(session)
        score = photo_count * 10 + session_dist * 5

        total_score += score
        total_dist += session_dist
        total_photos += photo_count
        print(f"[DEBUG] {email} 세션 거리: {round(session_dist, 3)} km, 사진 수: {photo_count}")

    return total_photos, total_dist, total_score

# ✅ 전체 사용자 랭킹 계산
def calculate_ranking():
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT U.EMAIL, TO_CHAR(P.CREATED_AT), P.GPS_LATITUDE, P.GPS_LONGITUDE
        FROM PHOTOS P
        JOIN USERS U ON P.USER_ID = U.USER_ID
        WHERE P.GPS_LATITUDE IS NOT NULL AND P.GPS_LONGITUDE IS NOT NULL
        ORDER BY U.EMAIL, P.CREATED_AT
    """)
    rows = cur.fetchall()
    conn.close()

    # 사용자별 데이터 분류
    users = {}
    for email, created_at, lat, lon in rows:
        users.setdefault(email, []).append((created_at, lat, lon))

    # 각 유저 점수 계산
    results = []
    for email, photo_data in users.items():
        total_photos, total_dist, total_score = calc_user_score(email, photo_data)
        results.append((email, total_photos, round(total_dist, 2), round(total_score, 1)))

    # 점수순 정렬
    results.sort(key=lambda x: x[3], reverse=True)
    return results


# =========================================
# Flask 기본 설정
# =========================================
app = Flask(__name__)
app.secret_key = 'colorwalk-secret'
app.config['UPLOAD_FOLDER'] = 'static/uploads'

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
init_db()  # 처음 실행 시 테이블 생성


# =========================================
# 유틸: DB 연결 테스트
# =========================================
@app.route("/testdb")
def test_db():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT '연결 성공!' FROM dual")
        result = cur.fetchone()
        conn.close()
        return f"✅ Oracle 연결 확인: {result[0]}"
    except Exception as e:
        return f"❌ 연결 실패: {str(e)}"


# =========================================
# 회원가입
# =========================================
@app.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        name = request.form["name"]
        email = request.form["email"]
        password = hashlib.sha256(request.form["password"].encode()).hexdigest()

        conn = get_connection()
        cur = conn.cursor()

        # 이메일 중복 검사
        cur.execute("SELECT 1 FROM USERS WHERE email = :email", {"email": email})
        if cur.fetchone():
            conn.close()
            return "<h3>⚠️ 이미 존재하는 이메일입니다.</h3>"

        # 새 사용자 등록
        cur.execute("""
            INSERT INTO USERS (name, email, password)
            VALUES (:name, :email, :password)
        """, {"name": name, "email": email, "password": password})
        conn.commit()
        conn.close()
        return redirect(url_for("login"))

    return render_template("register.html")


# =========================================
# 로그인 / 로그아웃
# =========================================
@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = hashlib.sha256(request.form["password"].encode()).hexdigest()

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT user_id, name
            FROM USERS
            WHERE email = :email AND password = :password
        """, {"email": email, "password": password})
        user = cur.fetchone()
        conn.close()

        if user:
            session["user_id"] = int(user[0])
            session["user_name"] = user[1]
            session["user_email"] = email
            return redirect(url_for("main"))
        else:
            return "<h3>❌ 이메일 또는 비밀번호가 올바르지 않습니다.</h3>"

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("main"))


# =========================================
# 메인 & 컬러 API
# =========================================
@app.route('/')
def main():
    return render_template('main.html')


@app.route('/api/color')
def api_color():
    import random
    colors = [
        {"id": 1, "key": "red", "name": "레드", "emoji": "❤️", "hex": "#FF4B5C"},
        {"id": 2, "key": "orange", "name": "오렌지", "emoji": "🧡", "hex": "#FF8C42"},
        {"id": 3, "key": "yellow", "name": "옐로우", "emoji": "💛", "hex": "#FFD93D"},
        {"id": 4, "key": "green", "name": "그린", "emoji": "💚", "hex": "#4CAF50"},
        {"id": 5, "key": "blue", "name": "블루", "emoji": "💙", "hex": "#4A90E2"},
        {"id": 6, "key": "purple", "name": "퍼플", "emoji": "💜", "hex": "#A66DD4"},
        {"id": 7, "key": "brown", "name": "브라운", "emoji": "🤎", "hex": "#8B5E3C"},
        {"id": 8, "key": "black", "name": "블랙", "emoji": "🖤", "hex": "#222"},
        {"id": 9, "key": "white", "name": "화이트", "emoji": "🤍", "hex": "#FFFFFF"},
    ]
    color = random.choice(colors)
    session['today_color'] = color
    return jsonify(color)


@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'GET':
        color_id = request.args.get('color_id')
        return render_template('upload.html', color_id=color_id)

    print("📩 request.content_type:", request.content_type)
    print("📦 request.files:", request.files)
    print("📦 request.form:", request.form)


    user_id = session.get("user_id")
    if not user_id:
        return "<h3>⚠️ 로그인 후 이용해주세요.</h3>"

    desc = request.form.get('description')
    loc = request.form.get('location')
    color_id = int(request.form.get('color_id') or 1)
    file = request.files.get('image')

    # 📍 JS에서 위치 직접 전송한 경우 처리
    gps_lat = request.form.get('lat')
    gps_lon = request.form.get('lon')

    print(file)

    if not file:
        return jsonify({"error": "이미지는 반드시 선택해야 합니다."}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)
    db_path = f"uploads/{filename}"

    # ✅ EXIF 정보가 존재할 경우 보조적으로 읽기
    try:
        img = Image.open(save_path)
        exif_data = img._getexif()
        if exif_data:
            gps_info = {}
            for tag_id, value in exif_data.items():
                tag = TAGS.get(tag_id, tag_id)
                if tag == "DateTimeOriginal":
                    created_at = value
                elif tag == "GPSInfo":
                    for t in value:
                        sub_tag = GPSTAGS.get(t, t)
                        gps_info[sub_tag] = value[t]

            # 📍 만약 JS로 좌표가 안 왔을 때만 EXIF로 보충
            if (not gps_lat or not gps_lon) and gps_info:
                gps_lat = convert_to_decimal(gps_info.get("GPSLatitude"))
                gps_lon = convert_to_decimal(gps_info.get("GPSLongitude"))
                if gps_info.get("GPSLatitudeRef") == "S":
                    gps_lat = -gps_lat
                if gps_info.get("GPSLongitudeRef") == "W":
                    gps_lon = -gps_lon

    except Exception as e:
        print("⚠️ EXIF 파싱 실패:", e)

    # ✅ float 변환 시도
    try:
        gps_lat = round(float(gps_lat), 6) if gps_lat else None
        gps_lon = round(float(gps_lon), 6) if gps_lon else None
    except ValueError:
        gps_lat, gps_lon = None, None

    # ✅ DB 저장
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
    INSERT INTO PHOTOS (
        user_id, color_id, description, location, image_path,
        gps_latitude, gps_longitude, likes_count, created_at
    )
    VALUES (
        :user_id, :color_id, :description, :location, :image_path,
        :gps_latitude, :gps_longitude, 0, SYSTIMESTAMP
    )
""", {
    "user_id": int(user_id),
    "color_id": int(color_id),
    "description": desc,
    "location": loc,
    "image_path": db_path,
    "gps_latitude": gps_lat,
    "gps_longitude": gps_lon
})
    conn.commit()
    conn.close()

    return redirect(url_for("gallery", color_id=color_id, t=int(time.time())))


# =========================================
# 갤러리
# =========================================
@app.route("/gallery")
@app.route("/gallery/<color_key>")
def gallery(color_key=None):
    conn = get_connection()
    cur = conn.cursor()

    # ✅ 전체 사진 개수
    cur.execute("SELECT COUNT(*) FROM photos")
    all_photo = cur.fetchone()[0]

    # ✅ 현재 로그인한 유저의 업로드 사진 개수
    user_id = session.get("user_id")
    cur.execute("SELECT COUNT(*) FROM photos WHERE user_id = :1", [user_id])
    upload_photo = cur.fetchone()[0]

    # ✅ color_key가 없거나 "all"이면 전체 보기
    if not color_key or color_key.lower() == "all":
        cur.execute("""
            SELECT p.photo_id, u.name, c.color_name, p.description, p.location,
                p.image_path, NVL(p.likes_count, 0), p.created_at, c.color_key
            FROM PHOTOS p
            JOIN USERS u ON p.user_id = u.user_id
            JOIN COLOR_CATEGORIES c ON p.color_id = c.color_id
            ORDER BY p.created_at DESC
        """)
    else:
        # ✅ color_key로 필터링
        cur.execute("""
            SELECT p.photo_id, u.name, c.color_name, p.description, p.location,
                p.image_path, NVL(p.likes_count, 0), p.created_at, c.color_key
            FROM PHOTOS p
            JOIN USERS u ON p.user_id = u.user_id
            JOIN COLOR_CATEGORIES c ON p.color_id = c.color_id
            WHERE LOWER(c.color_key) = LOWER(:1)
            ORDER BY p.created_at DESC
        """, [color_key])

    photos = cur.fetchall()
    conn.close()

    # ✅ 이미지 경로 보정
    photos_fixed = []
    for p in photos:
        image_path = p[5]
        if not image_path.startswith("static/"):
            image_path = os.path.join("static", image_path).replace("\\", "/")
        image_url = url_for("static", filename=image_path.replace("static/", ""))
        new_p = list(p)
        new_p[5] = image_url
        photos_fixed.append(tuple(new_p))

    return render_template(
        "gallery.html",
        all_photo=all_photo,
        upload_photo=upload_photo,
        photos=photos_fixed,
        color_key=color_key
    )



# =========================================
# 사진 상세 보기 API (팝업용)
# =========================================
@app.route('/photo/<int:photo_id>')
def photo_detail(photo_id):
    user_id = session.get("user_id")
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT p.photo_id, u.name, p.description, p.location, p.image_path,
        p.created_at, p.likes_count, p.created_at
        FROM PHOTOS p
        JOIN USERS u ON p.user_id = u.user_id
        WHERE p.photo_id = :photo_id
    """, {"photo_id": photo_id})
    photo = cur.fetchone()

    cur.execute("SELECT COUNT(*) FROM likes WHERE photo_id = :photo_id", {"photo_id": photo_id})
    likes_count = cur.fetchone()[0]

    cur.execute("SELECT 1 FROM likes WHERE photo_id = :photo_id AND user_id = :user_id",
                {"photo_id": photo_id, "user_id": user_id})
    liked = bool(cur.fetchone())

    cur.execute("""
        SELECT c.content, u.name
        FROM comments c
        JOIN users u ON c.user_id = u.user_id
        WHERE c.photo_id = :photo_id ORDER BY c.created_at ASC
    """, {"photo_id": photo_id})
    comments = [{"username": r[1], "content": r[0]} for r in cur.fetchall()]

    conn.close()
    return jsonify({
        "photo_id": photo[0],
        "username": photo[1],
        "description": photo[2],
        "location": photo[3],
        "image_path": photo[4],
        "created_at": photo[5],
        "likes_count": likes_count,
        "liked": liked,
        "comments": comments
    })


# =========================================
# 좋아요 토글
# =========================================
@app.route("/like/<int:photo_id>", methods=["POST"])
def toggle_like(photo_id):
    if "user_id" not in session:
        return jsonify({"error": "로그인 필요"}), 401

    user_id = session["user_id"]
    conn = get_connection()
    cur = conn.cursor()

    # 이미 좋아요했는지 확인
    cur.execute("""
        SELECT like_id FROM likes 
        WHERE photo_id = :photo_id AND user_id = :user_id
    """, {"photo_id": photo_id, "user_id": user_id})
    existing = cur.fetchone()

    if existing:
        # ✅ 좋아요 취소
        cur.execute("DELETE FROM likes WHERE like_id = :id", {"id": existing[0]})
        action = "unliked"
    else:
        # ✅ 좋아요 추가
        cur.execute("""
            INSERT INTO likes (photo_id, user_id, created_at)
            VALUES (:photo_id, :user_id, SYSTIMESTAMP)
        """, {"photo_id": photo_id, "user_id": user_id})
        action = "liked"

    # ✅ 변경 후 현재 좋아요 수 다시 계산
    cur.execute("SELECT COUNT(*) FROM likes WHERE photo_id = :photo_id", {"photo_id": photo_id})
    like_count = cur.fetchone()[0]

    # ✅ photos 테이블의 likes_count 컬럼 갱신
    cur.execute("""
        UPDATE photos
        SET likes_count = :count
        WHERE photo_id = :photo_id
    """, {"count": like_count, "photo_id": photo_id})

    conn.commit()
    conn.close()

    return jsonify({"status": action, "like_count": like_count})


# =========================================
# 댓글 등록
# =========================================
@app.route('/comment/<int:photo_id>', methods=['POST'])
def add_comment(photo_id):
    user_id = session.get("user_id")
    content = request.json.get("content", "")
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO comments (photo_id, user_id, content, created_at)
        VALUES (:photo_id, :user_id, :content, SYSTIMESTAMP)
    """, {"photo_id": photo_id, "user_id": user_id, "content": content})
    conn.commit()

    cur.execute("""
        SELECT c.content, u.name
        FROM comments c
        JOIN users u ON c.user_id = u.user_id
        WHERE c.photo_id = :photo_id ORDER BY c.created_at ASC
    """, {"photo_id": photo_id})
    comments = [{"username": r[1], "content": r[0]} for r in cur.fetchall()]
    conn.close()
    return jsonify({"comments": comments})



# =========================================
# 트렌드 페이지 (전체 + 내 사진 보기)
# =========================================
@app.route("/trend")
def trend():
    conn = get_connection()
    cur = conn.cursor()

    # ✅ 전체 사진 + 업로더 이름 함께 조회
    cur.execute("""
        SELECT p.photo_id, p.image_path, p.color_id,
               NVL(p.gps_latitude, 37.5665),
               NVL(p.gps_longitude, 126.9780),
               u.name
        FROM photos p
        JOIN users u ON p.user_id = u.user_id
    """)
    photos = [
        {
            "photo_id": p[0],
            "image_path": url_for("static", filename=p[1].replace("static/", "")),
            "color_id": p[2],
            "lat": float(p[3]),
            "lon": float(p[4]),
            "username": p[5],  # ✅ 사용자 이름 추가
        }
        for p in cur.fetchall()
    ]

    # ✅ 로그인한 사용자 사진만 따로
    my_photos = []
    user_id = session.get("user_id")
    if user_id:
        cur.execute("""
            SELECT p.photo_id, p.image_path, p.color_id,
                   NVL(p.gps_latitude, 37.5665),
                   NVL(p.gps_longitude, 126.9780),
                   u.name
            FROM photos p
            JOIN users u ON p.user_id = u.user_id
            WHERE p.user_id = :user_id
        """, {"user_id": user_id})
        my_photos = [
            {
                "photo_id": p[0],
                "image_path": url_for("static", filename=p[1].replace("static/", "")),
                "color_id": p[2],
                "lat": float(p[3]),
                "lon": float(p[4]),
                "username": p[5],
            }
            for p in cur.fetchall()
        ]

    conn.close()
    return render_template("trend.html", photos=photos, my_photos=my_photos)

@app.route('/test')
def test():
    return render_template('test.html')

@app.route('/ranking')
def ranking():
    ranks = calculate_ranking()
    print("📊 랭킹 계산 결과:", ranks)
    return render_template('ranking.html', ranks=ranks)

@app.route("/mypage")
def mypage():
    # ✅ 로그인 여부 확인
    if "user_email" not in session:
        return redirect(url_for("login"))

    user_name = session.get("user_name")
    user_id = session.get("user_id")

    conn = get_connection()
    cursor = conn.cursor()

    # ✅ 내가 업로드한 사진
    cursor.execute("""
        SELECT photo_id, description, color_id, image_path, location, likes_count
        FROM photos
        WHERE user_id = :user_id
        ORDER BY photo_id DESC
    """, {"user_id": user_id})
    my_photos = cursor.fetchall()

    # ✅ 내가 좋아요한 사진
    cursor.execute("""
        SELECT p.photo_id, p.description, p.color_id, p.image_path, p.location, p.likes_count
        FROM photos p
        JOIN likes l ON p.photo_id = l.photo_id
        WHERE l.user_id = :user_id
        ORDER BY l.created_at DESC
    """, {"user_id": user_id})
    liked_photos = cursor.fetchall()

    conn.close()

    # ✅ 이미지 경로 보정 함수
    def fix_image_path(photo_rows):
        fixed = []
        for p in photo_rows:
            image_path = p[3]
            if not image_path.startswith("static/"):
                image_path = os.path.join("static", image_path).replace("\\", "/")
            image_url = url_for("static", filename=image_path.replace("static/", ""))
            new_p = list(p)
            new_p[3] = image_url
            fixed.append(tuple(new_p))
        return fixed

    # ✅ 경로 보정
    my_photos_fixed = fix_image_path(my_photos)
    liked_photos_fixed = fix_image_path(liked_photos)

    # ✅ 렌더링
    return render_template(
        "mypage.html",
        user_name=user_name,
        my_photos=my_photos_fixed,
        liked_photos=liked_photos_fixed
    )



# =========================================
# 실행
# =========================================
if __name__ == '__main__':
    app.run(debug=True)
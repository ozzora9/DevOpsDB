from flask import Flask, render_template, request, redirect, url_for, jsonify, session
import os
from werkzeug.utils import secure_filename
from db_config import get_connection, init_db
import hashlib
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import time

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



# =========================================
# EXIF GPS → 소수점 변환 유틸
# =========================================
def convert_to_decimal(gps_data):
    """EXIF GPS 데이터를 (도, 분, 초) → 소수점 형식으로 변환"""
    if not gps_data or len(gps_data) != 3:
        return None
    try:
        deg = gps_data[0][0] / gps_data[0][1]
        minutes = gps_data[1][0] / gps_data[1][1]
        seconds = gps_data[2][0] / gps_data[2][1]
        return round(deg + (minutes / 60.0) + (seconds / 3600.0), 6)
    except Exception:
        return None


# =========================================
# 업로드
# =========================================
@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'GET':
        color_id = request.args.get('color_id')
        return render_template('upload.html', color_id=color_id)

    # 로그인 확인
    user_id = session.get("user_id")
    if not user_id:
        return "<h3>⚠️ 로그인 후 이용해주세요.</h3>"

    desc = request.form.get('description')
    loc = request.form.get('location')
    color_id = int(request.form.get('color_id') or 1)
    file = request.files.get('image')

    if not file:
        return "<h3>⚠️ 이미지는 반드시 선택해야 합니다.</h3>"

    # 이미지 저장 (상대 경로)
    filename = secure_filename(file.filename)
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)

    # DB에는 'uploads/파일명'만 저장 (static 제외)
    db_path = f"uploads/{filename}"

    # EXIF 메타데이터 추출
    gps_lat, gps_lon, shot_time = None, None, None
    try:
        img = Image.open(save_path)
        exif_data = img._getexif()
        if exif_data:
            for tag_id, value in exif_data.items():
                tag = TAGS.get(tag_id, tag_id)
                if tag == 'DateTimeOriginal':
                    shot_time = value
                elif tag == 'GPSInfo':
                    gps_info = {}
                    for t in value:
                        sub_tag = GPSTAGS.get(t, t)
                        gps_info[sub_tag] = value[t]
                    gps_lat = convert_to_decimal(gps_info.get('GPSLatitude'))
                    gps_lon = convert_to_decimal(gps_info.get('GPSLongitude'))
    except Exception:
        pass  # 메타데이터 없거나 파싱 실패해도 업로드는 진행

    # DB 저장
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO PHOTOS (
            user_id, color_id, description, location, image_path,
            gps_latitude, gps_longitude, shot_time, likes_count, created_at
        ) VALUES (
            :user_id, :color_id, :description, :location, :image_path,
            :gps_latitude, :gps_longitude, :shot_time, 0, SYSTIMESTAMP
        )
    """, {
        "user_id": int(user_id),
        "color_id": int(color_id),
        "description": desc,
        "location": loc,
        "image_path": db_path,
        "gps_latitude": gps_lat,
        "gps_longitude": gps_lon,
        "shot_time": shot_time
    })
    conn.commit()
    conn.close()

    # 업로드 후 해당 색상 카테고리로 이동 (경로 변수 방식)
    return redirect(url_for("gallery", color_id=color_id, t=int(time.time())))


# =========================================
# (옵션) 메타데이터 단독 추출 유틸
# =========================================
def extract_metadata(image_path):
    img = Image.open(image_path)
    exif_data = img._getexif()
    meta = {"gps": None, "time": None}
    if exif_data:
        for tag_id, value in exif_data.items():
            tag = TAGS.get(tag_id, tag_id)
            if tag == 'DateTimeOriginal':
                meta["time"] = value
            elif tag == 'GPSInfo':
                gps_info = {}
                for t in value:
                    sub_tag = GPSTAGS.get(t, t)
                    gps_info[sub_tag] = value[t]
                meta["gps"] = gps_info
    return meta


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
    user_id = session['user_id']
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
# 좋아요
# =========================================
@app.route('/like/<int:photo_id>')
def like(photo_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE PHOTOS
        SET likes_count = NVL(likes_count, 0) + 1
        WHERE photo_id = :photo_id
    """, {"photo_id": photo_id})
    conn.commit()
    conn.close()
    return redirect(request.referrer or url_for('main'))


# =========================================
# 기타 페이지
# =========================================
@app.route('/trend')
def trend():
    return render_template('trend.html')


import os
from flask import url_for

@app.route("/mypage")
def mypage():
    # 로그인 안 되어 있으면 로그인 페이지로 이동
    if "user_email" not in session:
        return redirect(url_for("login"))

    user_name = session.get("user_name")
    user_id = session.get("user_id")

    conn = get_connection()
    cursor = conn.cursor()

    # ✅ 현재 로그인한 사용자의 사진만 조회
    cursor.execute("""
        SELECT photo_id, description, color_id, image_path, location, likes_count
        FROM photos
        WHERE user_id = :user_id
        ORDER BY photo_id DESC
    """, {"user_id": user_id})

    photos = cursor.fetchall()
    conn.close()

    # ✅ 이미지 경로 보정 (갤러리와 동일 로직)
    photos_fixed = []
    for p in photos:
        image_path = p[3]  # image_path 컬럼
        if not image_path.startswith("static/"):
            image_path = os.path.join("static", image_path).replace("\\", "/")
        image_url = url_for("static", filename=image_path.replace("static/", ""))
        new_p = list(p)
        new_p[3] = image_url  # 보정된 경로로 교체
        photos_fixed.append(tuple(new_p))

    return render_template(
        "mypage.html",
        user_name=user_name,
        my_photos=photos_fixed
    )



# =========================================
# 실행
# =========================================
if __name__ == '__main__':
    app.run(debug=True)
# 🎨 ColorWalk - 색으로 걷는 나의 하루

## 작품 개요
**ColorWalk**는 사용자의 일상 속 색을 기록하고 공유하는 **색상 기반 산책·사진 기록 플랫폼**입니다.  
사용자는 매일 추천받은 ‘오늘의 컬러’를 중심으로 사진을 촬영·업로드하며,  
사진의 EXIF 메타데이터를 통해 **촬영 위치(GPS)** 및 **시간 정보**를 자동으로 추출하여 지도 위에 시각화합니다.  

업로드된 사진의 평균 색상(HSV)을 기반으로 주요 컬러 카테고리에 매핑되며,  
산책 거리·활동량을 바탕으로 **활동 점수와 랭킹 시스템**에 반영됩니다.  
또한 다른 사용자의 사진에 좋아요·댓글을 남길 수 있는 **색감 중심 커뮤니티**를 제공합니다.

---

## 개발 환경

| 항목 | 내용 |
|------|------|
| **Framework** | Flask (Python 3.11) |
| **Frontend** | HTML5, CSS3, JavaScript |
| **Database** | Oracle Database 21c Express Edition (XE) |
| **Library / Package** | cx_Oracle, Pillow, FastAverageColor, ExifRead, Leaflet.js |
| **Version Control** | Git / GitHub |
| **Execution** | Localhost (http://127.0.0.1:5000) |

---

## 주요 기능

### 1. 사진 업로드 및 지도 시각화
- 업로드된 전체 사진의 HSV 평균값으로 색상분석 
- 업로드 시 **EXIF 메타데이터에서 GPS, 촬영 시간 자동 추출**  
- Leaflet.js 기반 지도에 업로드 위치 마커 표시  
- 색상별 필터 기능으로 특정 컬러톤 사진만 보기 가능  

### 2. 커뮤니티 상호작용
- 다른 사용자의 사진 좋아요 / 댓글 작성 기능  
- 마이페이지에서 업로드 내역 및 찜한 사진 관리 가능  

### 3. 랭킹 기능
- 이미지 업로드 시간/ 거리 기반으로 랭킹 반영  

---

## 데이터베이스 구조

| 테이블명 | 컬럼명 | 널 허용 | 자료형 | 설명 | 비고 |
|-----------|----------|----------|----------|----------|----------|
| **USERS** | USER_ID | NOT NULL | NUMBER | 사용자 고유 ID | PK |
|  | NAME | NOT NULL | VARCHAR2(50) | 사용자 이름 |  |
|  | EMAIL | NOT NULL | VARCHAR2(100) | 이메일 (로그인 ID) | UNIQUE |
|  | PASSWORD | NOT NULL | VARCHAR2(200) | 비밀번호 (SHA256 암호화) |  |
|  | CREATED_AT |  | DATE | 가입일 | DEFAULT SYSDATE |

| 테이블명 | 컬럼명 | 널 허용 | 자료형 | 설명 | 비고 |
|-----------|----------|----------|----------|----------|----------|
| **PHOTOS** | PHOTO_ID | NOT NULL | NUMBER | 사진 고유 ID | PK |
|  | USER_ID |  | NUMBER | 업로드한 사용자 ID | FK (USERS.USER_ID) |
|  | COLOR_ID |  | NUMBER | 주요 색상 ID | FK (COLOR_CATEGORIES.COLOR_ID) |
|  | DESCRIPTION |  | VARCHAR2(1000) | 사진 설명 |  |
|  | LOCATION |  | VARCHAR2(300) | 촬영 위치 |  |
|  | IMAGE_PATH | NOT NULL | VARCHAR2(500) | 서버 내 이미지 경로 |  |
|  | GPS_LATITUDE |  | NUMBER | 위도 |  |
|  | GPS_LONGITUDE |  | NUMBER | 경도 |  |
|  | SHOT_TIME |  | VARCHAR2(30) | 촬영 시각 (문자열 저장) |  |
|  | LIKES_COUNT |  | NUMBER | 좋아요 수 | DEFAULT 0 |
|  | CREATED_AT |  | TIMESTAMP(6) | 업로드 시각 | DEFAULT SYSTIMESTAMP |

| 테이블명 | 컬럼명 | 널 허용 | 자료형 | 설명 | 비고 |
|-----------|----------|----------|----------|----------|----------|
| **LIKES** | LIKE_ID | NOT NULL | NUMBER | 좋아요 고유 ID | PK |
|  | PHOTO_ID |  | NUMBER | 좋아요한 사진 | FK (PHOTOS.PHOTO_ID) |
|  | USER_ID |  | NUMBER | 좋아요한 사용자 | FK (USERS.USER_ID) |
|  | CREATED_AT |  | TIMESTAMP(6) | 좋아요 생성 시각 | DEFAULT SYSTIMESTAMP |

| 테이블명 | 컬럼명 | 널 허용 | 자료형 | 설명 | 비고 |
|-----------|----------|----------|----------|----------|----------|
| **COMMENTS** | COMMENT_ID | NOT NULL | NUMBER | 댓글 고유 ID | PK |
|  | PHOTO_ID |  | NUMBER | 댓글 단 사진 | FK (PHOTOS.PHOTO_ID) |
|  | USER_ID |  | NUMBER | 작성자 ID | FK (USERS.USER_ID) |
|  | CONTENT | NOT NULL | VARCHAR2(500) | 댓글 내용 |  |
|  | CREATED_AT |  | TIMESTAMP(6) | 작성 시각 | DEFAULT SYSTIMESTAMP |

| 테이블명 | 컬럼명 | 널 허용 | 자료형 | 설명 | 비고 |
|-----------|----------|----------|----------|----------|----------|
| **COLOR_CATEGORIES** | COLOR_ID | NOT NULL | NUMBER | 색상 고유 ID | PK |
|  | COLOR_KEY | NOT NULL | VARCHAR2(20) | 색상 키 (영문) | 예: red, orange |
|  | COLOR_NAME | NOT NULL | VARCHAR2(30) | 색상 이름 (한글) | 예: 레드 |
|  | HEX_CODE | NOT NULL | VARCHAR2(10) | 색상 HEX 코드 | 예: #FF6B6B |

---

## 실행방법
1️⃣ 가상환경 생성 및 활성화
- python -m venv venv
- ctrl + shift + p venv 인터프리티 선택
- venv\Scripts\activate    # (Windows PowerShell)

2️⃣ 패키지 설치
- pip install -r requirements.txt
- pip install oracledb

3️⃣ Oracle DB 설정 확인

- db_config.py의 아래 부분에서 본인 DB 계정 정보 확인, 수정

- pool = oracledb.create_pool(
    - user="system",
    - password="비밀번호",
    - dsn="localhost:1521/XE",
    - min=2,
    - max=5,
    - increment=1,
    - timeout=60,
- )

4️⃣ Flask 서버 실행
 * python app.py

✅ Oracle 테이블 준비 완료
 * Running on http://127.0.0.1:5000

   
### 🎨 COLOR_CATEGORIES 초기 데이터

> ⚠️ `color_categories` 테이블은 서비스 실행 전 아래의 데이터를 **반드시 삽입해야 합니다.**  
> 이 데이터는 색상 분석 및 사진 색상 매핑 기능에 사용됩니다.

```sql
INSERT INTO color_categories (color_id, color_key, color_name, hex_code) VALUES (1, 'red', '레드', '#FF6B6B');
INSERT INTO color_categories (color_id, color_key, color_name, hex_code) VALUES (2, 'orange', '오렌지', '#FFA94D');
INSERT INTO color_categories (color_id, color_key, color_name, hex_code) VALUES (3, 'yellow', '옐로우', '#FFD43B');
INSERT INTO color_categories (color_id, color_key, color_name, hex_code) VALUES (4, 'green', '그린', '#51C56E');
INSERT INTO color_categories (color_id, color_key, color_name, hex_code) VALUES (5, 'blue', '블루', '#339AF0');
INSERT INTO color_categories (color_id, color_key, color_name, hex_code) VALUES (6, 'purple', '퍼플', '#945EFB');
INSERT INTO color_categories (color_id, color_key, color_name, hex_code) VALUES (7, 'brown', '브라운', '#A17C6B');
INSERT INTO color_categories (color_id, color_key, color_name, hex_code) VALUES (8, 'black', '블랙', '#212529');
INSERT INTO color_categories (color_id, color_key, color_name, hex_code) VALUES (9, 'white', '화이트', '#F8F9FA');
COMMIT;


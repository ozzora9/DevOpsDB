from flask import Flask
from werkzeug.utils import secure_filename
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

print("✅ Flask / Werkzeug / Pillow 모두 정상 인식됨!")
from flask import Flask, render_template, request, send_file
from PIL import Image, ImageEnhance
import os
import io

app = Flask(__name__)

# 確保上傳檔案夾存在
UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/process", methods=["POST"])
def process_image():
    file = request.files["image"]
    pixel_size = int(request.form["pixel_size"])
    hue = float(request.form["hue"])
    saturation = float(request.form["saturation"])

    # 確認上傳檔案是否為合法圖片
    if file and file.filename.endswith((".jpg", ".jpeg", ".png")):
        img = Image.open(file).convert("RGB")

        # 1. 像素化
        img = img.resize(
            (img.width // pixel_size, img.height // pixel_size), Image.NEAREST
        )
        img = img.resize((img.width * pixel_size, img.height * pixel_size), Image.NEAREST)

        # 2. 調整飽和度
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(saturation)

        # 3. 調整色相
        img = img.convert("HSV")
        data = list(img.getdata())
        new_data = [(int((p[0] + hue) % 256), p[1], p[2]) for p in data]
        img.putdata(new_data)
        img = img.convert("RGB")

        # 儲存處理後的圖片
        output_path = os.path.join(UPLOAD_FOLDER, "processed_image.jpg")
        img.save(output_path)

        return send_file(output_path, mimetype="image/jpeg")

    return "請上傳有效的圖片檔案！"

if __name__ == "__main__":
    app.run(debug=True)

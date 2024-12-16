// DOM 元素
const imageInput = document.getElementById("imageInput");
const pixelSizeInput = document.getElementById("pixelSize");
const contrastInput = document.getElementById("contrast");
const saturationInput = document.getElementById("saturation");
const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
let image = null;

// 更新滑桿值顯示
pixelSizeInput.addEventListener("input", updateValues);
contrastInput.addEventListener("input", updateValues);
saturationInput.addEventListener("input", updateValues);

function updateValues() {
    document.getElementById("pixelValue").textContent = pixelSizeInput.value;
    document.getElementById("contrastValue").textContent = `${contrastInput.value}%`;
    document.getElementById("saturationValue").textContent = `${saturationInput.value}%`;
    updateCanvas();
}

// 上傳圖片
imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            image = new Image();
            image.onload = () => {
                canvas.width = 800;
                canvas.height = (800 * image.height) / image.width;
                updateCanvas();
            };
            image.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 更新畫布
function updateCanvas() {
    if (!image) return;

    const pixelSize = parseInt(pixelSizeInput.value);
    const contrast = parseFloat(contrastInput.value) / 100;
    const saturation = parseFloat(saturationInput.value) / 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    tempCanvas.width = Math.ceil(canvas.width / pixelSize);
    tempCanvas.height = Math.ceil(canvas.height / pixelSize);
    tempCtx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);

    const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    for (let y = 0; y < tempCanvas.height; y++) {
        for (let x = 0; x < tempCanvas.width; x++) {
            const index = (y * tempCanvas.width + x) * 4;
            let [r, g, b] = [imgData.data[index], imgData.data[index + 1], imgData.data[index + 2]];

            // 調整飽和度
            const hsv = rgbToHsv(r, g, b);
            hsv[1] *= saturation;
            const rgb = hsvToRgb(hsv[0], hsv[1], hsv[2]);
            [r, g, b] = rgb;

            // 恢復原本的對比度公式
            r = applyContrast(r, contrast);
            g = applyContrast(g, contrast);
            b = applyContrast(b, contrast);

            // 繪製方塊
            const rectX = x * pixelSize;
            const rectY = y * pixelSize;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(rectX, rectY, pixelSize, pixelSize);

            // 繪製凸點
            ctx.beginPath();
            ctx.arc(
                rectX + pixelSize / 2,
                rectY + pixelSize / 2,
                (pixelSize * 0.625) / 2,
                0,
                Math.PI * 2
            );
            ctx.fillStyle = `rgba(${r * 1.1}, ${g * 1.1}, ${b * 1.1}, 0.9)`;
            ctx.fill();
        }
    }
}

// 應用對比度公式
function applyContrast(value, contrast) {
    return Math.min(255, Math.max(0, ((value - 128) * contrast + 128)));
}

// RGB/HSV 轉換
function rgbToHsv(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min, s = max === 0 ? 0 : d / max, v = max;
    let h = 0;
    if (max !== min) {
        h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    }
    return [h / 6, s, v];
}

function hsvToRgb(h, s, v) {
    let r, g, b, i = Math.floor(h * 6), f = h * 6 - i, p = v * (1 - s);
    const q = v * (1 - f * s), t = v * (1 - (1 - f) * s);
    [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6];
    return [r * 255, g * 255, b * 255];
}

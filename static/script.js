// 獲取 DOM 元素
const imageInput = document.getElementById("imageInput");
const pixelSizeInput = document.getElementById("pixelSize");
const contrastInput = document.getElementById("contrast");
const saturationInput = document.getElementById("saturation");
const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
let image = null;

// 滑桿顯示值
const pixelValue = document.getElementById("pixelValue");
const contrastValue = document.getElementById("contrastValue");
const saturationValue = document.getElementById("saturationValue");

// 上傳圖片
imageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            image = new Image();
            image.onload = () => {
                // 設置畫布大小，保持圖片比例
                const aspectRatio = image.width / image.height;
                canvas.width = 800; // 固定寬度
                canvas.height = canvas.width / aspectRatio; // 高度自適應比例
                updateCanvas();
            };
            image.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// 滑桿調整像素化程度
pixelSizeInput.addEventListener("input", () => {
    pixelValue.textContent = pixelSizeInput.value;
    updateCanvas();
});

// 滑桿調整對比度
contrastInput.addEventListener("input", () => {
    contrastValue.textContent = `${contrastInput.value}%`;
    updateCanvas();
});

// 滑桿調整飽和度
saturationInput.addEventListener("input", () => {
    saturationValue.textContent = `${saturationInput.value}%`;
    updateCanvas();
});

// 更新畫布
function updateCanvas() {
    if (!image) return;

    const pixelSize = parseInt(pixelSizeInput.value); // 像素大小
    const contrast = parseFloat(contrastInput.value) / 100; // 對比度比例
    const saturation = parseFloat(saturationInput.value) / 100; // 飽和度比例

    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除畫布

    // 建立臨時畫布，縮小圖片
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = Math.ceil(canvas.width / pixelSize);
    tempCanvas.height = Math.ceil(canvas.height / pixelSize);

    // 繪製縮小後的圖片
    tempCtx.drawImage(image, 0, 0, tempCanvas.width, tempCanvas.height);

    // 獲取縮小圖片的像素數據
    const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    // 繪製像素化的圓形
    for (let y = 0; y < tempCanvas.height; y++) {
        for (let x = 0; x < tempCanvas.width; x++) {
            const index = (y * tempCanvas.width + x) * 4; // 像素的索引
            let r = imgData.data[index];
            let g = imgData.data[index + 1];
            let b = imgData.data[index + 2];

            // 將 RGB 轉換為 HSV
            const hsv = rgbToHsv(r, g, b);
            hsv[1] *= saturation; // 調整飽和度
            const rgb = hsvToRgb(hsv[0], hsv[1], hsv[2]); // 轉換回 RGB

            // 應用對比度
            r = applyContrast(rgb[0], contrast);
            g = applyContrast(rgb[1], contrast);
            b = applyContrast(rgb[2], contrast);

            // 設定填充顏色
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

            // 繪製圓形像素
            ctx.beginPath();
            ctx.arc(
                x * pixelSize + pixelSize / 2, // 圓心的 X 座標
                y * pixelSize + pixelSize / 2, // 圓心的 Y 座標
                pixelSize / 2, // 圓的半徑
                0,
                Math.PI * 2 // 繪製整個圓形
            );
            ctx.fill();
        }
    }
}

// 應用對比度的計算公式
function applyContrast(value, contrast) {
    return Math.min(255, Math.max(0, ((value - 128) * contrast + 128))); // 限制在 0-255 範圍內
}

// RGB 轉換為 HSV
function rgbToHsv(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    const s = max === 0 ? 0 : d / max;
    const v = max;

    let h;
    if (max === min) h = 0;
    else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, v];
}

// HSV 轉換為 RGB
function hsvToRgb(h, s, v) {
    let r, g, b;
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return [r * 255, g * 255, b * 255];
}
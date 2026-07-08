// 1. Membuat Manifest File Virtual lewat Blob URL (Memastikan LOGO APPS pas diinstall tetap pakai guenfa.png)
const manifestBlob = new Blob([JSON.stringify({
    "name": "Qr ryzzi",
    "short_name": "Qr ryzzi",
    "description": "Buat QR Code Kustom Responsif",
    "start_url": window.location.href,
    "display": "standalone",
    "background_color": "#0d1117",
    "theme_color": "#0072ff",
    "orientation": "portrait-primary",
    "icons": [{
        "src": "https://files.catbox.moe/qkqne5.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
    }]
})], { type: 'application/json' });

const manifestURL = URL.createObjectURL(manifestBlob);
const link = document.createElement('link');
link.rel = 'manifest';
link.href = manifestURL;
document.head.appendChild(link);

// 2
if ('serviceWorker' in navigator) {
    const swCode = `
        const CACHE_NAME = 'r-qr-cache-v4';
        self.addEventListener('install', e => { self.skipWaiting(); });
        self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
        self.addEventListener('fetch', e => { e.respondWith(fetch(e.request).catch(() => caches.match(e.request))); });
    `;
    const swBlob = new Blob([swCode], { type: 'text/javascript' });
    const swUrl = URL.createObjectURL(swBlob);
    navigator.serviceWorker.register(swUrl)
        .then(reg => console.log('PWA In-line Service Worker Aktif!'))
        .catch(err => console.log('Gagal mendaftarkan PWA:', err));
}

// --- PROSES TOMBOL MANUAl INSTALL PWA ---
let deferredPrompt;
const pwaInstallBtn = document.getElementById('pwaInstallBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    pwaInstallBtn.classList.remove('hidden');
});

pwaInstallBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User mengonfirmasi instalasi web');
        }
        deferredPrompt = null;
        pwaInstallBtn.classList.add('hidden');
    }
});

// --- ANIMASI BACKGROUND (Hujan Bola Biru) ---
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
const maxParticles = 60;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() { this.reset(); this.y = Math.random() * canvas.height; }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -10;
        this.size = Math.random() * 3 + 1.5;
        this.speed = Math.random() * 1.5 + 0.8;
        this.opacity = Math.random() * 0.5 + 0.2;
    }
    update() { this.y += this.speed; if (this.y > canvas.height) this.reset(); }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 198, 255, ${this.opacity})`;
        ctx.fill();
    }
}

for (let i = 0; i < maxParticles; i++) particles.push(new Particle());
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
}
animate();

// --- LOGIKA UTAMA QR GENERATOR ---
const termsCheckbox = document.getElementById('termsCheckbox');
const enterBtn = document.getElementById('enterBtn');
const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const closeInfoBtn = document.getElementById('closeInfoBtn');
const closeInfoBtn2 = document.getElementById('closeInfoBtn2');
const landingPage = document.getElementById('landingPage');
const generatorPage = document.getElementById('generatorPage');

const qrText = document.getElementById('qrText');
const qrLogo = document.getElementById('qrLogo');
const qrColor = document.getElementById('qrColor');
const bgColor = document.getElementById('bgColor');
const dotsType = document.getElementById('dotsType');
const cornersType = document.getElementById('cornersType');

const logoAdjustMenu = document.getElementById('logoAdjustMenu');
const logoSizeRange = document.getElementById('logoSizeRange');
const logoSizeVal = document.getElementById('logoSizeVal');

const previewBtn = document.getElementById('previewBtn');
const downloadBtn = document.getElementById('downloadBtn');
const qrPreviewContainer = document.getElementById('qrPreview');

let qrCodeStyling;
let selectedLogoDataUrl = "";

// Mengubah nilai input warna default di HTML agar sinkron dengan QR Code (QR Hitam, Latar Putih)
qrColor.value = "#000000";
bgColor.value = "#ffffff";

termsCheckbox.addEventListener('change', function() {
    enterBtn.disabled = !this.checked;
});

infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeInfoBtn.addEventListener('click', () => infoModal.classList.add('hidden'));
closeInfoBtn2.addEventListener('click', () => infoModal.classList.add('hidden'));

enterBtn.addEventListener('click', function() {
    landingPage.classList.add('hidden');
    generatorPage.classList.remove('hidden');
    initQRCode();
});

logoSizeRange.addEventListener('input', function() {
    logoSizeVal.textContent = Math.round(this.value * 100) + "%";
    generateQR();
});

qrLogo.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvasCrop = document.createElement('canvas');
                const size = Math.min(img.width, img.height);
                canvasCrop.width = size;
                canvasCrop.height = size;
                const ctxCrop = canvasCrop.getContext('2d');

                ctxCrop.clearRect(0, 0, size, size);
                ctxCrop.beginPath();
                ctxCrop.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                ctxCrop.clip();

                ctxCrop.drawImage(
                    img,
                    (img.width - size) / 2,
                    (img.height - size) / 2,
                    size,
                    size,
                    0,
                    0,
                    size,
                    size
                );

                selectedLogoDataUrl = canvasCrop.toDataURL('image/png');
                logoAdjustMenu.classList.remove('hidden');
                generateQR();
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        selectedLogoDataUrl = "";
        logoAdjustMenu.classList.add('hidden');
        generateQR();
    }
});

function initQRCode() {
    // Default warna diubah: QR Hitam (#000000), Background Putih (#ffffff)
    qrCodeStyling = new QRCodeStyling({
        width: 250,
        height: 250,
        type: "canvas",
        data: "https://google.com",
        dotsOptions: { color: "#000000", type: "square" },
        backgroundOptions: { color: "#ffffff" },
        cornersSquareOptions: { color: "#000000", type: "square" },
        cornersDotOptions: { color: "#000000", type: "square" },
        imageOptions: { crossOrigin: "anonymous", hideBackgroundDots: true, imageSize: 0.3 }
    });
    qrPreviewContainer.innerHTML = "";
    qrCodeStyling.append(qrPreviewContainer);
}

function generateQR() {
    const textValue = qrText.value.trim() || "https://google.com";
    const currentSize = parseFloat(logoSizeRange.value);

    qrCodeStyling.update({
        data: textValue,
        dotsOptions: { color: qrColor.value, type: dotsType.value },
        backgroundOptions: { color: bgColor.value },
        cornersSquareOptions: { color: qrColor.value, type: cornersType.value },
        cornersDotOptions: { color: qrColor.value, type: cornersType.value },
        image: selectedLogoDataUrl || "",
        imageOptions: { 
            crossOrigin: "anonymous", 
            hideBackgroundDots: true, 
            imageSize: currentSize 
        }
    });
}

previewBtn.addEventListener('click', generateQR);

downloadBtn.addEventListener('click', function() {
    // Memastikan data tautan (URL) diperbarui paling akurat ke dalam QR sebelum di-download
    generateQR();

    // Membuat angka acak antara 100 sampai 999
    const randomNum = Math.floor(Math.random() * 900) + 100;
    const randomFileName = `qrryzzi${randomNum}`;

    // Download QR Code dengan nama file acak
    qrCodeStyling.download({ name: randomFileName, extension: "png" });
});

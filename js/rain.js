//========================
// Rain event overlay
// Credits: https://codepen.io/ruigewaard/pen/Podmea
//========================

var rainCanvas = document.getElementById("rainOverlay");
rainCanvas.style.filter = 'blur(2px)';

var ctx = rainCanvas.getContext('2d');
var maxParts = 1000;
var particles = [];

function resizeRain() {
    rainCanvas.width = window.innerWidth;
    rainCanvas.height = window.innerHeight;
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    initParticles();
}; resizeRain();

function initParticles() {
    particles = [];
    for (var a = 0; a < maxParts; a++) {
        particles.push({
            x: Math.random() * rainCanvas.width,
            y: Math.random() * rainCanvas.height,
            l: Math.random() * 1,
            xs: -4 + Math.random() * 4 + 2,
            ys: Math.random() * 10 + 10
        });
    }
}

function drawRain() {
    ctx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);
    for (var c = 0; c < particles.length; c++) {
        var p = particles[c];
        if (rainCanvas.style.display != "none") {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x + p.l * p.xs, p.y + p.l * p.ys);
            ctx.stroke();
        }
    }

    for (var b = 0; b < particles.length; b++) {
        var p = particles[b];
        p.x += p.xs;
        p.y += p.ys;
        if (p.x > rainCanvas.width || p.y > rainCanvas.height) {
            p.x = Math.random() * rainCanvas.width;
            p.y = -20;
        }
    }
};
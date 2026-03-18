// ======================================
// NOVASHYLD MINIMAL CYBER BACKGROUND
// ======================================

const canvas = document.createElement("canvas");
const container = document.getElementById("shield3d");

container.appendChild(canvas);

const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


// ======================================
// PARTICLES
// ======================================

const particles = [];
const particleCount = 80;

for (let i = 0; i < particleCount; i++) {

    particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5
    });

}


// ======================================
// MOUSE
// ======================================

let mouse = {
    x: canvas.width / 2,
    y: canvas.height / 2
};

window.addEventListener("mousemove", e => {

    mouse.x = e.clientX;
    mouse.y = e.clientY;

});


// ======================================
// DRAW PARTICLES
// ======================================

function drawParticles() {

    particles.forEach(p => {

        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#00eaff";
        ctx.fill();

    });

}


// ======================================
// DRAW LINES
// ======================================

function drawLines() {

    for (let i = 0; i < particles.length; i++) {

        for (let j = i + 1; j < particles.length; j++) {

            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;

            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 120) {

                ctx.strokeStyle = "rgba(0,234,255,0.15)";
                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();

            }

        }

    }

}


// ======================================
// PARTICLE MOVEMENT
// ======================================

function updateParticles() {

    particles.forEach(p => {

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    });

}


// ======================================
// MOUSE GLOW
// ======================================

function mouseGlow() {

    const gradient = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        10,
        mouse.x,
        mouse.y,
        120
    );

    gradient.addColorStop(0, "rgba(0,234,255,0.25)");
    gradient.addColorStop(1, "rgba(0,234,255,0)");

    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
    ctx.fill();

}


// ======================================
// ANIMATION LOOP
// ======================================

function animate() {

    ctx.fillStyle = "rgba(2,6,23,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    updateParticles();
    drawParticles();
    drawLines();
    mouseGlow();

    requestAnimationFrame(animate);

}

animate();


// ======================================
// RESPONSIVE
// ======================================

window.addEventListener("resize", () => {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

});
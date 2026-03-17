/* ============================================
   SOCIA VISUAL — Interactive Script
   ============================================ */

// ---- Cursor Glow ----
const cursorGlow = document.getElementById('cursorGlow');
let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateGlow() {
  glowX += (mouseX - glowX) * 0.08;
  glowY += (mouseY - glowY) * 0.08;
  cursorGlow.style.left = glowX + 'px';
  cursorGlow.style.top = glowY + 'px';
  requestAnimationFrame(animateGlow);
}
animateGlow();

// ---- Navigation ----
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
const mobileLinks = document.querySelectorAll('.mobile-link');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
});

navToggle.addEventListener('click', () => {
  navToggle.classList.toggle('active');
  mobileMenu.classList.toggle('active');
  document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});

mobileLinks.forEach(link => {
  link.addEventListener('click', () => {
    navToggle.classList.remove('active');
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
  });
});

// ---- Hero Canvas — Interactive Particle Grid ----
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let canvasMouseX = 0, canvasMouseY = 0;

function resizeCanvas() {
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  initParticles();
}

function initParticles() {
  particles = [];
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  const spacing = Math.max(40, Math.min(60, w / 30));
  const cols = Math.ceil(w / spacing);
  const rows = Math.ceil(h / spacing);

  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      particles.push({
        originX: i * spacing,
        originY: j * spacing,
        x: i * spacing,
        y: j * spacing,
        size: 1.2,
        alpha: 0.15 + Math.random() * 0.1,
      });
    }
  }
}

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  canvasMouseX = e.clientX - rect.left;
  canvasMouseY = e.clientY - rect.top;
});

canvas.addEventListener('mouseleave', () => {
  canvasMouseX = -1000;
  canvasMouseY = -1000;
});

function drawParticles() {
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);

  const interactionRadius = 150;
  const maxDisplacement = 30;

  for (const p of particles) {
    const dx = canvasMouseX - p.originX;
    const dy = canvasMouseY - p.originY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < interactionRadius) {
      const force = (1 - dist / interactionRadius);
      const angle = Math.atan2(dy, dx);
      p.x = p.originX - Math.cos(angle) * maxDisplacement * force;
      p.y = p.originY - Math.sin(angle) * maxDisplacement * force;
      p.size = 1.2 + force * 2.5;
      p.alpha = 0.15 + force * 0.85;
    } else {
      p.x += (p.originX - p.x) * 0.08;
      p.y += (p.originY - p.y) * 0.08;
      p.size += (1.2 - p.size) * 0.08;
      p.alpha += (0.15 + Math.random() * 0.05 - p.alpha) * 0.05;
    }

    // Color: close to mouse = neon green, else grey
    const proximity = Math.max(0, 1 - dist / interactionRadius);
    const r = Math.round(40 + proximity * 128);
    const g = Math.round(40 + proximity * 215);
    const b = Math.round(40 - proximity * 40);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
    ctx.fill();
  }

  // Draw connections near cursor
  if (canvasMouseX > 0) {
    const nearby = particles.filter(p => {
      const d = Math.sqrt((canvasMouseX - p.x) ** 2 + (canvasMouseY - p.y) ** 2);
      return d < interactionRadius * 1.2;
    });

    for (let i = 0; i < nearby.length; i++) {
      for (let j = i + 1; j < nearby.length; j++) {
        const a = nearby[i], b = nearby[j];
        const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (d < 80) {
          const lineAlpha = (1 - d / 80) * 0.25;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(168, 255, 0, ${lineAlpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
drawParticles();

// ---- Scroll Reveal ----
const reveals = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

reveals.forEach(el => revealObserver.observe(el));

// ---- Logo Reveal on Scroll ----
const logoWrap = document.querySelector('.logo-reveal-wrap');
if (logoWrap) {
  const logoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      logoWrap.classList.toggle('visible', entry.isIntersecting);
    });
  }, { threshold: 0.3 });
  logoObserver.observe(logoWrap);
}

// ---- Count-Up Animation ----
const statNumbers = document.querySelectorAll('.stat-number[data-count]');
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count);
      if (el.dataset.symbol) return; // skip symbol-based stats
      let current = 0;
      const step = Math.max(1, Math.floor(target / 40));
      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = current;
      }, 30);
      countObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

statNumbers.forEach(el => countObserver.observe(el));

// ---- Smooth scroll for anchor links ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ---- Contact form (visual only) ----
const contactForm = document.getElementById('contactForm');
contactForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = contactForm.querySelector('.form-submit span');
  const originalText = btn.textContent;
  btn.textContent = 'Message Sent!';
  contactForm.reset();
  setTimeout(() => {
    btn.textContent = originalText;
  }, 3000);
});

// ---- Tilt effect on service cards ----
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / centerY * -4;
    const rotateY = (x - centerX) / centerX * 4;
    card.style.transform = `translateY(-4px) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0) perspective(800px) rotateX(0) rotateY(0)';
  });
});

// ---- Parallax on hero content ----
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const hero = document.querySelector('.hero-content');
  if (scrollY < window.innerHeight) {
    hero.style.transform = `translateY(${scrollY * 0.3}px)`;
    hero.style.opacity = 1 - scrollY / (window.innerHeight * 0.8);
  }
});

/* ============================================
   SOCIA VISUAL — Tactical Interactive Engine
   ============================================ */

// ---- Boot Sequence ----
const bootOverlay = document.getElementById('bootOverlay');
const bootText = document.getElementById('bootText');
const bootBarFill = document.getElementById('bootBarFill');

const bootMessages = [
  'INITIALIZING SYSTEM...',
  'LOADING VISUAL CORE...',
  'CONNECTING ASSETS...',
  'RENDERING INTERFACE...',
  'CALIBRATING DISPLAY...',
  'SYSTEM READY'
];

let bootIndex = 0;
let bootProgress = 0;

function runBoot() {
  if (bootIndex < bootMessages.length) {
    bootText.textContent = bootMessages[bootIndex];
    bootProgress = ((bootIndex + 1) / bootMessages.length) * 100;
    bootBarFill.style.width = bootProgress + '%';
    bootIndex++;
    setTimeout(runBoot, 300 + Math.random() * 200);
  } else {
    setTimeout(() => {
      bootOverlay.classList.add('done');
      document.body.classList.add('loaded');
      // Trigger hero reveals after boot
      document.querySelectorAll('.hero .reveal').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), i * 120);
      });
    }, 400);
  }
}
runBoot();

// ---- Custom Cursor ----
const cursor = document.getElementById('cursor');
const cursorDot = document.getElementById('cursorDot');
const cursorGlow = document.getElementById('cursorGlow');
let mx = 0, my = 0, cx = 0, cy = 0, dx = 0, dy = 0, gx = 0, gy = 0;

document.addEventListener('mousemove', (e) => {
  mx = e.clientX;
  my = e.clientY;
});

function animateCursor() {
  // Dot follows instantly
  dx += (mx - dx) * 0.6;
  dy += (my - dy) * 0.6;
  cursorDot.style.left = dx + 'px';
  cursorDot.style.top = dy + 'px';

  // Cross follows with lag
  cx += (mx - cx) * 0.15;
  cy += (my - cy) * 0.15;
  cursor.style.left = cx + 'px';
  cursor.style.top = cy + 'px';

  // Glow follows slowly
  gx += (mx - gx) * 0.06;
  gy += (my - gy) * 0.06;
  cursorGlow.style.left = gx + 'px';
  cursorGlow.style.top = gy + 'px';

  requestAnimationFrame(animateCursor);
}
animateCursor();

// Cursor hover states
const hoverTargets = document.querySelectorAll('a, button, [data-tilt], input, textarea');
hoverTargets.forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
});

// ---- Magnetic Hover ----
document.querySelectorAll('.magnetic').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'translate(0, 0)';
  });
});

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

// ---- Scroll Progress Bar ----
const scrollProgressBar = document.getElementById('scrollProgress');
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = (scrollTop / docHeight) * 100;
  scrollProgressBar.style.width = progress + '%';
});

// ---- Hero Canvas — Advanced Particle Grid ----
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let canvasMouseX = -1000, canvasMouseY = -1000;

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
  const spacing = Math.max(35, Math.min(50, w / 35));
  const cols = Math.ceil(w / spacing);
  const rows = Math.ceil(h / spacing);

  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      particles.push({
        originX: i * spacing,
        originY: j * spacing,
        x: i * spacing,
        y: j * spacing,
        size: 1,
        alpha: 0.1 + Math.random() * 0.05,
        pulse: Math.random() * Math.PI * 2,
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

let time = 0;
function drawParticles() {
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  ctx.clearRect(0, 0, w, h);
  time += 0.01;

  const interactionRadius = 160;
  const maxDisplacement = 35;

  for (const p of particles) {
    const dx = canvasMouseX - p.originX;
    const dy = canvasMouseY - p.originY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Ambient pulse
    p.pulse += 0.02;
    const ambientAlpha = 0.08 + Math.sin(p.pulse) * 0.03;

    if (dist < interactionRadius) {
      const force = (1 - dist / interactionRadius);
      const angle = Math.atan2(dy, dx);
      const easeForce = force * force; // quadratic falloff

      p.x = p.originX - Math.cos(angle) * maxDisplacement * easeForce;
      p.y = p.originY - Math.sin(angle) * maxDisplacement * easeForce;
      p.size = 1 + easeForce * 3;
      p.alpha = ambientAlpha + easeForce * 0.9;
    } else {
      p.x += (p.originX - p.x) * 0.06;
      p.y += (p.originY - p.y) * 0.06;
      p.size += (1 - p.size) * 0.06;
      p.alpha += (ambientAlpha - p.alpha) * 0.05;
    }

    const proximity = Math.max(0, 1 - dist / interactionRadius);
    const r = Math.round(30 + proximity * 138);
    const g = Math.round(30 + proximity * 225);
    const b = Math.round(30 - proximity * 30);

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
    ctx.fill();
  }

  // Draw connections near cursor
  if (canvasMouseX > 0) {
    const nearby = [];
    for (const p of particles) {
      const d = Math.sqrt((canvasMouseX - p.x) ** 2 + (canvasMouseY - p.y) ** 2);
      if (d < interactionRadius * 1.3) nearby.push(p);
    }

    for (let i = 0; i < nearby.length; i++) {
      for (let j = i + 1; j < nearby.length; j++) {
        const a = nearby[i], b = nearby[j];
        const d = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (d < 70) {
          const lineAlpha = (1 - d / 70) * 0.2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(168, 255, 0, ${lineAlpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw targeting ring at cursor
    const ringRadius = 60 + Math.sin(time * 3) * 5;
    ctx.beginPath();
    ctx.arc(canvasMouseX, canvasMouseY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(168, 255, 0, 0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Small inner ring
    ctx.beginPath();
    ctx.arc(canvasMouseX, canvasMouseY, 20, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(168, 255, 0, 0.08)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Grid overlay lines (very subtle)
  ctx.strokeStyle = 'rgba(168, 255, 0, 0.015)';
  ctx.lineWidth = 0.5;
  const gridSize = 200;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
drawParticles();

// ---- Text Scramble Effect ----
const scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*<>[]{}';

function scrambleText(element) {
  const original = element.textContent;
  const length = original.length;
  let iteration = 0;

  const interval = setInterval(() => {
    element.textContent = original
      .split('')
      .map((char, i) => {
        if (i < iteration) return original[i];
        if (char === ' ') return ' ';
        return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      })
      .join('');

    iteration += 1 / 2;
    if (iteration >= length) {
      element.textContent = original;
      clearInterval(interval);
    }
  }, 30);
}

// ---- Scroll Reveal ----
const reveals = document.querySelectorAll('.reveal:not(.hero .reveal)');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Trigger scramble on headings
      if (entry.target.hasAttribute('data-scramble')) {
        scrambleText(entry.target);
      }
    }
  });
}, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

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
      if (el.dataset.symbol) return;
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

// ---- Contact form (AJAX via Formsubmit.co + reCAPTCHA) ----
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Check reCAPTCHA
  const recaptchaResponse = document.querySelector('.g-recaptcha-response');
  if (recaptchaResponse && recaptchaResponse.value === '') {
    formStatus.textContent = '[ ERROR ] — Please complete the reCAPTCHA';
    formStatus.className = 'form-status error';
    return;
  }

  const btn = contactForm.querySelector('.cta-text');
  const originalText = btn.textContent;
  btn.textContent = 'TRANSMITTING...';

  try {
    const formData = new FormData(contactForm);
    const response = await fetch(contactForm.action, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      btn.textContent = 'TRANSMITTED ✓';
      formStatus.textContent = '[ SUCCESS ] — Message delivered. We\'ll be in touch.';
      formStatus.className = 'form-status success';
      contactForm.reset();
      if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
      setTimeout(() => { btn.textContent = originalText; }, 3000);
    } else {
      throw new Error('Transmission failed');
    }
  } catch (err) {
    btn.textContent = originalText;
    formStatus.textContent = '[ ERROR ] — Transmission failed. Try again or email directly.';
    formStatus.className = 'form-status error';
  }
});

// ---- 3D Tilt on service cards ----
document.querySelectorAll('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -8;
    const rotateY = (x - 0.5) * 8;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
  });

  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
  });
});

// ---- Parallax on hero content ----
window.addEventListener('scroll', () => {
  const scrollY = window.scrollY;
  const hero = document.querySelector('.hero-content');
  if (scrollY < window.innerHeight) {
    hero.style.transform = `translateY(${scrollY * 0.25}px)`;
    hero.style.opacity = 1 - scrollY / (window.innerHeight * 0.7);
  }
});

// ---- HUD Data Updates ----
const hudFps = document.getElementById('hudFps');
let lastTime = performance.now();
let frameCount = 0;

function updateFPS() {
  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    hudFps.textContent = frameCount;
    frameCount = 0;
    lastTime = now;
  }
  requestAnimationFrame(updateFPS);
}
updateFPS();

// Simulate coordinate updates based on mouse
document.addEventListener('mousemove', (e) => {
  const lat = (45.5 + (e.clientY / window.innerHeight) * 0.05).toFixed(4);
  const lng = (-122.6 + (e.clientX / window.innerWidth) * 0.1).toFixed(4);
  document.getElementById('hudLat').textContent = lat;
  document.getElementById('hudLng').textContent = lng;
});

// ---- Section Scroll-triggered border animation ----
const sections = document.querySelectorAll('.section');
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    }
  });
}, { threshold: 0.1 });

sections.forEach(s => sectionObserver.observe(s));

// ---- Scramble nav links on hover ----
document.querySelectorAll('[data-text]').forEach(el => {
  el.addEventListener('mouseenter', () => {
    const textEl = el.querySelector('.nav-link-text') || el;
    const original = el.dataset.text;
    let iteration = 0;
    const interval = setInterval(() => {
      textEl.textContent = original
        .split('')
        .map((char, i) => {
          if (i < iteration) return original[i];
          return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        })
        .join('');
      iteration += 1;
      if (iteration > original.length) {
        textEl.textContent = original;
        clearInterval(interval);
      }
    }, 40);
  });
});

// ---- Keyboard easter egg ----
const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
let konamiIndex = 0;
document.addEventListener('keydown', (e) => {
  if (e.keyCode === konamiCode[konamiIndex]) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      document.body.style.setProperty('--accent-1', '#ff00ff');
      document.body.style.setProperty('--accent-2', '#00ffff');
      document.body.style.setProperty('--gradient', 'linear-gradient(135deg, #ff00ff, #00ffff)');
      document.body.style.setProperty('--gradient-text', 'linear-gradient(135deg, #ff00ff, #00ffff)');
      konamiIndex = 0;
      setTimeout(() => {
        document.body.style.removeProperty('--accent-1');
        document.body.style.removeProperty('--accent-2');
        document.body.style.removeProperty('--gradient');
        document.body.style.removeProperty('--gradient-text');
      }, 5000);
    }
  } else {
    konamiIndex = 0;
  }
});

/* ============================================
   SOCIA VISUAL — Tactical Interactive Engine
   Full-viewport panel system
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
      // Trigger logo intro animation
      const heroLogo = document.querySelector('.hero-logo');
      if (heroLogo) {
        heroLogo.classList.add('intro-ready');
        setTimeout(() => {
          heroLogo.classList.remove('intro-ready');
          heroLogo.classList.add('intro-done');
        }, 3600);
      }
      // Trigger hero reveals after boot
      document.querySelectorAll('.panel--hero .reveal').forEach((el, i) => {
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
let mouseX = 0, mouseY = 0, cx = 0, cy = 0, dx = 0, dy = 0, gx = 0, gy = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function animateCursor() {
  dx += (mouseX - dx) * 0.6;
  dy += (mouseY - dy) * 0.6;
  cursorDot.style.left = dx + 'px';
  cursorDot.style.top = dy + 'px';

  cx += (mouseX - cx) * 0.15;
  cy += (mouseY - cy) * 0.15;
  cursor.style.left = cx + 'px';
  cursor.style.top = cy + 'px';

  gx += (mouseX - gx) * 0.06;
  gy += (mouseY - gy) * 0.06;
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

// ============================================
// SECTION MANAGER — Full-viewport panel system
// ============================================
const SectionManager = {
  panels: [],
  dots: [],
  currentIndex: 0,
  totalPanels: 0,
  isTransitioning: false,
  transitionDuration: 850,
  lastWheelTime: 0,
  wheelCooldown: 1000,
  touchStartY: 0,
  scanLine: null,
  progressEdges: {},
  hudScroll: null,

  // Panel name map for anchor links
  panelMap: { hero: 0, about: 1, services: 2, contact: 3 },

  init() {
    this.panels = Array.from(document.querySelectorAll('.panel'));
    this.dots = Array.from(document.querySelectorAll('.section-nav-dot'));
    this.mobileBtns = Array.from(document.querySelectorAll('.mobile-nav-btn'));
    this.totalPanels = this.panels.length;
    this.scanLine = document.getElementById('scanLine');
    this.progressEdges = {
      top: document.getElementById('scrollProgressTop'),
      right: document.getElementById('scrollProgressRight'),
      bottom: document.getElementById('scrollProgressBottom'),
      left: document.getElementById('scrollProgressLeft'),
    };
    this.hudScroll = document.getElementById('hudScroll');

    // Ensure first panel is active
    this.panels[0].classList.add('active');
    this.updateNav();
    this.updateProgress();

    // Bind inputs
    this.bindWheel();
    this.bindTouch();
    this.bindKeyboard();
    this.bindDots();
    this.bindAnchors();
  },

  goTo(targetIndex, direction) {
    if (this.isTransitioning) return;
    if (targetIndex === this.currentIndex) return;
    if (targetIndex < 0 || targetIndex >= this.totalPanels) return;

    this.isTransitioning = true;
    direction = direction || (targetIndex > this.currentIndex ? 'down' : 'up');

    const outPanel = this.panels[this.currentIndex];
    const inPanel = this.panels[targetIndex];

    // Reset reveals on incoming panel
    inPanel.querySelectorAll('.reveal').forEach(el => el.classList.remove('visible'));

    // Scan line sweep
    if (this.scanLine) {
      this.scanLine.classList.remove('sweeping-down', 'sweeping-up');
      void this.scanLine.offsetWidth; // force reflow
      this.scanLine.classList.add(direction === 'down' ? 'sweeping-down' : 'sweeping-up');
    }

    // Start exit animation
    outPanel.classList.add(direction === 'down' ? 'exit-up' : 'exit-down');

    // Start enter animation (slightly overlapped)
    setTimeout(() => {
      inPanel.classList.add('active');
      inPanel.classList.add(direction === 'down' ? 'enter-from-below' : 'enter-from-above');
    }, 100);

    // Trigger reveals on incoming panel
    setTimeout(() => {
      const reveals = inPanel.querySelectorAll('.reveal');
      reveals.forEach((el, i) => {
        setTimeout(() => {
          el.classList.add('visible');
          if (el.hasAttribute('data-scramble')) {
            scrambleText(el);
          }
        }, i * 80);
      });
    }, 300);

    // Cleanup after transition
    setTimeout(() => {
      outPanel.classList.remove('active', 'exit-up', 'exit-down');
      inPanel.classList.remove('enter-from-below', 'enter-from-above');
      this.scanLine.classList.remove('sweeping-down', 'sweeping-up');
      this.currentIndex = targetIndex;
      this.isTransitioning = false;
      this.updateNav();
      this.updateProgress();

      // Update URL hash
      const panelId = inPanel.id;
      if (panelId) {
        history.replaceState(null, null, '#' + panelId);
      }
    }, this.transitionDuration);
  },

  next() {
    if (this.currentIndex < this.totalPanels - 1) {
      this.goTo(this.currentIndex + 1, 'down');
    }
  },

  prev() {
    if (this.currentIndex > 0) {
      this.goTo(this.currentIndex - 1, 'up');
    }
  },

  updateNav() {
    this.dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === this.currentIndex);
    });
    this.mobileBtns.forEach((btn, i) => {
      btn.classList.toggle('active', i === this.currentIndex);
    });
  },

  updateProgress() {
    if (this.progressEdges.top) {
      const e = this.progressEdges;
      const idx = this.currentIndex; // 0=home, 1=about, 2=services, 3=contact
      // Section 1: top, Section 2: +right, Section 3: +bottom, Section 4: +left
      e.top.style.width = idx >= 0 ? '100%' : '0%';
      e.right.style.height = idx >= 1 ? '100%' : '0%';
      e.bottom.style.width = idx >= 2 ? '100%' : '0%';
      e.left.style.height = idx >= 3 ? '100%' : '0%';
    }
    if (this.hudScroll) {
      this.hudScroll.textContent = (this.currentIndex + 1) + '/' + this.totalPanels;
    }
  },

  // --- Input Bindings ---

  bindWheel() {
    document.addEventListener('wheel', (e) => {
      e.preventDefault();
      const now = Date.now();
      if (now - this.lastWheelTime < this.wheelCooldown) return;
      if (this.isTransitioning) return;

      // Check if active panel has internal scroll
      const activePanel = this.panels[this.currentIndex];
      if (activePanel.scrollHeight > activePanel.clientHeight + 5) {
        if (e.deltaY > 0 && activePanel.scrollTop + activePanel.clientHeight < activePanel.scrollHeight - 5) return;
        if (e.deltaY < 0 && activePanel.scrollTop > 5) return;
      }

      if (Math.abs(e.deltaY) > 20) {
        this.lastWheelTime = now;
        if (e.deltaY > 0) this.next();
        else this.prev();
      }
    }, { passive: false });
  },

  bindTouch() {
    document.addEventListener('touchstart', (e) => {
      this.touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
      if (this.isTransitioning) return;
      const deltaY = this.touchStartY - e.changedTouches[0].clientY;

      // Check internal scroll — only for panels that allow scrolling
      const activePanel = this.panels[this.currentIndex];
      const canScroll = getComputedStyle(activePanel).overflowY === 'auto' || getComputedStyle(activePanel).overflowY === 'scroll';
      if (canScroll && activePanel.scrollHeight > activePanel.clientHeight + 5) {
        if (deltaY > 0 && activePanel.scrollTop + activePanel.clientHeight < activePanel.scrollHeight - 5) return;
        if (deltaY < 0 && activePanel.scrollTop > 5) return;
      }

      if (Math.abs(deltaY) > 50) {
        if (deltaY > 0) this.next();
        else this.prev();
      }
    }, { passive: true });
  },

  bindKeyboard() {
    document.addEventListener('keydown', (e) => {
      // Don't hijack when typing in form fields
      const tag = document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          this.next();
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          this.prev();
          break;
        case 'Home':
          e.preventDefault();
          this.goTo(0);
          break;
        case 'End':
          e.preventDefault();
          this.goTo(this.totalPanels - 1);
          break;
      }
    });
  },

  bindDots() {
    this.dots.forEach(dot => {
      dot.addEventListener('click', () => {
        const target = parseInt(dot.dataset.target);
        this.goTo(target);
      });
    });
    this.mobileBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = parseInt(btn.dataset.target);
        this.goTo(target);
      });
    });
  },

  bindAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const hash = anchor.getAttribute('href').replace('#', '');
        const targetIndex = this.panelMap[hash];
        if (targetIndex !== undefined) {
          this.goTo(targetIndex);
        }
      });
    });
  }
};

// Initialize after DOM is ready
SectionManager.init();

// Handle initial hash
if (window.location.hash) {
  const hash = window.location.hash.replace('#', '');
  const idx = SectionManager.panelMap[hash];
  if (idx !== undefined && idx !== 0) {
    // Jump directly without animation
    SectionManager.panels[0].classList.remove('active');
    SectionManager.panels[idx].classList.add('active');
    SectionManager.currentIndex = idx;
    SectionManager.updateNav();
    SectionManager.updateProgress();
    // Trigger reveals
    SectionManager.panels[idx].querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }
}

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

document.addEventListener('mousemove', (e) => {
  canvasMouseX = e.clientX;
  canvasMouseY = e.clientY;
});
document.addEventListener('mouseleave', () => {
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
    const pdx = canvasMouseX - p.originX;
    const pdy = canvasMouseY - p.originY;
    const dist = Math.sqrt(pdx * pdx + pdy * pdy);

    p.pulse += 0.02;
    const ambientAlpha = 0.08 + Math.sin(p.pulse) * 0.03;

    if (dist < interactionRadius) {
      const force = (1 - dist / interactionRadius);
      const angle = Math.atan2(pdy, pdx);
      const easeForce = force * force;

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

    const ringRadius = 60 + Math.sin(time * 3) * 5;
    ctx.beginPath();
    ctx.arc(canvasMouseX, canvasMouseY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(168, 255, 0, 0.06)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(canvasMouseX, canvasMouseY, 20, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(168, 255, 0, 0.08)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Grid overlay lines
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

// ---- Logo 3D Interactive ----
const logoWrap = document.querySelector('.hero-logo');
if (logoWrap) {
  const scene = logoWrap.querySelector('.logo-3d-scene');
  const layers = logoWrap.querySelectorAll('.logo-layer');
  const depthFactors = [50, 20, -15];
  let idleTimeout;
  let isHovering = false;
  let currentRx = 0, currentRy = 0;
  let targetRx = 0, targetRy = 0;

  logoWrap.classList.add('visible');

  const startIdle = () => { scene.classList.add('idle'); };
  const stopIdle = () => { scene.classList.remove('idle'); };
  setTimeout(startIdle, 4000);

  function animateScene() {
    if (isHovering) {
      currentRx += (targetRx - currentRx) * 0.08;
      currentRy += (targetRy - currentRy) * 0.08;
      scene.style.transform = `rotateX(${currentRx}deg) rotateY(${currentRy}deg)`;

      layers.forEach((layer, i) => {
        const depth = depthFactors[i];
        const shiftX = currentRy * depth * 0.04;
        const shiftY = -currentRx * depth * 0.04;
        layer.style.transform = `translateZ(${depth}px) translate(${shiftX}px, ${shiftY}px)`;
      });
    }
    requestAnimationFrame(animateScene);
  }
  animateScene();

  logoWrap.addEventListener('mousemove', (e) => {
    const rect = logoWrap.getBoundingClientRect();
    const lcx = rect.left + rect.width / 2;
    const lcy = rect.top + rect.height / 2;
    const lmx = e.clientX - lcx;
    const lmy = e.clientY - lcy;
    const maxTilt = 25;
    targetRx = -(lmy / (rect.height / 2)) * maxTilt;
    targetRy = (lmx / (rect.width / 2)) * maxTilt;
  });

  logoWrap.addEventListener('mouseenter', () => {
    isHovering = true;
    stopIdle();
    clearTimeout(idleTimeout);
  });

  logoWrap.addEventListener('mouseleave', () => {
    isHovering = false;
    targetRx = 0;
    targetRy = 0;

    const returnToCenter = () => {
      currentRx += (0 - currentRx) * 0.06;
      currentRy += (0 - currentRy) * 0.06;
      scene.style.transform = `rotateX(${currentRx}deg) rotateY(${currentRy}deg)`;
      layers.forEach((layer, i) => {
        const depth = depthFactors[i];
        const shiftX = currentRy * depth * 0.04;
        const shiftY = -currentRx * depth * 0.04;
        layer.style.transform = `translateZ(${depth}px) translate(${shiftX}px, ${shiftY}px)`;
      });
      if (Math.abs(currentRx) > 0.1 || Math.abs(currentRy) > 0.1) {
        requestAnimationFrame(returnToCenter);
      } else {
        currentRx = 0;
        currentRy = 0;
        scene.style.transform = '';
        layers.forEach((layer, i) => {
          layer.style.transform = `translateZ(${depthFactors[i]}px)`;
        });
        idleTimeout = setTimeout(startIdle, 500);
      }
    };
    returnToCenter();
  });

  logoWrap.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = logoWrap.getBoundingClientRect();
    const lcx = rect.left + rect.width / 2;
    const lcy = rect.top + rect.height / 2;
    const lmx = touch.clientX - lcx;
    const lmy = touch.clientY - lcy;
    const maxTilt = 20;
    isHovering = true;
    stopIdle();
    targetRx = -(lmy / (rect.height / 2)) * maxTilt;
    targetRy = (lmx / (rect.width / 2)) * maxTilt;
  }, { passive: false });

  logoWrap.addEventListener('touchend', () => {
    isHovering = false;
    targetRx = 0;
    targetRy = 0;
    idleTimeout = setTimeout(startIdle, 1500);
  });
}

// ---- Contact form (AJAX via Formsubmit.co + reCAPTCHA v3) ----
const contactForm = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const RECAPTCHA_SITE_KEY = '6Leau4ksAAAAAPDsayHMnlB8wLZk7yK88EIPnBuS';

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btn = contactForm.querySelector('.cta-text');
  const originalText = btn.textContent;
  btn.textContent = 'VERIFYING...';

  try {
    const token = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'submit' });
    document.getElementById('recaptchaResponse').value = token;

    btn.textContent = 'TRANSMITTING...';

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

// ---- HUD Data Updates ----

// FPS counter
const hudFps = document.getElementById('hudFps');
let lastTime = performance.now();
let frameCount = 0;

function updateFPS() {
  frameCount++;
  const now = performance.now();
  if (now - lastTime >= 1000) {
    if (hudFps) hudFps.textContent = frameCount;
    frameCount = 0;
    lastTime = now;
  }
  requestAnimationFrame(updateFPS);
}
updateFPS();

// Cursor velocity + coordinate tracking
const hudVel = document.getElementById('hudVel');
const hudLat = document.getElementById('hudLat');
const hudLng = document.getElementById('hudLng');
let prevMouseX = 0, prevMouseY = 0, prevMouseTime = performance.now();
let velocity = 0;

document.addEventListener('mousemove', (e) => {
  const now = performance.now();
  const dt = now - prevMouseTime;
  if (dt > 0) {
    const ddx = e.clientX - prevMouseX;
    const ddy = e.clientY - prevMouseY;
    const speed = Math.sqrt(ddx * ddx + ddy * ddy) / dt;
    velocity += (speed - velocity) * 0.3;
    if (hudVel) hudVel.textContent = velocity.toFixed(2);
  }
  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
  prevMouseTime = now;

  const lat = (45.5 + (e.clientY / window.innerHeight) * 0.05).toFixed(4);
  const lng = (-122.6 + (e.clientX / window.innerWidth) * 0.1).toFixed(4);
  if (hudLat) hudLat.textContent = lat;
  if (hudLng) hudLng.textContent = lng;
});

// Decay velocity when mouse stops
setInterval(() => {
  velocity *= 0.9;
  if (velocity < 0.01) velocity = 0;
  if (hudVel) hudVel.textContent = velocity.toFixed(2);
}, 100);

// Signal strength bars
const hudSignal = document.getElementById('hudSignal');
if (hudSignal) {
  const bars = hudSignal.querySelectorAll('span');
  setInterval(() => {
    const strength = 3 + Math.floor(Math.random() * 3);
    bars.forEach((bar, i) => {
      bar.classList.toggle('inactive', i >= strength);
    });
  }, 2000);
}

// Viewport resolution
const hudRes = document.getElementById('hudRes');
function updateRes() {
  if (hudRes) hudRes.textContent = window.innerWidth + 'x' + window.innerHeight;
}
updateRes();
window.addEventListener('resize', updateRes);

// Live clock
const hudClock = document.getElementById('hudClock');
setInterval(() => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  if (hudClock) hudClock.textContent = h + ':' + m + ':' + s;
}, 1000);

// Memory usage bar
const hudMem = document.getElementById('hudMem');
const hudMemBar = document.getElementById('hudMemBar');
function updateMem() {
  const usage = 30 + Math.floor(Math.random() * 40);
  if (hudMem) hudMem.textContent = usage + '%';
  if (hudMemBar) hudMemBar.style.width = usage + '%';
}
updateMem();
setInterval(updateMem, 3000);

// Uptime counter
const hudUptime = document.getElementById('hudUptime');
const sessionStart = performance.now();
setInterval(() => {
  const elapsed = Math.floor((performance.now() - sessionStart) / 1000);
  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');
  if (hudUptime) hudUptime.textContent = mins + ':' + secs;
}, 1000);

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

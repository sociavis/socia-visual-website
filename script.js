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

    // Notify WebGL scene of section change
    if (typeof GridScene !== 'undefined') {
      GridScene.onSectionChange(this.currentIndex, targetIndex);
    }

    // Contact section green mode
    if (targetIndex === 3) {
      document.body.classList.add('contact-active');
    } else {
      document.body.classList.remove('contact-active');
    }

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

      // Check internal scroll
      const activePanel = this.panels[this.currentIndex];
      if (activePanel.scrollHeight > activePanel.clientHeight + 5) {
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
// ---- WebGL Scene (Three.js) ----
const GridScene = (function() {
  const container = document.getElementById('heroCanvas');
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
  camera.position.set(0, 120, 180);
  camera.lookAt(0, 0, -40);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // ---- Particle Grid ----
  const gridSpacing = 14;
  const gridExtent = 600;
  const cols = Math.ceil(gridExtent * 2 / gridSpacing);
  const rows = Math.ceil(gridExtent * 2 / gridSpacing);
  const totalPoints = (cols + 1) * (rows + 1);

  const positions = new Float32Array(totalPoints * 3);
  const colors = new Float32Array(totalPoints * 3);
  const sizes = new Float32Array(totalPoints);
  const origins = new Float32Array(totalPoints * 3);
  const pulses = new Float32Array(totalPoints);

  let idx = 0;
  for (let i = 0; i <= cols; i++) {
    for (let j = 0; j <= rows; j++) {
      const x = -gridExtent + i * gridSpacing;
      const z = -gridExtent + j * gridSpacing;
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = 0;
      positions[idx * 3 + 2] = z;
      origins[idx * 3] = x;
      origins[idx * 3 + 1] = 0;
      origins[idx * 3 + 2] = z;
      colors[idx * 3] = 0.15;
      colors[idx * 3 + 1] = 0.18;
      colors[idx * 3 + 2] = 0.08;
      sizes[idx] = 2.0;
      pulses[idx] = Math.random() * Math.PI * 2;
      idx++;
    }
  }

  const particleGeom = new THREE.BufferGeometry();
  particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  particleGeom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const particleMat = new THREE.ShaderMaterial({
    vertexShader: `
      attribute float size;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (200.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.15, d);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true, vertexColors: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const pointCloud = new THREE.Points(particleGeom, particleMat);
  scene.add(pointCloud);

  // Grid lines
  const gridLineMat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.03, depthWrite: false });
  const gridLineSpacing = 48;
  for (let i = -gridExtent; i <= gridExtent; i += gridLineSpacing) {
    const gx = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-gridExtent, 0.01, i), new THREE.Vector3(gridExtent, 0.01, i)]);
    scene.add(new THREE.Line(gx, gridLineMat));
    const gz = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(i, 0.01, -gridExtent), new THREE.Vector3(i, 0.01, gridExtent)]);
    scene.add(new THREE.Line(gz, gridLineMat));
  }

  // Connection lines
  const maxConnections = 600;
  const linePositions = new Float32Array(maxConnections * 6);
  const lineColors = new Float32Array(maxConnections * 6);
  const lineGeom = new THREE.BufferGeometry();
  lineGeom.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeom.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
  lineGeom.setDrawRange(0, 0);
  const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending });
  const connectionLines = new THREE.LineSegments(lineGeom, lineMat);
  scene.add(connectionLines);

  // Cursor rings
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
  const cursorRing = new THREE.Mesh(new THREE.RingGeometry(14, 14.3, 64), ringMat);
  cursorRing.rotation.x = -Math.PI / 2; cursorRing.position.y = 0.1; cursorRing.visible = false;
  scene.add(cursorRing);
  const cursorRing2 = new THREE.Mesh(new THREE.RingGeometry(4.5, 4.8, 32), ringMat.clone());
  cursorRing2.material.opacity = 0.1; cursorRing2.rotation.x = -Math.PI / 2; cursorRing2.position.y = 0.1; cursorRing2.visible = false;
  scene.add(cursorRing2);

  // Raycaster
  const raycaster = new THREE.Raycaster();
  const mouseNDC = new THREE.Vector2(-10, -10);
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersectPoint = new THREE.Vector3();
  let mouseOnPlane = false;

  document.addEventListener('mousemove', (e) => {
    mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  document.addEventListener('mouseleave', () => { mouseNDC.set(-10, -10); mouseOnPlane = false; });

  // ---- Holographic Diamond Badge ----
  function createDiamondBadge(label, iconFn, pos) {
    const group = new THREE.Group();
    group.position.copy(pos);
    group.visible = false;

    // Diamond shape (rotated square)
    const size = 18;
    const shape = new THREE.Shape();
    shape.moveTo(0, size);
    shape.lineTo(size, 0);
    shape.lineTo(0, -size);
    shape.lineTo(-size, 0);
    shape.closePath();

    // Outer frame
    const framePoints = shape.getPoints(1);
    const frameGeom = new THREE.BufferGeometry().setFromPoints(framePoints.map(p => new THREE.Vector3(p.x, p.y, 0)));
    const frameMat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.7 });
    const frame = new THREE.LineLoop(frameGeom, frameMat);
    group.add(frame);

    // Inner glow plane
    const glowGeom = new THREE.ShapeGeometry(shape);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xa8ff00, transparent: true, opacity: 0.06,
      side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending
    });
    group.add(new THREE.Mesh(glowGeom, glowMat));

    // Second outer ring (slightly larger)
    const outerSize = size * 1.2;
    const outerShape = new THREE.Shape();
    outerShape.moveTo(0, outerSize); outerShape.lineTo(outerSize, 0);
    outerShape.lineTo(0, -outerSize); outerShape.lineTo(-outerSize, 0); outerShape.closePath();
    const outerGeom = new THREE.BufferGeometry().setFromPoints(outerShape.getPoints(1).map(p => new THREE.Vector3(p.x, p.y, 0)));
    const outerMat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.15 });
    group.add(new THREE.LineLoop(outerGeom, outerMat));

    // Icon lines inside the diamond
    if (iconFn) {
      const iconGroup = iconFn();
      iconGroup.scale.set(0.45, 0.45, 0.45);
      iconGroup.position.z = 0.1;
      group.add(iconGroup);
    }

    // Store references for animation
    group.userData = { label, frame, frameMat, glowMat, outerMat, targetPos: pos.clone(), targetScale: 1 };
    scene.add(group);
    return group;
  }

  // Icon builders — return THREE.Group of line segments
  function iconGauge() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    // Arc
    const curve = new THREE.EllipseCurve(0, -4, 18, 18, Math.PI * 0.15, Math.PI * 0.85, false, 0);
    const arcPts = curve.getPoints(32).map(p => new THREE.Vector3(p.x, p.y, 0));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPts), mat));
    // Needle pointing to max (right)
    const needle = [new THREE.Vector3(0, -4, 0), new THREE.Vector3(14, 8, 0)];
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(needle), mat));
    // Tick marks
    for (let a = 0.2; a <= 0.8; a += 0.15) {
      const ang = Math.PI * a;
      const r1 = 19, r2 = 22;
      const pts = [new THREE.Vector3(Math.cos(ang) * r1, -4 + Math.sin(ang) * r1, 0), new THREE.Vector3(Math.cos(ang) * r2, -4 + Math.sin(ang) * r2, 0)];
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat.clone()));
    }
    return g;
  }

  function iconPlate() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    // Plate rectangle
    const rect = [new THREE.Vector3(-14, -10, 0), new THREE.Vector3(14, -10, 0), new THREE.Vector3(14, 10, 0), new THREE.Vector3(-14, 10, 0)];
    g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(rect), mat));
    // #1
    const one = [new THREE.Vector3(-2, -6, 0), new THREE.Vector3(2, -8, 0), new THREE.Vector3(2, 8, 0)];
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(one), mat));
    // Underline
    const ul = [new THREE.Vector3(-4, 8, 0), new THREE.Vector3(8, 8, 0)];
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ul), mat));
    return g;
  }

  function iconFlame() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    // Outer flame
    const pts = [
      new THREE.Vector3(0, -14, 0), new THREE.Vector3(-6, -4, 0), new THREE.Vector3(-10, 4, 0),
      new THREE.Vector3(-8, 10, 0), new THREE.Vector3(-4, 14, 0), new THREE.Vector3(0, 12, 0),
      new THREE.Vector3(4, 14, 0), new THREE.Vector3(8, 10, 0), new THREE.Vector3(10, 4, 0),
      new THREE.Vector3(6, -4, 0), new THREE.Vector3(0, -14, 0)
    ];
    const curve = new THREE.CatmullRomCurve3(pts, false);
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), mat));
    // Inner flame
    const inner = [
      new THREE.Vector3(0, -6, 0), new THREE.Vector3(-3, 2, 0), new THREE.Vector3(-4, 8, 0),
      new THREE.Vector3(0, 6, 0), new THREE.Vector3(4, 8, 0), new THREE.Vector3(3, 2, 0), new THREE.Vector3(0, -6, 0)
    ];
    const innerCurve = new THREE.CatmullRomCurve3(inner, false);
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(innerCurve.getPoints(24)), mat));
    return g;
  }

  // Create the 3 holographic badges (hidden initially)
  const badges = [
    createDiamondBadge('FULL SEND', iconGauge, new THREE.Vector3(-55, 40, 0)),
    createDiamondBadge('HOLESHOT', iconPlate, new THREE.Vector3(0, 40, 0)),
    createDiamondBadge('NO BRAKES', iconFlame, new THREE.Vector3(55, 40, 0)),
  ];

  // ---- Service Icons Ring ----
  function createServiceIcon(label, desc, tags, iconFn, angle) {
    const group = new THREE.Group();
    group.visible = false;

    const radius = 45;
    group.position.set(Math.cos(angle) * radius, 40, Math.sin(angle) * radius);

    // Diamond frame
    const size = 14;
    const shape = new THREE.Shape();
    shape.moveTo(0, size); shape.lineTo(size, 0); shape.lineTo(0, -size); shape.lineTo(-size, 0); shape.closePath();
    const frameGeom = new THREE.BufferGeometry().setFromPoints(shape.getPoints(1).map(p => new THREE.Vector3(p.x, p.y, 0)));
    const frameMat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.6 });
    group.add(new THREE.LineLoop(frameGeom, frameMat));

    const glowMat = new THREE.MeshBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.04, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    group.add(new THREE.Mesh(new THREE.ShapeGeometry(shape), glowMat));

    if (iconFn) {
      const icon = iconFn();
      icon.scale.set(0.35, 0.35, 0.35);
      icon.position.z = 0.1;
      group.add(icon);
    }

    group.userData = { label, desc, tags, frameMat, glowMat, baseAngle: angle, radius };
    scene.add(group);
    return group;
  }

  function iconMonitor() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    const screen = [new THREE.Vector3(-16, -8, 0), new THREE.Vector3(16, -8, 0), new THREE.Vector3(16, 8, 0), new THREE.Vector3(-16, 8, 0)];
    g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(screen), mat));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -8, 0), new THREE.Vector3(0, -14, 0)]), mat));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-8, -14, 0), new THREE.Vector3(8, -14, 0)]), mat));
    return g;
  }

  function iconPen() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    const pen = [new THREE.Vector3(-12, 12, 0), new THREE.Vector3(8, -8, 0), new THREE.Vector3(12, -12, 0), new THREE.Vector3(8, -8, 0), new THREE.Vector3(-12, 12, 0)];
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pen), mat));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-8, 8, 0), new THREE.Vector3(4, -4, 0)]), mat));
    return g;
  }

  function iconGlobe() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    const circle = new THREE.EllipseCurve(0, 0, 12, 12, 0, Math.PI * 2, false, 0);
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circle.getPoints(48).map(p => new THREE.Vector3(p.x, p.y, 0))), mat));
    const ell = new THREE.EllipseCurve(0, 0, 5, 12, 0, Math.PI * 2, false, 0);
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ell.getPoints(32).map(p => new THREE.Vector3(p.x, p.y, 0))), mat));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-12, 0, 0), new THREE.Vector3(12, 0, 0)]), mat));
    return g;
  }

  function iconPlay() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    const tri = [new THREE.Vector3(-6, -10, 0), new THREE.Vector3(10, 0, 0), new THREE.Vector3(-6, 10, 0)];
    g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(tri), mat));
    const bar = [new THREE.Vector3(-12, -10, 0), new THREE.Vector3(-12, 10, 0)];
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(bar), mat));
    return g;
  }

  const serviceData = [
    { label: 'Web Design & Development', desc: 'Fully interactive, responsive websites engineered to feel alive.', tags: ['Responsive', 'Custom Code', 'SEO'], icon: iconMonitor },
    { label: 'Graphic Design', desc: 'Logos, social media assets, print materials — whatever you need.', tags: ['Logos', 'Print', 'Social'], icon: iconPen },
    { label: 'Brand Identity', desc: 'Color palettes to full brand guidelines — own it everywhere.', tags: ['Strategy', 'Guidelines', 'Identity'], icon: iconGlobe },
    { label: 'Motion & Video', desc: 'Animated logos, promo videos, and motion graphics.', tags: ['Animation', 'Video', 'Motion'], icon: iconPlay },
  ];

  const serviceIcons = serviceData.map((s, i) => {
    const angle = (i / serviceData.length) * Math.PI * 2 - Math.PI / 2;
    return createServiceIcon(s.label, s.desc, s.tags, s.icon, angle);
  });
  let serviceRingAngle = 0;

  // ---- Green wash plane for contact ----
  const washGeom = new THREE.PlaneGeometry(2000, 2000);
  const washMat = new THREE.MeshBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const greenWash = new THREE.Mesh(washGeom, washMat);
  greenWash.position.set(0, -5, 0);
  greenWash.rotation.x = -Math.PI / 2;
  scene.add(greenWash);

  // ---- Transition state ----
  let currentSection = 0;
  let transitionProgress = 0;
  let transitionTarget = 0;
  let transitionFrom = 0;
  let isTransitioning3D = false;

  function onSectionChange(fromIdx, toIdx) {
    currentSection = toIdx;
    transitionFrom = fromIdx;
    transitionTarget = toIdx;
    transitionProgress = 0;
    isTransitioning3D = true;
  }

  // Camera positions per section
  const camTargets = [
    { pos: new THREE.Vector3(0, 120, 180), look: new THREE.Vector3(0, 0, -40) },   // hero
    { pos: new THREE.Vector3(0, 80, 100), look: new THREE.Vector3(0, 35, 0) },      // about — look at badges
    { pos: new THREE.Vector3(0, 70, 110), look: new THREE.Vector3(0, 35, 0) },      // services — look at ring
    { pos: new THREE.Vector3(0, 60, 90), look: new THREE.Vector3(0, 20, 0) },       // contact
  ];

  let currentCamPos = camTargets[0].pos.clone();
  let currentCamLook = camTargets[0].look.clone();

  let camTime = 0;
  let glTime = 0;

  function animate() {
    glTime += 0.01;
    camTime += 0.003;

    // ---- Transition interpolation ----
    if (isTransitioning3D) {
      transitionProgress += 0.025;
      if (transitionProgress >= 1) {
        transitionProgress = 1;
        isTransitioning3D = false;
      }
    }

    const t = transitionProgress;
    const easeT = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // easeInOutCubic

    // Camera interpolation
    const targetCam = camTargets[currentSection] || camTargets[0];
    currentCamPos.lerp(targetCam.pos, 0.04);
    currentCamLook.lerp(targetCam.look, 0.04);

    camera.position.copy(currentCamPos);
    camera.position.x += Math.sin(camTime * 0.7) * 5;
    camera.position.y += Math.sin(camTime * 0.5) * 3;
    camera.lookAt(currentCamLook);

    // ---- Section-specific 3D objects ----

    // Badges (visible on section 1 = about)
    const badgeVisible = currentSection === 1;
    badges.forEach((badge, i) => {
      if (badgeVisible && !badge.visible) {
        badge.visible = true;
        badge.scale.set(0.01, 0.01, 0.01);
      }
      if (badge.visible) {
        const targetScale = badgeVisible ? 1 : 0.01;
        const s = badge.scale.x + (targetScale - badge.scale.x) * 0.06;
        badge.scale.set(s, s, s);
        if (!badgeVisible && s < 0.02) badge.visible = false;

        // Holographic float + rotate
        badge.rotation.y = Math.sin(glTime * 0.8 + i * 2) * 0.15;
        badge.rotation.x = Math.sin(glTime * 0.5 + i * 1.5) * 0.08;
        badge.position.y = badge.userData.targetPos.y + Math.sin(glTime * 0.6 + i * 2.5) * 2;

        // Pulsing glow
        const pulse = 0.04 + Math.sin(glTime * 2 + i) * 0.02;
        badge.userData.glowMat.opacity = pulse;
        badge.userData.frameMat.opacity = 0.5 + Math.sin(glTime * 1.5 + i) * 0.2;
        badge.userData.outerMat.opacity = 0.1 + Math.sin(glTime * 1.2 + i * 0.7) * 0.05;
      }
    });

    // Service ring (visible on section 2)
    const serviceVisible = currentSection === 2;
    serviceRingAngle += 0.003;
    serviceIcons.forEach((svc, i) => {
      if (serviceVisible && !svc.visible) {
        svc.visible = true;
        svc.scale.set(0.01, 0.01, 0.01);
      }
      if (svc.visible) {
        const targetScale = serviceVisible ? 1 : 0.01;
        const s = svc.scale.x + (targetScale - svc.scale.x) * 0.06;
        svc.scale.set(s, s, s);
        if (!serviceVisible && s < 0.02) svc.visible = false;

        // Orbit around center
        const angle = svc.userData.baseAngle + serviceRingAngle;
        const r = svc.userData.radius;
        svc.position.x = Math.cos(angle) * r;
        svc.position.z = Math.sin(angle) * r;
        svc.position.y = 40 + Math.sin(glTime * 0.5 + i * 1.5) * 3;

        // Face camera
        svc.lookAt(camera.position);

        // Glow pulse
        svc.userData.glowMat.opacity = 0.03 + Math.sin(glTime * 1.8 + i) * 0.015;
        svc.userData.frameMat.opacity = 0.4 + Math.sin(glTime * 1.3 + i) * 0.2;
      }
    });

    // Green wash (section 3 = contact)
    const greenTarget = currentSection === 3 ? 0.08 : 0;
    washMat.opacity += (greenTarget - washMat.opacity) * 0.04;

    // Particle grid tint shift for contact
    const gridGreenBoost = currentSection === 3 ? 0.15 : 0;

    // ---- Particle update ----
    raycaster.setFromCamera(mouseNDC, camera);
    mouseOnPlane = raycaster.ray.intersectPlane(groundPlane, intersectPoint) !== null;
    const hitX = intersectPoint.x, hitZ = intersectPoint.z;
    const interactionRadius = 65;
    const maxDisplacement = 8;

    if (mouseOnPlane && mouseNDC.x > -5) {
      cursorRing.visible = true; cursorRing2.visible = true;
      cursorRing.position.set(hitX, 0.1, hitZ);
      cursorRing.scale.setScalar(1 + Math.sin(glTime * 3) * 0.08);
      cursorRing2.position.set(hitX, 0.1, hitZ);
    } else {
      cursorRing.visible = false; cursorRing2.visible = false;
    }

    let lineIdx = 0;
    const nearbyIndices = [];

    for (let i = 0; i < totalPoints; i++) {
      pulses[i] += 0.02;
      const ox = origins[i * 3], oz = origins[i * 3 + 2];
      const ambientBright = 0.13 + Math.sin(pulses[i]) * 0.04;
      const gb = ambientBright + gridGreenBoost;

      if (mouseOnPlane && mouseNDC.x > -5) {
        const dx = hitX - ox, dz = hitZ - oz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < interactionRadius) {
          const ef = Math.pow(1 - dist / interactionRadius, 2);
          const angle = Math.atan2(dz, dx);
          positions[i * 3] = ox - Math.cos(angle) * maxDisplacement * ef;
          positions[i * 3 + 1] = ef * 6;
          positions[i * 3 + 2] = oz - Math.sin(angle) * maxDisplacement * ef;
          sizes[i] = 2.0 + ef * 6;
          colors[i * 3] = 0.12 + ef * 0.54 + gridGreenBoost;
          colors[i * 3 + 1] = 0.12 + ef * 0.88 + gridGreenBoost;
          colors[i * 3 + 2] = 0.12 - ef * 0.12;
          nearbyIndices.push(i);
        } else {
          positions[i * 3] += (ox - positions[i * 3]) * 0.06;
          positions[i * 3 + 1] *= 0.94;
          positions[i * 3 + 2] += (oz - positions[i * 3 + 2]) * 0.06;
          sizes[i] += (2.0 - sizes[i]) * 0.06;
          colors[i * 3] += (gb - colors[i * 3]) * 0.05;
          colors[i * 3 + 1] += (gb - colors[i * 3 + 1]) * 0.05;
          colors[i * 3 + 2] += (ambientBright - colors[i * 3 + 2]) * 0.05;
        }
      } else {
        positions[i * 3] += (ox - positions[i * 3]) * 0.06;
        positions[i * 3 + 1] *= 0.94;
        positions[i * 3 + 2] += (oz - positions[i * 3 + 2]) * 0.06;
        sizes[i] += (2.0 - sizes[i]) * 0.06;
        colors[i * 3] += (gb - colors[i * 3]) * 0.05;
        colors[i * 3 + 1] += (gb - colors[i * 3 + 1]) * 0.05;
        colors[i * 3 + 2] += (ambientBright - colors[i * 3 + 2]) * 0.05;
      }
    }

    // Connection lines
    const connDist = 18;
    for (let i = 0; i < nearbyIndices.length && lineIdx < maxConnections; i++) {
      for (let j = i + 1; j < nearbyIndices.length && lineIdx < maxConnections; j++) {
        const ai = nearbyIndices[i], bi = nearbyIndices[j];
        const dx = positions[ai * 3] - positions[bi * 3], dy = positions[ai * 3 + 1] - positions[bi * 3 + 1], dz = positions[ai * 3 + 2] - positions[bi * 3 + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < connDist) {
          const alpha = (1 - d / connDist) * 0.5;
          const li = lineIdx * 6;
          linePositions[li] = positions[ai * 3]; linePositions[li + 1] = positions[ai * 3 + 1]; linePositions[li + 2] = positions[ai * 3 + 2];
          linePositions[li + 3] = positions[bi * 3]; linePositions[li + 4] = positions[bi * 3 + 1]; linePositions[li + 5] = positions[bi * 3 + 2];
          lineColors[li] = 0.66 * alpha; lineColors[li + 1] = 1.0 * alpha; lineColors[li + 2] = 0;
          lineColors[li + 3] = 0.66 * alpha; lineColors[li + 4] = 1.0 * alpha; lineColors[li + 5] = 0;
          lineIdx++;
        }
      }
    }
    for (let i = lineIdx * 6; i < maxConnections * 6; i++) { linePositions[i] = 0; lineColors[i] = 0; }

    particleGeom.attributes.position.needsUpdate = true;
    particleGeom.attributes.color.needsUpdate = true;
    particleGeom.attributes.size.needsUpdate = true;
    lineGeom.attributes.position.needsUpdate = true;
    lineGeom.attributes.color.needsUpdate = true;
    lineGeom.setDrawRange(0, lineIdx * 2);

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();

  return { onSectionChange, scene, camera };
})();

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

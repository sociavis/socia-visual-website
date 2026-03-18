// ---- WebGL Scene (Three.js) — Holographic Grid + Section Transitions ----
const GridScene = (function() {
  const container = document.getElementById('heroCanvas');
  const scene = new THREE.Scene();

  // Camera — close, low, dramatic perspective
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
  camera.position.set(0, 80, 140);
  camera.lookAt(0, 0, -60);

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
      colors[idx * 3] = 0.18;
      colors[idx * 3 + 1] = 0.22;
      colors[idx * 3 + 2] = 0.08;
      sizes[idx] = 2.2;
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
        float alpha = smoothstep(0.5, 0.1, d);
        gl_FragColor = vec4(vColor, alpha);
      }
    `,
    transparent: true, vertexColors: true, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const pointCloud = new THREE.Points(particleGeom, particleMat);
  scene.add(pointCloud);

  // Grid lines
  const gridLineMat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.055, depthWrite: false });
  for (let i = -gridExtent; i <= gridExtent; i += 48) {
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
  scene.add(new THREE.LineSegments(lineGeom, lineMat));

  // Cursor rings
  const cRingMat = new THREE.MeshBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false });
  const cursorRing = new THREE.Mesh(new THREE.RingGeometry(14, 14.3, 64), cRingMat);
  cursorRing.rotation.x = -Math.PI / 2; cursorRing.position.y = 0.1; cursorRing.visible = false;
  scene.add(cursorRing);
  const cursorRing2 = new THREE.Mesh(new THREE.RingGeometry(4.5, 4.8, 32), cRingMat.clone());
  cursorRing2.material.opacity = 0.1; cursorRing2.rotation.x = -Math.PI / 2; cursorRing2.position.y = 0.1; cursorRing2.visible = false;
  scene.add(cursorRing2);

  // Raycaster
  const raycaster = new THREE.Raycaster();
  const mouseNDC = new THREE.Vector2(-10, -10);
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersectPoint = new THREE.Vector3();
  let mouseOnPlane = false;

  // Store raw mouse pixel coordinates for service hover detection
  let mousePixelX = -1, mousePixelY = -1;

  document.addEventListener('mousemove', (e) => {
    mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
    mousePixelX = e.clientX;
    mousePixelY = e.clientY;
  });
  document.addEventListener('mouseleave', () => { mouseNDC.set(-10, -10); mouseOnPlane = false; mousePixelX = -1; mousePixelY = -1; });

  // ---- Canvas text texture helper ----
  function makeTextSprite(text, fontSize, opacity) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 2048; canvas.height = 256;
    const fs = fontSize || 24;
    ctx.font = `${fs}px 'Share Tech Mono', 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Glow shadow
    ctx.shadowColor = 'rgba(168, 255, 0, 0.5)';
    ctx.shadowBlur = fs > 50 ? 10 : 5;
    // Fill
    ctx.fillStyle = `rgba(168, 255, 0, ${opacity || 0.8})`;
    ctx.fillText(text, 1024, 128);
    ctx.shadowBlur = 0;
    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(30, 4, 1);
    return sprite;
  }

  // ---- Holographic Diamond Badge (multi-layer 3D) ----
  function createHoloBadge(config) {
    const group = new THREE.Group();
    group.position.copy(config.pos);
    group.visible = false;

    const size = config.size || 18;
    const accentColor = 0xa8ff00;

    // Helper: diamond shape
    function diamondShape(s) {
      const sh = new THREE.Shape();
      sh.moveTo(0, s); sh.lineTo(s, 0); sh.lineTo(0, -s); sh.lineTo(-s, 0); sh.closePath();
      return sh;
    }

    // Layer 1: Back frame (slightly larger, offset Z)
    const backShape = diamondShape(size * 1.25);
    const backGeom = new THREE.BufferGeometry().setFromPoints(backShape.getPoints(1).map(p => new THREE.Vector3(p.x, p.y, -2)));
    const backMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.12 });
    group.add(new THREE.LineLoop(backGeom, backMat));

    // Layer 2: Main frame
    const mainShape = diamondShape(size);
    const mainGeom = new THREE.BufferGeometry().setFromPoints(mainShape.getPoints(1).map(p => new THREE.Vector3(p.x, p.y, 0)));
    const mainMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.8 });
    const mainFrame = new THREE.LineLoop(mainGeom, mainMat);
    group.add(mainFrame);

    // Layer 3: Front frame (slightly smaller, offset Z forward)
    const frontShape = diamondShape(size * 0.75);
    const frontGeom = new THREE.BufferGeometry().setFromPoints(frontShape.getPoints(1).map(p => new THREE.Vector3(p.x, p.y, 2)));
    const frontMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.25 });
    group.add(new THREE.LineLoop(frontGeom, frontMat));

    // Glow fill
    const glowMat = new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
    group.add(new THREE.Mesh(new THREE.ShapeGeometry(mainShape), glowMat));

    // Scan line (horizontal line that sweeps vertically)
    const scanGeom = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-size * 0.8, 0, 0.5), new THREE.Vector3(size * 0.8, 0, 0.5)]);
    const scanMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.4 });
    const scanLine = new THREE.Line(scanGeom, scanMat);
    group.add(scanLine);

    // Corner brackets at the outer diamond corners (same radius as outer border)
    const cornerMat = new THREE.LineBasicMaterial({ color: accentColor, transparent: true, opacity: 0.5 });
    const os = size * 1.25; // outer diamond radius (matches back frame)
    const bl = 4; // bracket arm length
    // Outer diamond corners: top (0,os), right (os,0), bottom (0,-os), left (-os,0)
    // Each bracket has two arms along the diamond edges meeting at the corner
    // Diamond edges run at 45° — normalized directions between adjacent corners
    const d = Math.SQRT1_2; // ~0.7071
    [
      { x: 0, y: os,  a1x: d, a1y: -d, a2x: -d, a2y: -d },   // top: arms toward right & left
      { x: os, y: 0,  a1x: -d, a1y: -d, a2x: -d, a2y: d },    // right: arms toward top & bottom
      { x: 0, y: -os, a1x: -d, a1y: d, a2x: d, a2y: d },      // bottom: arms toward left & right
      { x: -os, y: 0, a1x: d, a1y: d, a2x: d, a2y: -d },      // left: arms toward bottom & top
    ].forEach(({ x, y, a1x, a1y, a2x, a2y }) => {
      const c1 = [new THREE.Vector3(x, y, 0.3), new THREE.Vector3(x + a1x * bl, y + a1y * bl, 0.3)];
      const c2 = [new THREE.Vector3(x, y, 0.3), new THREE.Vector3(x + a2x * bl, y + a2y * bl, 0.3)];
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c1), cornerMat));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(c2), cornerMat));
    });

    // Icon
    if (config.iconFn) {
      const icon = config.iconFn();
      icon.scale.set(0.4, 0.4, 0.4);
      icon.position.z = 0.5;
      group.add(icon);
    }

    // Text labels below badge — large, balanced with badge
    if (config.title) {
      const titleSprite = makeTextSprite(config.title, 96, 1.0);
      titleSprite.position.set(0, -size - 14, 0);
      titleSprite.scale.set(70, 10, 1);
      group.add(titleSprite);
    }
    if (config.subtitle) {
      const subSprite = makeTextSprite(config.subtitle, 44, 0.4);
      subSprite.position.set(0, -size - 23, 0);
      subSprite.scale.set(65, 7, 1);
      group.add(subSprite);
    }

    group.userData = {
      mainMat, backMat, frontMat, glowMat, scanLine, scanMat, cornerMat,
      targetPos: config.pos.clone(), glitchTimer: Math.random() * 100,
      label: config.title || '', desc: config.desc || '', tags: config.tags || [],
      isHovered: false
    };

    scene.add(group);
    return group;
  }

  // ---- Icon Builders ----
  function iconGauge() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    // Arc
    const curve = new THREE.EllipseCurve(0, -2, 16, 16, Math.PI * 0.18, Math.PI * 0.82, false, 0);
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(32).map(p => new THREE.Vector3(p.x, p.y, 0))), mat));
    // Needle to max
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -2, 0), new THREE.Vector3(12, 10, 0)]), mat));
    // Ticks
    for (let a = 0.25; a <= 0.75; a += 0.125) {
      const ang = Math.PI * a;
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(Math.cos(ang) * 17, -2 + Math.sin(ang) * 17, 0),
        new THREE.Vector3(Math.cos(ang) * 20, -2 + Math.sin(ang) * 20, 0)
      ]), mat.clone()));
    }
    // Base dot
    const dotGeom = new THREE.CircleGeometry(1.5, 12);
    const dotMat = new THREE.MeshBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.6 });
    const dot = new THREE.Mesh(dotGeom, dotMat);
    dot.position.set(0, -2, 0.1);
    g.add(dot);
    return g;
  }

  function iconPlate() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    // Plate with rounded feel
    const plate = [new THREE.Vector3(-13, -9, 0), new THREE.Vector3(13, -9, 0), new THREE.Vector3(13, 9, 0), new THREE.Vector3(-13, 9, 0)];
    g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(plate), mat));
    // Inner border
    const inner = [new THREE.Vector3(-11, -7, 0), new THREE.Vector3(11, -7, 0), new THREE.Vector3(11, 7, 0), new THREE.Vector3(-11, 7, 0)];
    g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(inner), mat.clone()));
    inner[0].z = 0.1;
    // Bold #1
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-3, 5, 0.1), new THREE.Vector3(1, 7, 0.1), new THREE.Vector3(1, -5, 0.1)
    ]), mat));
    // Serifs
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-4, -5, 0.1), new THREE.Vector3(6, -5, 0.1)]), mat));
    return g;
  }

  function iconFlame() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    // Outer flame — pointed at top, wide at base
    const outer = [
      new THREE.Vector3(0, 16, 0),
      new THREE.Vector3(-4, 10, 0), new THREE.Vector3(-8, 4, 0),
      new THREE.Vector3(-9, -2, 0), new THREE.Vector3(-7, -8, 0),
      new THREE.Vector3(-4, -12, 0), new THREE.Vector3(0, -14, 0),
      new THREE.Vector3(4, -12, 0), new THREE.Vector3(7, -8, 0),
      new THREE.Vector3(9, -2, 0), new THREE.Vector3(8, 4, 0),
      new THREE.Vector3(4, 10, 0), new THREE.Vector3(0, 16, 0)
    ];
    const outerCurve = new THREE.CatmullRomCurve3(outer, false);
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(outerCurve.getPoints(48)), mat));
    // Inner flame
    const inner = [
      new THREE.Vector3(0, 10, 0.1),
      new THREE.Vector3(-3, 4, 0.1), new THREE.Vector3(-4, -2, 0.1),
      new THREE.Vector3(-2, -6, 0.1), new THREE.Vector3(0, -8, 0.1),
      new THREE.Vector3(2, -6, 0.1), new THREE.Vector3(4, -2, 0.1),
      new THREE.Vector3(3, 4, 0.1), new THREE.Vector3(0, 10, 0.1)
    ];
    const innerCurve = new THREE.CatmullRomCurve3(inner, false);
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(innerCurve.getPoints(32)), mat.clone()));
    return g;
  }

  function iconMonitor() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-14, -6, 0), new THREE.Vector3(14, -6, 0), new THREE.Vector3(14, 8, 0), new THREE.Vector3(-14, 8, 0)
    ]), mat));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -6, 0), new THREE.Vector3(0, -12, 0)]), mat));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-7, -12, 0), new THREE.Vector3(7, -12, 0)]), mat));
    // Screen content lines
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10, 4, 0.1), new THREE.Vector3(4, 4, 0.1)]), mat.clone()));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-10, 1, 0.1), new THREE.Vector3(-2, 1, 0.1)]), mat.clone()));
    return g;
  }

  function iconPenTool() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    // Pen tool cursor shape (like Illustrator pen tool)
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 14, 0), new THREE.Vector3(-6, -8, 0), new THREE.Vector3(0, -4, 0),
      new THREE.Vector3(6, -8, 0), new THREE.Vector3(0, 14, 0)
    ]), mat));
    // Bezier curve
    const bezier = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-12, -10, 0.1), new THREE.Vector3(-6, 6, 0.1),
      new THREE.Vector3(6, -6, 0.1), new THREE.Vector3(12, 8, 0.1)
    );
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(bezier.getPoints(24)), mat.clone()));
    // Control points
    const cpMat = new THREE.MeshBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.5 });
    [[-12, -10], [12, 8]].forEach(([x, y]) => {
      const cp = new THREE.Mesh(new THREE.CircleGeometry(1.2, 8), cpMat);
      cp.position.set(x, y, 0.1);
      g.add(cp);
    });
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
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-11, 5, 0), new THREE.Vector3(11, 5, 0)]), mat.clone()));
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-11, -5, 0), new THREE.Vector3(11, -5, 0)]), mat.clone()));
    return g;
  }

  function iconPlay() {
    const g = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.9 });
    g.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-5, -10, 0), new THREE.Vector3(11, 0, 0), new THREE.Vector3(-5, 10, 0)
    ]), mat));
    // Film strip
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-12, -10, 0), new THREE.Vector3(-12, 10, 0)]), mat));
    for (let y = -8; y <= 8; y += 4) {
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-14, y, 0), new THREE.Vector3(-12, y, 0)]), mat.clone()));
    }
    return g;
  }

  // ---- Create About Badges ----
  const badges = [
    createHoloBadge({ pos: new THREE.Vector3(-55, 20, -10), iconFn: iconGauge, title: 'FULL SEND', subtitle: 'COMMITMENT LEVEL', size: 18 }),
    createHoloBadge({ pos: new THREE.Vector3(0, 20, -10), iconFn: iconPlate, title: 'HOLESHOT', subtitle: 'FIRST IMPRESSIONS THAT WIN', size: 18 }),
    createHoloBadge({ pos: new THREE.Vector3(55, 20, -10), iconFn: iconFlame, title: 'NO BRAKES', subtitle: 'ON CREATIVITY', size: 18 }),
  ];

  // ---- Create Service Badges ----
  const serviceData = [
    { label: 'Web Design & Development', desc: 'Fully interactive, responsive websites engineered to feel alive — smooth animations, bold layouts, and experiences that keep people clicking.', tags: ['Responsive', 'Custom Code', 'SEO'], icon: iconMonitor },
    { label: 'Graphic Design', desc: 'Logos, social media assets, print materials, wraps — whatever you need to look the part, we\'ve got you.', tags: ['Logos', 'Print', 'Social'], icon: iconPenTool },
    { label: 'Brand Identity', desc: 'From color palettes to full brand guidelines — we help you define who you are visually and own it everywhere.', tags: ['Strategy', 'Guidelines', 'Identity'], icon: iconGlobe },
    { label: 'Motion & Video', desc: 'Animated logos, promo videos, and motion graphics that bring your brand to life and stop the scroll.', tags: ['Animation', 'Video', 'Motion'], icon: iconPlay },
  ];

  const serviceIcons = serviceData.map((s, i) => {
    const angle = (i / serviceData.length) * Math.PI * 2 - Math.PI / 2;
    const r = 50;
    return createHoloBadge({
      pos: new THREE.Vector3(Math.cos(angle) * r, 20, Math.sin(angle) * r),
      iconFn: s.icon, title: s.label.toUpperCase(), size: 18,
      desc: s.desc, tags: s.tags
    });
  });
  let serviceRingAngle = 0;

  // ---- Diamond border for services on the grid plane ----
  const dR = 50;
  const dY = 0.5;
  var orbitRing = new THREE.Group();
  // Diamond outline
  var orbitRingMat = new THREE.LineBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0.15, depthWrite: false });
  var diamondPts = [
    new THREE.Vector3(0, 0, -dR), new THREE.Vector3(dR, 0, 0),
    new THREE.Vector3(0, 0, dR), new THREE.Vector3(-dR, 0, 0),
    new THREE.Vector3(0, 0, -dR)
  ];
  orbitRing.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(diamondPts), orbitRingMat));
  // Filled diamond plane
  var dShape = new THREE.Shape();
  dShape.moveTo(0, -dR); dShape.lineTo(dR, 0); dShape.lineTo(0, dR); dShape.lineTo(-dR, 0); dShape.closePath();
  var dFillMat = new THREE.MeshBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending });
  var dFillMesh = new THREE.Mesh(new THREE.ShapeGeometry(dShape), dFillMat);
  dFillMesh.rotation.x = -Math.PI / 2;
  orbitRing.add(dFillMesh);
  orbitRing.position.y = dY;
  orbitRing.visible = false;
  scene.add(orbitRing);

  // ---- Service hover tooltip (HTML overlay) ----
  let tooltipEl = document.createElement('div');
  tooltipEl.id = 'serviceTooltip';
  document.body.appendChild(tooltipEl);

  // ---- Green wash plane ----
  const washMat = new THREE.MeshBasicMaterial({ color: 0xa8ff00, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  const greenWash = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), washMat);
  greenWash.position.set(0, -5, 0); greenWash.rotation.x = -Math.PI / 2;
  scene.add(greenWash);

  // ---- State ----
  let currentSection = 0;
  let glTime = 0;
  let camTime = 0;

  const camTargets = [
    { pos: new THREE.Vector3(0, 80, 140), look: new THREE.Vector3(0, 0, -60) },
    { pos: new THREE.Vector3(0, 55, 95), look: new THREE.Vector3(0, 15, -10) },
    { pos: new THREE.Vector3(0, 50, 100), look: new THREE.Vector3(0, 15, -5) },
    { pos: new THREE.Vector3(0, 50, 85), look: new THREE.Vector3(0, 15, -10) },
  ];

  let currentCamPos = camTargets[0].pos.clone();
  let currentCamLook = camTargets[0].look.clone();

  function onSectionChange(fromIdx, toIdx) {
    currentSection = toIdx;
  }

  // ---- Animate Badge — about badges with glitch ----
  function animateBadge(badge, i, visible) {
    if (visible && !badge.visible) {
      badge.visible = true;
      badge.scale.set(0.01, 0.01, 0.01);
    }
    if (!badge.visible) return;

    const targetScale = visible ? 1 : 0.01;
    const s = badge.scale.x + (targetScale - badge.scale.x) * 0.06;
    badge.scale.set(s, s, s);
    if (!visible && s < 0.02) { badge.visible = false; return; }

    const ud = badge.userData;

    // Continuous Y rotation (slow spin)
    badge.rotation.y += 0.008 + i * 0.002;

    // Ambient float
    badge.position.y = ud.targetPos.y + Math.sin(glTime * 0.6 + i * 2.5) * 2.5;

    // Slight X tilt
    badge.rotation.x = Math.sin(glTime * 0.4 + i * 1.8) * 0.06;

    // Scan line sweep
    if (ud.scanLine) {
      const scanY = Math.sin(glTime * 1.5 + i * 2) * 14;
      ud.scanLine.position.y = scanY;
      ud.scanMat.opacity = 0.2 + Math.abs(Math.sin(glTime * 1.5 + i * 2)) * 0.3;
    }

    // Glitch effect — random flicker
    ud.glitchTimer += 0.01;
    const shouldGlitch = Math.sin(ud.glitchTimer * 7.3 + i * 13) > 0.97;
    if (shouldGlitch) {
      ud.mainMat.opacity = Math.random() * 0.5;
      ud.glowMat.opacity = Math.random() * 0.15;
      badge.position.x = ud.targetPos.x + (Math.random() - 0.5) * 1.5;
    } else {
      ud.mainMat.opacity += (0.7 + Math.sin(glTime * 1.5 + i) * 0.15 - ud.mainMat.opacity) * 0.1;
      ud.glowMat.opacity += (0.06 + Math.sin(glTime * 2 + i) * 0.02 - ud.glowMat.opacity) * 0.1;
      badge.position.x += (ud.targetPos.x - badge.position.x) * 0.1;
    }

    ud.backMat.opacity = 0.08 + Math.sin(glTime * 1.2 + i * 0.7) * 0.04;
    ud.frontMat.opacity = 0.2 + Math.sin(glTime * 0.9 + i * 1.3) * 0.08;
  }

  // ---- Animate Service Badge — NO glitch, hover brightens ----
  function animateServiceBadge(badge, i, visible) {
    if (visible && !badge.visible) {
      badge.visible = true;
      badge.scale.set(0.01, 0.01, 0.01);
    }
    if (!badge.visible) return;

    const ud = badge.userData;
    const targetScale = visible ? (ud.isHovered ? 1.15 : 1) : 0.01;
    const s = badge.scale.x + (targetScale - badge.scale.x) * 0.06;
    badge.scale.set(s, s, s);
    if (!visible && s < 0.02) { badge.visible = false; return; }

    // Continuous Y rotation (slow spin)
    badge.rotation.y += 0.008 + i * 0.002;

    // Ambient float
    badge.position.y = ud.targetPos.y + Math.sin(glTime * 0.6 + i * 2.5) * 2.5;

    // Slight X tilt
    badge.rotation.x = Math.sin(glTime * 0.4 + i * 1.8) * 0.06;

    // Scan line sweep
    if (ud.scanLine) {
      const scanY = Math.sin(glTime * 1.5 + i * 2) * 14;
      ud.scanLine.position.y = scanY;
      ud.scanMat.opacity = 0.2 + Math.abs(Math.sin(glTime * 1.5 + i * 2)) * 0.3;
    }

    // No glitch, no pulsing — fill only on hover
    if (ud.isHovered) {
      ud.mainMat.opacity += (1.0 - ud.mainMat.opacity) * 0.12;
      ud.glowMat.opacity += (0.18 - ud.glowMat.opacity) * 0.12;
    } else {
      ud.mainMat.opacity += (0.6 - ud.mainMat.opacity) * 0.08;
      ud.glowMat.opacity += (0.0 - ud.glowMat.opacity) * 0.08;
    }
    badge.position.x += (ud.targetPos.x - badge.position.x) * 0.1;

    ud.backMat.opacity = 0.08 + Math.sin(glTime * 1.2 + i * 0.7) * 0.04;
    ud.frontMat.opacity = 0.2 + Math.sin(glTime * 0.9 + i * 1.3) * 0.08;
  }

  // ---- Main Animation Loop ----
  function animate() {
    glTime += 0.01;
    camTime += 0.003;

    // Camera
    const targetCam = camTargets[currentSection] || camTargets[0];
    currentCamPos.lerp(targetCam.pos, 0.04);
    currentCamLook.lerp(targetCam.look, 0.04);
    camera.position.copy(currentCamPos);
    camera.position.x += Math.sin(camTime * 0.7) * 4;
    camera.position.y += Math.sin(camTime * 0.5) * 2;
    camera.lookAt(currentCamLook);

    // About badges (with glitch)
    badges.forEach((b, i) => animateBadge(b, i, currentSection === 1));

    // Service badges — orbit + hover detection
    serviceRingAngle += 0.002;
    const isServicesVisible = currentSection === 2;

    // Show/hide diamond border
    if (isServicesVisible && !orbitRing.visible) orbitRing.visible = true;
    if (!isServicesVisible && orbitRing.visible) {
      orbitRingMat.opacity += (0 - orbitRingMat.opacity) * 0.04;
      dFillMat.opacity += (0 - dFillMat.opacity) * 0.04;
      if (orbitRingMat.opacity < 0.001) orbitRing.visible = false;
    }
    if (isServicesVisible) {
      orbitRingMat.opacity += (0.12 - orbitRingMat.opacity) * 0.04;
      dFillMat.opacity += (0.06 - dFillMat.opacity) * 0.04;
    }

    // Service hover detection via screen-space projection
    let hoveredServiceIdx = -1;
    if (isServicesVisible && mousePixelX >= 0) {
      const projVec = new THREE.Vector3();
      let closestDist = Infinity;
      serviceIcons.forEach((svc, i) => {
        if (!svc.visible) return;
        projVec.copy(svc.position);
        projVec.project(camera);
        const screenX = (projVec.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-projVec.y * 0.5 + 0.5) * window.innerHeight;
        const dx = mousePixelX - screenX;
        const dy = mousePixelY - screenY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 40 && dist < closestDist) {
          closestDist = dist;
          hoveredServiceIdx = i;
        }
      });
    }

    serviceIcons.forEach((svc, i) => {
      svc.userData.isHovered = (i === hoveredServiceIdx);
      animateServiceBadge(svc, i + 3, isServicesVisible);
      if (svc.visible && isServicesVisible) {
        // Diamond corners: 0=top(0,-dR), 1=right(dR,0), 2=bottom(0,dR), 3=left(-dR,0)
        // Rotate each corner by serviceRingAngle around Y axis
        var baseX = [0, dR, 0, -dR][i];
        var baseZ = [-dR, 0, dR, 0][i];
        var cosA = Math.cos(serviceRingAngle);
        var sinA = Math.sin(serviceRingAngle);
        svc.userData.targetPos.x = baseX * cosA + baseZ * sinA;
        svc.userData.targetPos.z = -baseX * sinA + baseZ * cosA;
        svc.position.z += (svc.userData.targetPos.z - svc.position.z) * 0.06;
      }
    });
    // Rotate diamond with badges
    if (orbitRing.visible) {
      orbitRing.rotation.y = serviceRingAngle;
    }

    // Service tooltip with pixel-wipe effect
    if (hoveredServiceIdx >= 0) {
      const ud = serviceIcons[hoveredServiceIdx].userData;
      tooltipEl.innerHTML = `<div style="color:#a8ff00;font-size:16px;font-weight:bold;letter-spacing:0.12em;margin-bottom:8px;text-transform:uppercase;">${ud.label}</div><div style="color:#bbb;font-size:12px;line-height:1.6;margin-bottom:10px;">${ud.desc}</div><div style="display:flex;gap:6px;flex-wrap:wrap;">${ud.tags.map(t => `<span style="color:#a8ff00;font-size:10px;letter-spacing:0.1em;border:1px solid rgba(168,255,0,0.3);padding:3px 8px;">${t}</span>`).join('')}</div>`;
      tooltipEl.classList.add('visible');
      tooltipEl.style.left = Math.min(mousePixelX + 20, window.innerWidth - 320) + 'px';
      tooltipEl.style.top = (mousePixelY - 20) + 'px';
    } else {
      tooltipEl.classList.remove('visible');
    }

    // Green wash
    washMat.opacity += ((currentSection === 3 ? 0.1 : 0) - washMat.opacity) * 0.04;
    const gridGreenBoost = currentSection === 3 ? 0.15 : 0;

    // Particle update
    raycaster.setFromCamera(mouseNDC, camera);
    mouseOnPlane = raycaster.ray.intersectPlane(groundPlane, intersectPoint) !== null;
    const hitX = intersectPoint.x, hitZ = intersectPoint.z;
    const interactionRadius = 65, maxDisplacement = 8;

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
      const ab = 0.15 + Math.sin(pulses[i]) * 0.05;
      const gb = ab + gridGreenBoost;

      if (mouseOnPlane && mouseNDC.x > -5) {
        const dx = hitX - ox, dz = hitZ - oz;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < interactionRadius) {
          const ef = Math.pow(1 - dist / interactionRadius, 2);
          const angle = Math.atan2(dz, dx);
          positions[i * 3] = ox - Math.cos(angle) * maxDisplacement * ef;
          positions[i * 3 + 1] = ef * 6;
          positions[i * 3 + 2] = oz - Math.sin(angle) * maxDisplacement * ef;
          sizes[i] = 2.2 + ef * 6;
          colors[i * 3] = 0.12 + ef * 0.54 + gridGreenBoost;
          colors[i * 3 + 1] = 0.12 + ef * 0.88 + gridGreenBoost;
          colors[i * 3 + 2] = 0.12 - ef * 0.12;
          nearbyIndices.push(i);
        } else {
          positions[i * 3] += (ox - positions[i * 3]) * 0.06;
          positions[i * 3 + 1] *= 0.94;
          positions[i * 3 + 2] += (oz - positions[i * 3 + 2]) * 0.06;
          sizes[i] += (2.2 - sizes[i]) * 0.06;
          colors[i * 3] += (gb - colors[i * 3]) * 0.05;
          colors[i * 3 + 1] += (gb - colors[i * 3 + 1]) * 0.05;
          colors[i * 3 + 2] += (ab - colors[i * 3 + 2]) * 0.05;
        }
      } else {
        positions[i * 3] += (ox - positions[i * 3]) * 0.06;
        positions[i * 3 + 1] *= 0.94;
        positions[i * 3 + 2] += (oz - positions[i * 3 + 2]) * 0.06;
        sizes[i] += (2.2 - sizes[i]) * 0.06;
        colors[i * 3] += (gb - colors[i * 3]) * 0.05;
        colors[i * 3 + 1] += (gb - colors[i * 3 + 1]) * 0.05;
        colors[i * 3 + 2] += (ab - colors[i * 3 + 2]) * 0.05;
      }
    }

    // Connection lines
    for (let i = 0; i < nearbyIndices.length && lineIdx < maxConnections; i++) {
      for (let j = i + 1; j < nearbyIndices.length && lineIdx < maxConnections; j++) {
        const ai = nearbyIndices[i], bi = nearbyIndices[j];
        const dx = positions[ai * 3] - positions[bi * 3], dy = positions[ai * 3 + 1] - positions[bi * 3 + 1], dz = positions[ai * 3 + 2] - positions[bi * 3 + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < 18) {
          const alpha = (1 - d / 18) * 0.5;
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

  return { onSectionChange, scene, camera, renderer };
})();

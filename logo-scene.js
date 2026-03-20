/* Logo 3D Scene — Extruded logo inside 2D HUD rings with orbiting particles */
(function () {
  if (typeof THREE === "undefined") return;
  var wrap = document.getElementById("logo3d");
  if (!wrap) return;
  var container = wrap.querySelector(".logo-3d-scene");
  if (!container) return;

  /* ── Renderer ── */
  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  var cvs = renderer.domElement;
  cvs.style.position = "absolute";
  cvs.style.top = "50%";
  cvs.style.left = "50%";
  cvs.style.transform = "translate(-50%,-50%)";
  cvs.style.pointerEvents = "none";

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
  camera.position.set(1.2, 0.4, 13);
  camera.lookAt(0, 0, 0);

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x505050, 1.2));
  var keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
  keyLight.position.set(3, 4, 6);
  scene.add(keyLight);
  var rimLight = new THREE.PointLight(0xa8ff00, 0.4, 30);
  rimLight.position.set(-4, -2, 5);
  scene.add(rimLight);
  var backLight = new THREE.PointLight(0xa8ff00, 0.2, 20);
  backLight.position.set(0, 0, -4);
  scene.add(backLight);

  /* ── Logo geometry ── */
  var CX = 960, CY = 960, SC = 4.5 / 960;
  var DEPTH = 0.35;

  function makeShape(coords) {
    var shape = new THREE.Shape();
    for (var i = 0; i < coords.length; i += 2) {
      var x = (coords[i] - CX) * SC;
      var y = -(coords[i + 1] - CY) * SC;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    return shape;
  }

  var layer1Pts = [1454.6, 882, 625.1, 882, 469.2, 1035.9, 1298.7, 1035.9];
  var layer2Pts = [331.3, 960.5, 959.1, 332.7, 1188.3, 562, 1406.8, 562, 1179.6, 334.8, 958.6, 113.7, 114.4, 959, 428.2, 1275.9, 1055.4, 1275.9, 1211.3, 1122.1, 492.9, 1122.1];
  var layer3Pts = [1493, 648.1, 862.1, 648.1, 706.2, 802, 1428.4, 802, 1586.9, 960.5, 959.1, 1588.3, 849.7, 1478.9, 732.9, 1362.1, 514.4, 1362.1, 739.7, 1587.4, 958.6, 1806.3, 1805.6, 960.7];

  var extrudeSettings = {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 2
  };

  var matBar = new THREE.MeshPhongMaterial({
    color: 0x5a8800,
    emissive: 0xa8ff00,
    emissiveIntensity: 0.5,
    specular: 0xa8ff00,
    shininess: 100,
    side: THREE.DoubleSide
  });
  var matShape = new THREE.MeshPhongMaterial({
    color: 0x555555,
    emissive: 0xa8ff00,
    emissiveIntensity: 0.13,
    specular: 0x999999,
    shininess: 70,
    side: THREE.DoubleSide
  });

  var logoGroup = new THREE.Group();

  function createLayer(pts, material, zPos) {
    var shape = makeShape(pts);
    var geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    var mesh = new THREE.Mesh(geo, material);
    mesh.position.z = zPos - DEPTH / 2;
    return mesh;
  }

  var mesh1 = createLayer(layer1Pts, matBar, 0.2);
  var mesh2 = createLayer(layer2Pts, matShape, 0);
  var mesh3 = createLayer(layer3Pts, matShape, -0.2);
  logoGroup.add(mesh1, mesh2, mesh3);
  scene.add(logoGroup);

  /* ── HUD Ring helpers ── */
  var GREEN = 0xa8ff00;
  var lineMat = function (opacity) {
    return new THREE.LineBasicMaterial({
      color: GREEN,
      transparent: true,
      opacity: opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  };

  // Create an arc from startAngle to endAngle at given radius, flat on XY plane
  function makeArc(radius, startA, endA, segments) {
    var pts = [];
    var segs = segments || 48;
    for (var i = 0; i <= segs; i++) {
      var a = startA + (endA - startA) * (i / segs);
      pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }

  // Small tick mark (radial line)
  function makeTick(angle, innerR, outerR) {
    var pts = [
      new THREE.Vector3(Math.cos(angle) * innerR, Math.sin(angle) * innerR, 0),
      new THREE.Vector3(Math.cos(angle) * outerR, Math.sin(angle) * outerR, 0)
    ];
    return new THREE.BufferGeometry().setFromPoints(pts);
  }

  /* ── Inner Ring — nearly complete circle with 2 gaps + tick marks ── */
  var INNER_R = 4.5;
  var innerGroup = new THREE.Group();
  var innerMats = [];

  // 2 arcs with gaps at 90° and 270°
  var gapSize = 0.18; // radians (~10°)
  var arc1 = new THREE.Line(makeArc(INNER_R, gapSize / 2, Math.PI - gapSize / 2, 64), lineMat(0.2));
  var arc2 = new THREE.Line(makeArc(INNER_R, Math.PI + gapSize / 2, Math.PI * 2 - gapSize / 2, 64), lineMat(0.2));
  innerMats.push(arc1.material, arc2.material);
  innerGroup.add(arc1, arc2);

  // Tick marks at the gaps (crosshair style)
  for (var t = 0; t < 4; t++) {
    var tickAngle = t * Math.PI / 2;
    var tick = new THREE.Line(makeTick(tickAngle, INNER_R - 0.25, INNER_R + 0.25), lineMat(0.15));
    innerMats.push(tick.material);
    innerGroup.add(tick);
  }

  innerGroup.position.z = 0.01; // just slightly in front
  scene.add(innerGroup);

  /* ── Outer Ring — 6 segmented arcs with gaps + notch ticks ── */
  var OUTER_R = 5.8;
  var outerGroup = new THREE.Group();
  var outerMats = [];
  var OUTER_SEGS = 6;
  var arcSpan = (Math.PI * 2 / OUTER_SEGS) * 0.78; // each arc covers 78% of its slot
  var slotSize = Math.PI * 2 / OUTER_SEGS;

  for (var s = 0; s < OUTER_SEGS; s++) {
    var startA = s * slotSize;
    var endA = startA + arcSpan;
    var seg = new THREE.Line(makeArc(OUTER_R, startA, endA, 24), lineMat(0.16));
    outerMats.push(seg.material);
    outerGroup.add(seg);

    // Small notch at start of each segment
    var notch = new THREE.Line(makeTick(startA, OUTER_R - 0.15, OUTER_R + 0.15), lineMat(0.12));
    outerMats.push(notch.material);
    outerGroup.add(notch);
  }

  outerGroup.position.z = 0.01;
  scene.add(outerGroup);

  /* ── Orbiting particles — dots traveling along the rings ── */
  // Inner ring: 3 particles clockwise, Outer ring: 2 particles counter-clockwise
  var gc = document.createElement("canvas");
  gc.width = 64; gc.height = 64;
  var gx = gc.getContext("2d");
  var gg = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gg.addColorStop(0, "rgba(168,255,0,1)");
  gg.addColorStop(0.1, "rgba(168,255,0,0.8)");
  gg.addColorStop(0.35, "rgba(168,255,0,0.15)");
  gg.addColorStop(1, "rgba(168,255,0,0)");
  gx.fillStyle = gg;
  gx.fillRect(0, 0, 64, 64);
  var glowTex = new THREE.CanvasTexture(gc);

  var particles = [
    { radius: INNER_R, angle: 0, speed: 0.55, dir: 1 },
    { radius: INNER_R, angle: Math.PI * 0.66, speed: 0.6, dir: 1 },
    { radius: INNER_R, angle: Math.PI * 1.33, speed: 0.52, dir: 1 },
    { radius: OUTER_R, angle: 0, speed: 0.35, dir: -1 },
    { radius: OUTER_R, angle: Math.PI, speed: 0.38, dir: -1 }
  ];

  var pPositions = new Float32Array(particles.length * 3);
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));

  var pMat = new THREE.PointsMaterial({
    map: glowTex,
    size: 0.4,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  var pPoints = new THREE.Points(pGeo, pMat);
  scene.add(pPoints);

  /* ── State ── */
  var hovering = false;
  var hoverT = 0;
  var introState = 0;
  var introT = 0;
  var introStart = 0;
  var INTRO_DUR = 800;
  var time = 0;
  var camBaseX = 1.2, camBaseY = 0.4, camBaseZ = 13;

  // Start invisible
  logoGroup.scale.set(0, 0, 0);
  innerGroup.scale.set(0, 0, 0);
  outerGroup.scale.set(0, 0, 0);
  pPoints.visible = false;

  function backOut(t) {
    return 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
  }

  var lastW = 0, lastH = 0;
  function resize() {
    var rect = wrap.getBoundingClientRect();
    var bw = rect.width || 300;
    var bh = rect.height || 300;
    var w = Math.round(bw * 1.6);
    var h = Math.round(bh * 1.6);
    if (w === lastW && h === lastH) return;
    lastW = w; lastH = h;
    cvs.style.width = w + "px";
    cvs.style.height = h + "px";
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ── Render ── */
  function tick() {
    var now = performance.now();
    time = now * 0.001;

    if (introState === 0 && document.body.classList.contains("loaded")) {
      introState = 1;
      introStart = now + 200;
      pPoints.visible = true;
    }

    // Intro
    if (introState === 1) {
      introT = Math.max(0, Math.min(1, (now - introStart) / INTRO_DUR));
      if (introT > 0) {
        var e = backOut(introT);
        logoGroup.scale.set(e, e, e);
        var re = backOut(Math.min(1, introT * 1.2));
        innerGroup.scale.set(re, re, re);
        var re2 = backOut(Math.min(1, introT * 1.4));
        outerGroup.scale.set(re2, re2, re2);
        var flash = Math.max(0, 1 - introT * 4);
        matBar.emissiveIntensity = 0.5 + flash * 2;
        matShape.emissiveIntensity = 0.13 + flash * 0.5;
      }
      if (introT >= 1) {
        introState = 2;
        matBar.emissiveIntensity = 0.5;
        matShape.emissiveIntensity = 0.13;
        logoGroup.scale.set(1, 1, 1);
        innerGroup.scale.set(1, 1, 1);
        outerGroup.scale.set(1, 1, 1);
        wrap.classList.add("intro-done");
      }
    }

    // Hover
    hoverT += ((hovering ? 1 : 0) - hoverT) * 0.05;
    hoverT = Math.max(0, Math.min(1, hoverT));

    if (introState === 2) {
      logoGroup.rotation.y += 0.003;

      var sc = 1 + hoverT * 0.04;
      logoGroup.scale.set(sc, sc, sc);
      matBar.emissiveIntensity = 0.5 + hoverT * 0.4;
      matShape.emissiveIntensity = 0.13 + hoverT * 0.18;
    }

    // Camera drift
    var driftX = Math.sin(time * 0.13) * 0.35;
    var driftY = Math.sin(time * 0.1) * 0.2;
    var driftZ = Math.sin(time * 0.07) * 0.25;
    camera.position.set(camBaseX + driftX, camBaseY + driftY, camBaseZ + driftZ);
    camera.lookAt(driftX * 0.12, driftY * 0.08, 0);
    camera.fov = 46 - hoverT * 3;
    camera.updateProjectionMatrix();

    // Ring rotation — inner CW, outer CCW
    innerGroup.rotation.z += 0.002 + hoverT * 0.003;
    outerGroup.rotation.z -= 0.0015 + hoverT * 0.002;

    // Ring hover effects — brighten + pulse
    var hoverBright = hoverT * 0.18;
    var pulse = 0.03 * Math.sin(time * 2);
    var innerOpacity = Math.min(0.5, 0.2 + hoverBright + pulse);
    var outerOpacity = Math.min(0.45, 0.16 + hoverBright + pulse * 0.7);
    innerMats.forEach(function (m) { m.opacity = innerOpacity; });
    outerMats.forEach(function (m) { m.opacity = outerOpacity; });

    // On hover: outer ring subtle scale breathe
    if (introState === 2) {
      var breathe = 1 + hoverT * 0.015 * Math.sin(time * 2.5);
      outerGroup.scale.set(breathe, breathe, 1);
    }

    // Update particles — orbit flat along their ring
    var posArr = pGeo.attributes.position.array;
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.angle += p.speed * p.dir * 0.012;
      // Particles follow the ring's rotation
      var ringRot = p.radius === INNER_R ? innerGroup.rotation.z : outerGroup.rotation.z;
      var worldAngle = p.angle + ringRot;
      posArr[i * 3] = Math.cos(worldAngle) * p.radius;
      posArr[i * 3 + 1] = Math.sin(worldAngle) * p.radius;
      posArr[i * 3 + 2] = 0.02; // flat, slightly in front
    }
    pGeo.attributes.position.needsUpdate = true;
    pMat.opacity = 0.85 + hoverT * 0.1;
    pMat.size = 0.4 + hoverT * 0.12;

    resize();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  wrap.addEventListener("mouseenter", function () { hovering = true; });
  wrap.addEventListener("mouseleave", function () { hovering = false; });
  wrap.addEventListener("touchstart", function () { hovering = true; }, { passive: true });
  wrap.addEventListener("touchend", function () { hovering = false; });

  resize();
  requestAnimationFrame(tick);
})();

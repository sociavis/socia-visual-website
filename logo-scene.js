/* Logo 3D Scene — Three.js extruded logo with particle orb */
(function () {
  if (typeof THREE === "undefined") return;
  var wrap = document.getElementById("logo3d");
  if (!wrap) return;
  var container = wrap.querySelector(".logo-3d-scene");
  if (!container) return;

  /* ── Setup ── */
  var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.inset = "0";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.pointerEvents = "none";

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x303030, 0.8));

  var keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
  keyLight.position.set(2, 3, 6);
  scene.add(keyLight);

  var rimLight = new THREE.PointLight(0xa8ff00, 0.5, 30);
  rimLight.position.set(-3, -1, 4);
  scene.add(rimLight);

  var backLight = new THREE.PointLight(0xa8ff00, 0.3, 25);
  backLight.position.set(0, 0, -5);
  scene.add(backLight);

  /* ── Logo geometry from SVG polygon points ── */
  // SVG viewBox 1920x1920, center at 960,960
  var CX = 960, CY = 960, S = 4.5 / 960;
  var DEPTH = 0.12;

  function makeShape(coords) {
    var shape = new THREE.Shape();
    for (var i = 0; i < coords.length; i += 2) {
      var x = (coords[i] - CX) * S;
      var y = -(coords[i + 1] - CY) * S;
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
    bevelThickness: 0.02,
    bevelSize: 0.015,
    bevelSegments: 1
  };

  // Materials — dark bodies with emissive edges
  var matBar = new THREE.MeshPhongMaterial({
    color: 0x2a4400,
    emissive: 0xa8ff00,
    emissiveIntensity: 0.5,
    specular: 0xa8ff00,
    shininess: 120,
    side: THREE.DoubleSide
  });
  var matShape = new THREE.MeshPhongMaterial({
    color: 0x1a1a1a,
    emissive: 0xa8ff00,
    emissiveIntensity: 0.12,
    specular: 0x666666,
    shininess: 60,
    side: THREE.DoubleSide
  });

  var logoGroup = new THREE.Group();

  function createLayer(pts, material, zPos) {
    var shape = makeShape(pts);
    var geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Don't center — keep relative positions from SVG coordinate system
    var mesh = new THREE.Mesh(geo, material);
    // Center the extrusion on Z (extrude goes 0 to depth, shift back by half)
    mesh.position.z = zPos - DEPTH / 2;
    return mesh;
  }

  var mesh1 = createLayer(layer1Pts, matBar, 0.3);
  var mesh2 = createLayer(layer2Pts, matShape, 0);
  var mesh3 = createLayer(layer3Pts, matShape, -0.3);

  logoGroup.add(mesh1);
  logoGroup.add(mesh2);
  logoGroup.add(mesh3);
  scene.add(logoGroup);

  /* ── Particles ── */
  var PCOUNT = 40;
  var particleData = [];
  var positions = new Float32Array(PCOUNT * 3);
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  // Glow sprite texture
  var glowCanvas = document.createElement("canvas");
  glowCanvas.width = 32;
  glowCanvas.height = 32;
  var gctx = glowCanvas.getContext("2d");
  var grad = gctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(168,255,0,1)");
  grad.addColorStop(0.2, "rgba(168,255,0,0.5)");
  grad.addColorStop(1, "rgba(168,255,0,0)");
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 32, 32);
  var glowTex = new THREE.CanvasTexture(glowCanvas);

  var pMat = new THREE.PointsMaterial({
    map: glowTex,
    size: 0.22,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  var points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  var ORB_RADIUS = 5.8;
  for (var i = 0; i < PCOUNT; i++) {
    particleData.push({
      orbitR: 0.65 + Math.random() * 0.35,
      speed: (0.12 + Math.random() * 0.5) * (Math.random() < 0.5 ? 1 : -1),
      tiltX: (Math.random() - 0.5) * Math.PI * 0.95,
      tiltY: (Math.random() - 0.5) * Math.PI,
      tiltZ: Math.random() * Math.PI * 2,
      angle: Math.random() * Math.PI * 2,
      absorbProgress: 0,
      isLeader: i < 8
    });
  }

  /* ── Orb rings ── */
  var rings = [];
  var RING_SEG = 128;
  function createRing(tiltX, tiltY) {
    var pts = [];
    for (var j = 0; j <= RING_SEG; j++) {
      var a = (j / RING_SEG) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * ORB_RADIUS, Math.sin(a) * ORB_RADIUS, 0));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({
      color: 0xa8ff00,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var line = new THREE.Line(geo, mat);
    line.rotation.x = tiltX;
    line.rotation.y = tiltY;
    return line;
  }

  var ring1 = createRing(0.25, 0);
  var ring2 = createRing(Math.PI * 0.5, 0.5);
  var ring3 = createRing(Math.PI * 0.28, Math.PI * 0.65);
  rings.push(ring1, ring2, ring3);
  rings.forEach(function (r) { scene.add(r); });

  /* ── State ── */
  var hovering = false;
  var hoverT = 0;
  var introState = 0;
  var introT = 0;
  var introStart = 0;
  var INTRO_DUR = 800;
  var MAX_ABSORB = 0.75;
  var orbAngle = 0;
  var baseEmissiveBar = 0.5;
  var baseEmissiveShape = 0.12;

  // Start invisible
  logoGroup.scale.set(0, 0, 0);
  points.visible = false;
  rings.forEach(function (r) { r.scale.set(0, 0, 0); });

  function backOut(t) {
    return 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
  }

  var lastW = 0, lastH = 0;
  function resize() {
    var rect = container.getBoundingClientRect();
    var w = Math.round(rect.width);
    var h = Math.round(rect.height);
    if (w === lastW && h === lastH) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function orbitPos(angle, tiltX, tiltY, tiltZ, radius) {
    var x = Math.cos(angle) * radius, y = Math.sin(angle) * radius, z = 0;
    var c1 = Math.cos(tiltX), s1 = Math.sin(tiltX);
    var y2 = y * c1 - z * s1; z = y * s1 + z * c1; y = y2;
    var c2 = Math.cos(tiltY), s2 = Math.sin(tiltY);
    var x2 = x * c2 + z * s2; z = -x * s2 + z * c2; x = x2;
    var c3 = Math.cos(tiltZ), s3 = Math.sin(tiltZ);
    x2 = x * c3 - y * s3; y2 = x * s3 + y * c3;
    return { x: x2, y: y2, z: z };
  }

  /* ── Render ── */
  function tick() {
    var now = performance.now();

    // Boot detection
    if (introState === 0 && document.body.classList.contains("loaded")) {
      introState = 1;
      introStart = now + 200;
      points.visible = true;
    }

    // Intro
    if (introState === 1) {
      introT = Math.max(0, Math.min(1, (now - introStart) / INTRO_DUR));
      if (introT > 0) {
        var e = backOut(introT);
        logoGroup.scale.set(e, e, e);
        rings.forEach(function (r) {
          var re = backOut(Math.min(1, introT * 1.4));
          r.scale.set(re, re, re);
        });
        var flash = Math.max(0, 1 - introT * 4);
        matBar.emissiveIntensity = baseEmissiveBar + flash * 2;
        matShape.emissiveIntensity = baseEmissiveShape + flash * 0.6;
      }
      if (introT >= 1) {
        introState = 2;
        matBar.emissiveIntensity = baseEmissiveBar;
        matShape.emissiveIntensity = baseEmissiveShape;
        logoGroup.scale.set(1, 1, 1);
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
      matBar.emissiveIntensity = baseEmissiveBar + hoverT * 0.5;
      matShape.emissiveIntensity = baseEmissiveShape + hoverT * 0.2;

      camera.fov = 45 - hoverT * 4;
      camera.updateProjectionMatrix();
    }

    // Orb rings
    orbAngle += 0.0015 + hoverT * 0.003;
    ring1.rotation.z = orbAngle;
    ring2.rotation.z = -orbAngle * 0.7;
    ring3.rotation.z = orbAngle * 0.5;

    var ringPulse = 0.15 + 0.05 * Math.sin(now * 0.0008) + hoverT * 0.1;
    rings.forEach(function (r) { r.material.opacity = Math.min(0.35, ringPulse); });

    // Particles
    var posArr = pGeo.attributes.position.array;
    for (var i = 0; i < PCOUNT; i++) {
      var pd = particleData[i];
      pd.angle += pd.speed * 0.016;

      if (hovering) {
        pd.absorbProgress = Math.min(MAX_ABSORB, pd.absorbProgress + 0.005 + Math.random() * 0.003);
      } else {
        pd.absorbProgress = Math.max(0, pd.absorbProgress - 0.015);
      }

      var ae = pd.absorbProgress * pd.absorbProgress;
      var r = pd.orbitR * ORB_RADIUS * (1 - ae * 0.55);
      pd.angle += pd.speed * 0.016 * ae * 2;

      var pos = orbitPos(pd.angle, pd.tiltX, pd.tiltY, pd.tiltZ, r);
      posArr[i * 3] = pos.x;
      posArr[i * 3 + 1] = pos.y;
      posArr[i * 3 + 2] = pos.z;
    }
    pGeo.attributes.position.needsUpdate = true;
    pMat.size = 0.22 + hoverT * 0.12;
    pMat.opacity = 0.55 + hoverT * 0.25;

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

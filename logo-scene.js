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
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x404040, 0.6));
  var keyLight = new THREE.PointLight(0xffffff, 1.2, 50);
  keyLight.position.set(3, 4, 8);
  scene.add(keyLight);
  var rimLight = new THREE.PointLight(0xa8ff00, 0.6, 40);
  rimLight.position.set(-4, -2, 6);
  scene.add(rimLight);
  var topLight = new THREE.DirectionalLight(0xffffff, 0.4);
  topLight.position.set(0, 5, 3);
  scene.add(topLight);

  /* ── Logo geometry from SVG polygon points ── */
  var CX = 960, CY = 960, S = 4.2 / 960;

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

  var layer1Pts = [1454.6,882, 625.1,882, 469.2,1035.9, 1298.7,1035.9];
  var layer2Pts = [331.3,960.5, 959.1,332.7, 1188.3,562, 1406.8,562, 1179.6,334.8, 958.6,113.7, 114.4,959, 428.2,1275.9, 1055.4,1275.9, 1211.3,1122.1, 492.9,1122.1];
  var layer3Pts = [1493,648.1, 862.1,648.1, 706.2,802, 1428.4,802, 1586.9,960.5, 959.1,1588.3, 849.7,1478.9, 732.9,1362.1, 514.4,1362.1, 739.7,1587.4, 958.6,1806.3, 1805.6,960.7];

  var extrudeSettings = {
    depth: 0.5,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.04,
    bevelSegments: 2
  };

  // Materials
  var matGreen = new THREE.MeshPhongMaterial({
    color: 0x6a9900,
    emissive: 0xa8ff00,
    emissiveIntensity: 0.35,
    specular: 0xd4ff00,
    shininess: 100,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide
  });
  var matWhite = new THREE.MeshPhongMaterial({
    color: 0xcccccc,
    emissive: 0xa8ff00,
    emissiveIntensity: 0.08,
    specular: 0xffffff,
    shininess: 80,
    transparent: true,
    opacity: 1,
    side: THREE.DoubleSide
  });

  var logoGroup = new THREE.Group();

  function createLayer(pts, material, zPos) {
    var shape = makeShape(pts);
    var geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    var mesh = new THREE.Mesh(geo, material);
    // Re-center after centering geometry
    var box = new THREE.Box3().setFromObject(mesh);
    var center = new THREE.Vector3();
    box.getCenter(center);
    mesh.position.z = zPos;
    return mesh;
  }

  var mesh1 = createLayer(layer1Pts, matGreen, 0.6);
  var mesh2 = createLayer(layer2Pts, matWhite, 0);
  var mesh3 = createLayer(layer3Pts, matWhite, -0.6);

  logoGroup.add(mesh1);
  logoGroup.add(mesh2);
  logoGroup.add(mesh3);
  scene.add(logoGroup);

  /* ── Particles ── */
  var PCOUNT = 35;
  var particleData = [];
  var positions = new Float32Array(PCOUNT * 3);
  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  // Glow texture
  var glowCanvas = document.createElement("canvas");
  glowCanvas.width = 32;
  glowCanvas.height = 32;
  var gctx = glowCanvas.getContext("2d");
  var grad = gctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(168,255,0,1)");
  grad.addColorStop(0.3, "rgba(168,255,0,0.4)");
  grad.addColorStop(1, "rgba(168,255,0,0)");
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 32, 32);
  var glowTex = new THREE.CanvasTexture(glowCanvas);

  var pMat = new THREE.PointsMaterial({
    map: glowTex,
    size: 0.25,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  var points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  var ORB_RADIUS = 5.5;
  for (var i = 0; i < PCOUNT; i++) {
    particleData.push({
      orbitR: 0.7 + Math.random() * 0.3,
      speed: (0.15 + Math.random() * 0.45) * (Math.random() < 0.5 ? 1 : -1),
      tiltX: (Math.random() - 0.5) * Math.PI * 0.9,
      tiltY: (Math.random() - 0.5) * Math.PI,
      tiltZ: Math.random() * Math.PI * 2,
      angle: Math.random() * Math.PI * 2,
      absorbProgress: 0,
      isLeader: i < 6 // first 6 are brighter leaders
    });
  }

  /* ── Orb rings ── */
  var rings = [];
  var RING_SEGMENTS = 96;
  function createRing(tiltX, tiltY) {
    var ringPts = [];
    for (var j = 0; j <= RING_SEGMENTS; j++) {
      var a = (j / RING_SEGMENTS) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(a) * ORB_RADIUS, Math.sin(a) * ORB_RADIUS, 0));
    }
    var rGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
    var rMat = new THREE.LineBasicMaterial({
      color: 0xa8ff00,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var line = new THREE.Line(rGeo, rMat);
    line.rotation.x = tiltX;
    line.rotation.y = tiltY;
    return line;
  }

  var ring1 = createRing(0.3, 0);
  var ring2 = createRing(Math.PI * 0.55, 0.4);
  var ring3 = createRing(Math.PI * 0.3, Math.PI * 0.6);
  rings.push(ring1, ring2, ring3);
  rings.forEach(function (r) { scene.add(r); });

  /* ── State ── */
  var hovering = false;
  var hoverT = 0;
  var introState = 0; // 0=waiting, 1=animating, 2=done
  var introT = 0;
  var introStart = 0;
  var INTRO_DUR = 900;
  var MAX_ABSORB = 0.75;
  var orbAngle = 0;

  // Start everything invisible
  logoGroup.scale.set(0, 0, 0);
  points.visible = false;
  rings.forEach(function (r) { r.scale.set(0, 0, 0); });

  /* ── Easing ── */
  function backOut(t) {
    return 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
  }

  /* ── Resize ── */
  function resize() {
    var rect = container.getBoundingClientRect();
    var w = rect.width;
    var h = rect.height;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ── Orbit math ── */
  function orbitPos(angle, tiltX, tiltY, tiltZ, radius) {
    var x = Math.cos(angle) * radius, y = Math.sin(angle) * radius, z = 0;
    var cx2 = Math.cos(tiltX), sx = Math.sin(tiltX);
    var y2 = y * cx2 - z * sx; z = y * sx + z * cx2; y = y2;
    var cy2 = Math.cos(tiltY), sy = Math.sin(tiltY);
    var x2 = x * cy2 + z * sy; z = -x * sy + z * cy2; x = x2;
    var cz = Math.cos(tiltZ), sz = Math.sin(tiltZ);
    x2 = x * cz - y * sz; y2 = x * sz + y * cz;
    return { x: x2, y: y2, z: z };
  }

  /* ── Render loop ── */
  function tick() {
    var now = performance.now();

    // Boot detection
    if (introState === 0 && document.body.classList.contains("loaded")) {
      introState = 1;
      introStart = now + 300; // slight delay after boot
      points.visible = true;
    }

    // Intro animation
    if (introState === 1) {
      introT = Math.max(0, Math.min(1, (now - introStart) / INTRO_DUR));
      if (introT <= 0) {
        // Still in delay
      } else {
        var e = backOut(introT);
        logoGroup.scale.set(e, e, e);
        // Rings expand
        rings.forEach(function (r) {
          var re = backOut(Math.min(1, introT * 1.3));
          r.scale.set(re, re, re);
        });
        // Flash: boost emissive at start
        var flash = Math.max(0, 1 - introT * 3);
        matGreen.emissiveIntensity = 0.35 + flash * 1.5;
        matWhite.emissiveIntensity = 0.08 + flash * 0.8;
      }
      if (introT >= 1) {
        introState = 2;
        matGreen.emissiveIntensity = 0.35;
        matWhite.emissiveIntensity = 0.08;
        logoGroup.scale.set(1, 1, 1);
        wrap.classList.add("intro-done");
      }
    }

    // Hover interpolation
    hoverT += ((hovering ? 1 : 0) - hoverT) * 0.05;
    hoverT = Math.max(0, Math.min(1, hoverT));

    if (introState === 2) {
      // Logo rotation
      logoGroup.rotation.y += 0.004;

      // Hover: slight scale, brighter emissive
      var sc = 1 + hoverT * 0.05;
      logoGroup.scale.set(sc, sc, sc);
      matGreen.emissiveIntensity = 0.35 + hoverT * 0.4;
      matWhite.emissiveIntensity = 0.08 + hoverT * 0.25;

      // Subtle camera perspective shift on hover
      camera.fov = 50 - hoverT * 5;
      camera.updateProjectionMatrix();
    }

    // Orb rings rotation
    orbAngle += 0.002 + hoverT * 0.004;
    ring1.rotation.z = orbAngle;
    ring2.rotation.z = -orbAngle * 0.7;
    ring3.rotation.z = orbAngle * 0.5;

    // Ring brightness pulse
    var ringPulse = 0.12 + 0.04 * Math.sin(now * 0.001) + hoverT * 0.12;
    rings.forEach(function (r) { r.material.opacity = Math.min(0.3, ringPulse); });

    // Update particles
    var posArr = pGeo.attributes.position.array;
    for (var i = 0; i < PCOUNT; i++) {
      var pd = particleData[i];
      pd.angle += pd.speed * 0.016;

      // Absorption
      if (hovering) {
        pd.absorbProgress = Math.min(MAX_ABSORB, pd.absorbProgress + 0.005 + Math.random() * 0.003);
      } else {
        pd.absorbProgress = Math.max(0, pd.absorbProgress - 0.015);
      }

      var ae = pd.absorbProgress * pd.absorbProgress;
      var r = pd.orbitR * ORB_RADIUS * (1 - ae * 0.6);
      pd.angle += pd.speed * 0.016 * ae * 2;

      var pos = orbitPos(pd.angle, pd.tiltX, pd.tiltY, pd.tiltZ, r);
      posArr[i * 3] = pos.x;
      posArr[i * 3 + 1] = pos.y;
      posArr[i * 3 + 2] = pos.z;
    }
    pGeo.attributes.position.needsUpdate = true;

    // Particle size increases slightly on hover
    pMat.size = 0.25 + hoverT * 0.15;
    pMat.opacity = 0.6 + hoverT * 0.2;

    // Render
    resize();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }

  /* ── Events ── */
  wrap.addEventListener("mouseenter", function () { hovering = true; });
  wrap.addEventListener("mouseleave", function () { hovering = false; });
  wrap.addEventListener("touchstart", function () { hovering = true; }, { passive: true });
  wrap.addEventListener("touchend", function () { hovering = false; });

  requestAnimationFrame(tick);
})();

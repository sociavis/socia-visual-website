/* Logo 3D Scene — Extruded logo centered in two orbital rings with electrons */
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
  var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
  // Angled camera — looks slightly to the right
  camera.position.set(1.5, 0.5, 13);
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
  var CX = 960, CY = 960, S = 4.5 / 960;
  var DEPTH = 0.35;

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

  /* ── Two orbital rings — centered on the logo ── */
  var RING_RADIUS = 5.2;
  var RING_SEG = 128;

  function createRing(tiltX, tiltY) {
    var pts = [];
    for (var j = 0; j <= RING_SEG; j++) {
      var a = (j / RING_SEG) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * RING_RADIUS, Math.sin(a) * RING_RADIUS, 0));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({
      color: 0xa8ff00,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var line = new THREE.Line(geo, mat);
    line.rotation.x = tiltX;
    line.rotation.y = tiltY;
    return { line: line, mat: mat, tiltX: tiltX, tiltY: tiltY };
  }

  // Two rings at different tilts, logo sits in the center
  var ringA = createRing(1.2, 0.3);   // tilted ~70° from horizontal
  var ringB = createRing(0.4, -0.5);  // tilted ~25° the other way
  scene.add(ringA.line);
  scene.add(ringB.line);

  /* ── Electrons orbiting on each ring ── */
  // Ring A: 5 electrons, Ring B: 3 electrons, different directions
  var electronDefs = [
    { ring: ringA, count: 5, speed: 0.7, dir: 1 },
    { ring: ringB, count: 3, speed: 0.5, dir: -1 }
  ];

  // Glow texture
  var gc = document.createElement("canvas");
  gc.width = 64; gc.height = 64;
  var gx = gc.getContext("2d");
  var gg = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gg.addColorStop(0, "rgba(168,255,0,1)");
  gg.addColorStop(0.1, "rgba(168,255,0,0.8)");
  gg.addColorStop(0.35, "rgba(168,255,0,0.2)");
  gg.addColorStop(1, "rgba(168,255,0,0)");
  gx.fillStyle = gg;
  gx.fillRect(0, 0, 64, 64);
  var glowTex = new THREE.CanvasTexture(gc);

  var allElectrons = [];
  var totalE = 0;
  electronDefs.forEach(function (def) { totalE += def.count; });

  var ePositions = new Float32Array(totalE * 3);
  var eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute("position", new THREE.BufferAttribute(ePositions, 3));

  var eMat = new THREE.PointsMaterial({
    map: glowTex,
    size: 0.45,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  var ePoints = new THREE.Points(eGeo, eMat);
  scene.add(ePoints);

  var eIdx = 0;
  electronDefs.forEach(function (def) {
    for (var i = 0; i < def.count; i++) {
      allElectrons.push({
        ring: def.ring,
        angle: (i / def.count) * Math.PI * 2,
        speed: def.speed + (Math.random() - 0.5) * 0.15,
        dir: def.dir,
        idx: eIdx++
      });
    }
  });

  // Get world position of an electron on its ring
  function electronWorldPos(el, radius) {
    var x = Math.cos(el.angle) * radius;
    var y = Math.sin(el.angle) * radius;
    var z = 0;
    var r = el.ring;
    // Apply ring tilt
    var cx1 = Math.cos(r.tiltX), sx1 = Math.sin(r.tiltX);
    var y2 = y * cx1 - z * sx1; z = y * sx1 + z * cx1; y = y2;
    var cy1 = Math.cos(r.tiltY), sy1 = Math.sin(r.tiltY);
    var x2 = x * cy1 + z * sy1; z = -x * sy1 + z * cy1; x = x2;
    // Apply ring's live z-rotation
    var rz = r.line.rotation.z;
    var cz = Math.cos(rz), sz = Math.sin(rz);
    x2 = x * cz - y * sz; y2 = x * sz + y * cz;
    return { x: x2, y: y2, z: z };
  }

  /* ── State ── */
  var hovering = false;
  var hoverT = 0;
  var introState = 0;
  var introT = 0;
  var introStart = 0;
  var INTRO_DUR = 800;
  var time = 0;

  // Camera drift state
  var camBaseX = 1.5, camBaseY = 0.5, camBaseZ = 13;

  logoGroup.scale.set(0, 0, 0);
  ePoints.visible = false;
  ringA.line.scale.set(0, 0, 0);
  ringB.line.scale.set(0, 0, 0);

  function backOut(t) {
    return 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
  }

  var lastW = 0, lastH = 0;
  function resize() {
    var rect = wrap.getBoundingClientRect();
    var w = Math.round(rect.width * 1.6);
    var h = Math.round(rect.height * 1.6);
    if (w === lastW && h === lastH) return;
    lastW = w; lastH = h;
    cvs.style.width = w + "px";
    cvs.style.height = h + "px";
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  /* ── Render loop ── */
  function tick() {
    var now = performance.now();
    time = now * 0.001; // seconds

    if (introState === 0 && document.body.classList.contains("loaded")) {
      introState = 1;
      introStart = now + 200;
      ePoints.visible = true;
    }

    // Intro
    if (introState === 1) {
      introT = Math.max(0, Math.min(1, (now - introStart) / INTRO_DUR));
      if (introT > 0) {
        var e = backOut(introT);
        logoGroup.scale.set(e, e, e);
        var re = backOut(Math.min(1, introT * 1.3));
        ringA.line.scale.set(re, re, re);
        ringB.line.scale.set(re, re, re);
        var flash = Math.max(0, 1 - introT * 4);
        matBar.emissiveIntensity = 0.5 + flash * 2;
        matShape.emissiveIntensity = 0.13 + flash * 0.5;
      }
      if (introT >= 1) {
        introState = 2;
        matBar.emissiveIntensity = 0.5;
        matShape.emissiveIntensity = 0.13;
        logoGroup.scale.set(1, 1, 1);
        ringA.line.scale.set(1, 1, 1);
        ringB.line.scale.set(1, 1, 1);
        wrap.classList.add("intro-done");
      }
    }

    // Hover
    hoverT += ((hovering ? 1 : 0) - hoverT) * 0.05;
    hoverT = Math.max(0, Math.min(1, hoverT));

    if (introState === 2) {
      // Logo slow rotation
      logoGroup.rotation.y += 0.003;

      var sc = 1 + hoverT * 0.04;
      logoGroup.scale.set(sc, sc, sc);
      matBar.emissiveIntensity = 0.5 + hoverT * 0.4;
      matShape.emissiveIntensity = 0.13 + hoverT * 0.18;
    }

    // Ambient camera drift — slow figure-8 / lissajous movement
    var driftX = Math.sin(time * 0.15) * 0.4;
    var driftY = Math.sin(time * 0.12) * 0.25;
    var driftZ = Math.sin(time * 0.08) * 0.3;
    camera.position.set(
      camBaseX + driftX,
      camBaseY + driftY,
      camBaseZ + driftZ
    );
    // Look target also drifts slightly
    camera.lookAt(
      driftX * 0.15,
      driftY * 0.1,
      0
    );
    // FOV tightens slightly on hover
    camera.fov = 48 - hoverT * 3;
    camera.updateProjectionMatrix();

    // Ring rotation — opposite directions, continuous
    ringA.line.rotation.z += 0.004;
    ringB.line.rotation.z -= 0.003;

    // Ring hover effect — brighten, slight scale pulse
    var ringBaseOpacity = 0.22;
    var ringHoverOpacity = ringBaseOpacity + hoverT * 0.15;
    var ringPulse = 1 + hoverT * 0.06 * Math.sin(time * 3);
    ringA.mat.opacity = Math.min(0.45, ringHoverOpacity + 0.03 * Math.sin(time * 0.8));
    ringB.mat.opacity = Math.min(0.45, ringHoverOpacity + 0.03 * Math.sin(time * 0.8 + 1));
    if (introState === 2) {
      var rsc = 1 + hoverT * 0.03 * Math.sin(time * 2.5);
      ringA.line.scale.set(1 + rsc * 0.01, 1 + rsc * 0.01, 1);
      ringB.line.scale.set(1 - rsc * 0.01, 1 - rsc * 0.01, 1);
    }

    // Update electrons — orbit along their ring paths
    var posArr = eGeo.attributes.position.array;
    for (var i = 0; i < allElectrons.length; i++) {
      var el = allElectrons[i];
      el.angle += el.speed * el.dir * 0.012;

      var pos = electronWorldPos(el, RING_RADIUS);
      posArr[el.idx * 3] = pos.x;
      posArr[el.idx * 3 + 1] = pos.y;
      posArr[el.idx * 3 + 2] = pos.z;
    }
    eGeo.attributes.position.needsUpdate = true;

    // Electron brightness on hover
    eMat.opacity = 0.8 + hoverT * 0.15;
    eMat.size = 0.45 + hoverT * 0.1;

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

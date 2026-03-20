/* Logo 3D Scene — Atom model: extruded logo nucleus + electron orbits */
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
  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  /* ── Lighting ── */
  scene.add(new THREE.AmbientLight(0x404040, 1.0));
  var keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
  keyLight.position.set(3, 4, 6);
  scene.add(keyLight);
  var rimLight = new THREE.PointLight(0xa8ff00, 0.5, 30);
  rimLight.position.set(-3, -2, 5);
  scene.add(rimLight);
  var backLight = new THREE.PointLight(0xa8ff00, 0.25, 20);
  backLight.position.set(0, 0, -4);
  scene.add(backLight);

  /* ── Logo geometry ── */
  var CX = 960, CY = 960, S = 4.5 / 960;
  var DEPTH = 0.22;

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
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelSegments: 2
  };

  var matBar = new THREE.MeshPhongMaterial({
    color: 0x4a7700,
    emissive: 0xa8ff00,
    emissiveIntensity: 0.45,
    specular: 0xa8ff00,
    shininess: 100,
    side: THREE.DoubleSide
  });
  var matShape = new THREE.MeshPhongMaterial({
    color: 0x3a3a3a,
    emissive: 0xa8ff00,
    emissiveIntensity: 0.1,
    specular: 0x888888,
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

  var mesh1 = createLayer(layer1Pts, matBar, 0.25);
  var mesh2 = createLayer(layer2Pts, matShape, 0);
  var mesh3 = createLayer(layer3Pts, matShape, -0.25);
  logoGroup.add(mesh1, mesh2, mesh3);
  scene.add(logoGroup);

  /* ── Nucleus glow (center sphere) ── */
  var glowMat = new THREE.MeshBasicMaterial({
    color: 0xa8ff00,
    transparent: true,
    opacity: 0.04,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  var glowSphere = new THREE.Mesh(new THREE.SphereGeometry(2, 16, 16), glowMat);
  scene.add(glowSphere);

  /* ── Atom orbit rings ── */
  var ORB_RADIUS = 4.8;
  var RING_SEG = 128;
  var ringDefs = [
    { tiltX: 0.3, tiltY: 0.1 },
    { tiltX: Math.PI * 0.45, tiltY: 0.55 },
    { tiltX: Math.PI * 0.25, tiltY: Math.PI * 0.7 }
  ];
  var rings = [];

  ringDefs.forEach(function (def) {
    var pts = [];
    for (var j = 0; j <= RING_SEG; j++) {
      var a = (j / RING_SEG) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * ORB_RADIUS, Math.sin(a) * ORB_RADIUS, 0));
    }
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    var mat = new THREE.LineBasicMaterial({
      color: 0xa8ff00,
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var line = new THREE.Line(geo, mat);
    line.rotation.x = def.tiltX;
    line.rotation.y = def.tiltY;
    scene.add(line);
    rings.push({ line: line, mat: mat, tiltX: def.tiltX, tiltY: def.tiltY });
  });

  /* ── Electrons — particles that orbit ALONG the rings ── */
  var ELECTRONS_PER_RING = 4;
  var TOTAL_ELECTRONS = ringDefs.length * ELECTRONS_PER_RING;
  var electronData = [];

  // Glow texture
  var gc = document.createElement("canvas");
  gc.width = 32; gc.height = 32;
  var gx = gc.getContext("2d");
  var gg = gx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gg.addColorStop(0, "rgba(168,255,0,1)");
  gg.addColorStop(0.15, "rgba(168,255,0,0.6)");
  gg.addColorStop(0.5, "rgba(168,255,0,0.1)");
  gg.addColorStop(1, "rgba(168,255,0,0)");
  gx.fillStyle = gg;
  gx.fillRect(0, 0, 32, 32);
  var glowTex = new THREE.CanvasTexture(gc);

  var ePositions = new Float32Array(TOTAL_ELECTRONS * 3);
  var eSizes = new Float32Array(TOTAL_ELECTRONS);
  var eGeo = new THREE.BufferGeometry();
  eGeo.setAttribute("position", new THREE.BufferAttribute(ePositions, 3));

  var eMat = new THREE.PointsMaterial({
    map: glowTex,
    size: 0.35,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  });
  var ePoints = new THREE.Points(eGeo, eMat);
  scene.add(ePoints);

  // Assign electrons to rings, evenly spaced with slight variation
  for (var ri = 0; ri < ringDefs.length; ri++) {
    for (var ei = 0; ei < ELECTRONS_PER_RING; ei++) {
      var baseAngle = (ei / ELECTRONS_PER_RING) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      var speed = 0.6 + Math.random() * 0.4;
      electronData.push({
        ringIndex: ri,
        angle: baseAngle,
        speed: speed,
        absorbProgress: 0
      });
    }
  }

  // Convert an angle on a ring to a world position
  function ringPosition(ringIdx, angle, radius) {
    var x = Math.cos(angle) * radius;
    var y = Math.sin(angle) * radius;
    var z = 0;
    var def = ringDefs[ringIdx];

    // Apply ring rotation
    var cx1 = Math.cos(def.tiltX), sx1 = Math.sin(def.tiltX);
    var y2 = y * cx1 - z * sx1; z = y * sx1 + z * cx1; y = y2;
    var cy1 = Math.cos(def.tiltY), sy1 = Math.sin(def.tiltY);
    var x2 = x * cy1 + z * sy1; z = -x * sy1 + z * cy1; x = x2;

    // Also apply the ring's z-rotation (orbAngle-based)
    var rz = rings[ringIdx].line.rotation.z;
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
  var MAX_ABSORB = 0.7;
  var orbAngle = 0;

  logoGroup.scale.set(0, 0, 0);
  ePoints.visible = false;
  rings.forEach(function (r) { r.line.scale.set(0, 0, 0); });
  glowSphere.scale.set(0, 0, 0);

  function backOut(t) {
    return 1 + 2.7 * Math.pow(t - 1, 3) + 1.7 * Math.pow(t - 1, 2);
  }

  var lastW = 0, lastH = 0;
  function resize() {
    var rect = wrap.getBoundingClientRect();
    // Canvas 1.5x the container so orbits aren't clipped
    var w = Math.round(rect.width * 1.5);
    var h = Math.round(rect.height * 1.5);
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
        glowSphere.scale.set(e, e, e);
        rings.forEach(function (r) {
          var re = backOut(Math.min(1, introT * 1.3));
          r.line.scale.set(re, re, re);
        });
        var flash = Math.max(0, 1 - introT * 4);
        matBar.emissiveIntensity = 0.45 + flash * 2;
        matShape.emissiveIntensity = 0.1 + flash * 0.5;
        glowMat.opacity = 0.04 + flash * 0.15;
      }
      if (introT >= 1) {
        introState = 2;
        matBar.emissiveIntensity = 0.45;
        matShape.emissiveIntensity = 0.1;
        glowMat.opacity = 0.04;
        logoGroup.scale.set(1, 1, 1);
        glowSphere.scale.set(1, 1, 1);
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
      matBar.emissiveIntensity = 0.45 + hoverT * 0.5;
      matShape.emissiveIntensity = 0.1 + hoverT * 0.2;
      glowMat.opacity = 0.04 + hoverT * 0.08;

      camera.fov = 50 - hoverT * 4;
      camera.updateProjectionMatrix();
    }

    // Ring rotation (slow, continuous)
    orbAngle += 0.0012 + hoverT * 0.003;
    rings[0].line.rotation.z = orbAngle;
    rings[1].line.rotation.z = -orbAngle * 0.8;
    rings[2].line.rotation.z = orbAngle * 0.6;

    // Ring pulse
    var rp = 0.18 + 0.05 * Math.sin(now * 0.0008) + hoverT * 0.1;
    rings.forEach(function (r) { r.mat.opacity = Math.min(0.35, rp); });

    // Update electrons — travel along their assigned ring
    var posArr = eGeo.attributes.position.array;
    for (var i = 0; i < TOTAL_ELECTRONS; i++) {
      var ed = electronData[i];
      ed.angle += ed.speed * 0.012;

      // Absorption on hover
      if (hovering) {
        ed.absorbProgress = Math.min(MAX_ABSORB, ed.absorbProgress + 0.004 + Math.random() * 0.003);
      } else {
        ed.absorbProgress = Math.max(0, ed.absorbProgress - 0.012);
      }

      var ae = ed.absorbProgress * ed.absorbProgress;
      var orbitR = ORB_RADIUS * (1 - ae * 0.55);
      // Speed up as they spiral in
      ed.angle += ed.speed * 0.012 * ae * 3;

      var pos = ringPosition(ed.ringIndex, ed.angle, orbitR);
      posArr[i * 3] = pos.x;
      posArr[i * 3 + 1] = pos.y;
      posArr[i * 3 + 2] = pos.z;
    }
    eGeo.attributes.position.needsUpdate = true;
    eMat.size = 0.35 + hoverT * 0.15;
    eMat.opacity = 0.7 + hoverT * 0.2;

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

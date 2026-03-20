/* Logo Particle Orb — subtle orbiting particles with sphere boundary */
(function () {
  var canvas = document.getElementById("logoParticles");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var wrap = document.getElementById("logo3d");
  if (!wrap) return;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, cx, cy;
  var hovering = false;
  var hoverStrength = 0;
  var introProgress = 0;
  var introStarted = false;
  var introStart = 0;
  var INTRO_DUR = 2500;
  var PARTICLE_COUNT = 30;
  var particles = [];
  var MAX_ABSORB = 0.75;
  var orbRotation = 0;

  function resize() {
    var rect = wrap.getBoundingClientRect();
    W = rect.width * 1.6;
    H = rect.height * 1.6;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2;
    cy = H / 2;
  }

  function createParticle() {
    var orbitRadius = 0.5 + Math.random() * 0.35;
    var speed = (0.15 + Math.random() * 0.4) * (Math.random() < 0.5 ? 1 : -1);
    var tiltX = (Math.random() - 0.5) * Math.PI * 0.9;
    var tiltY = (Math.random() - 0.5) * Math.PI;
    var tiltZ = Math.random() * Math.PI * 2;
    var phase = Math.random() * Math.PI * 2;
    var size = 0.4 + Math.random() * 0.8;
    var brightness = 0.15 + Math.random() * 0.35;
    return {
      orbitRadius: orbitRadius,
      baseOrbitRadius: orbitRadius,
      speed: speed,
      tiltX: tiltX, tiltY: tiltY, tiltZ: tiltZ,
      phase: phase, angle: phase,
      size: size, baseSize: size,
      brightness: brightness,
      baseBrightness: brightness,
      absorbProgress: 0,
      trail: [],
      x: 0, y: 0, z: 0
    };
  }

  function init() {
    resize();
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle());
    }
  }

  function orbitPosition(angle, tiltX, tiltY, tiltZ, radius) {
    var x = Math.cos(angle) * radius, y = Math.sin(angle) * radius, z = 0;
    var cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
    var y2 = y * cosX - z * sinX; z = y * sinX + z * cosX; y = y2;
    var cosY = Math.cos(tiltY), sinY = Math.sin(tiltY);
    var x2 = x * cosY + z * sinY; z = -x * sinY + z * cosY; x = x2;
    var cosZ = Math.cos(tiltZ), sinZ = Math.sin(tiltZ);
    x2 = x * cosZ - y * sinZ; y2 = x * sinZ + y * cosZ;
    return { x: x2, y: y2, z: z };
  }

  function drawOrb(radius, alpha, time) {
    ctx.save();
    var rings = 3;
    var segments = 64;
    var rotY = orbRotation;
    var rotX = 0.3;

    for (var r = 0; r < rings; r++) {
      var ringTilt = (r / rings) * Math.PI;
      ctx.beginPath();
      for (var j = 0; j <= segments; j++) {
        var angle = (j / segments) * Math.PI * 2;
        var px = Math.cos(angle) * radius, py = Math.sin(angle) * radius, pz = 0;

        var cosRT = Math.cos(ringTilt), sinRT = Math.sin(ringTilt);
        var px2 = px * cosRT + pz * sinRT; pz = -px * sinRT + pz * cosRT; px = px2;

        var cosRY = Math.cos(rotY), sinRY = Math.sin(rotY);
        px2 = px * cosRY + pz * sinRY; pz = -px * sinRY + pz * cosRY; px = px2;

        var cosRX = Math.cos(rotX), sinRX = Math.sin(rotX);
        var py2 = py * cosRX - pz * sinRX; pz = py * sinRX + pz * cosRX; py = py2;

        if (j === 0) ctx.moveTo(cx + px, cy + py);
        else ctx.lineTo(cx + px, cy + py);
      }
      var baseA = 0.04 + 0.02 * Math.sin(time * 0.0008 + r);
      var hoverA = hoverStrength * 0.06;
      ctx.strokeStyle = "rgba(168,255,0," + (alpha * Math.min(0.15, baseA + hoverA)).toFixed(3) + ")";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  function tick(now) {
    if (!introStarted) {
      if (document.querySelector(".hero-logo.intro-done")) {
        introStarted = true;
        introStart = now;
      }
    }
    if (introStarted && introProgress < 1) {
      introProgress = Math.min(1, (now - introStart) / INTRO_DUR);
      introProgress = 1 - Math.pow(1 - introProgress, 3);
    }

    hoverStrength += ((hovering ? 1 : 0) - hoverStrength) * 0.04;
    hoverStrength = Math.max(0, Math.min(1, hoverStrength));
    orbRotation += 0.002 + hoverStrength * 0.005;

    var baseRadius = Math.min(W, H) / 2;
    var orbRadius = baseRadius * 0.85;

    ctx.clearRect(0, 0, W, H);
    if (introProgress <= 0) { requestAnimationFrame(tick); return; }

    var ga = introProgress;

    drawOrb(orbRadius, ga, now);

    // Update particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.angle += p.speed * 0.016;

      if (hovering) {
        p.absorbProgress = Math.min(MAX_ABSORB, p.absorbProgress + 0.005 + Math.random() * 0.003);
      } else {
        p.absorbProgress = Math.max(0, p.absorbProgress - 0.018);
      }

      var ae = p.absorbProgress * p.absorbProgress;
      var cr = p.baseOrbitRadius * (1 - ae * 0.6);
      p.angle += p.speed * 0.016 * ae * 2;

      var pos = orbitPosition(p.angle, p.tiltX, p.tiltY, p.tiltZ, cr * baseRadius);
      p.x = cx + pos.x;
      p.y = cy + pos.y;
      p.z = pos.z;
      p.size = p.baseSize * (1 + ae * 0.8);
      p.brightness = Math.min(0.8, p.baseBrightness * (1 + ae * 1.2));

      if (p.trail.length > 5) p.trail.shift();
      p.trail.push({ x: p.x, y: p.y });
    }

    particles.sort(function (a, b) { return a.z - b.z; });

    for (i = 0; i < particles.length; i++) {
      var p = particles[i];
      var alpha = ga * Math.min(1, p.brightness);
      var df = 0.3 + 0.7 * ((p.z / baseRadius + 1) / 2);
      alpha *= df;

      // Subtle trail only during absorption
      if (p.trail.length > 1 && p.absorbProgress > 0.15) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (var t = 1; t < p.trail.length; t++) ctx.lineTo(p.trail[t].x, p.trail[t].y);
        ctx.strokeStyle = "rgba(168,255,0," + (alpha * 0.15 * (p.absorbProgress / MAX_ABSORB)).toFixed(3) + ")";
        ctx.lineWidth = p.size * 0.3;
        ctx.stroke();
      }

      // Small soft glow
      var gs = p.size * (1.5 + (p.absorbProgress / MAX_ABSORB) * 2);
      var grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gs);
      grd.addColorStop(0, "rgba(168,255,0," + (alpha * 0.5).toFixed(3) + ")");
      grd.addColorStop(0.5, "rgba(168,255,0," + (alpha * 0.08).toFixed(3) + ")");
      grd.addColorStop(1, "rgba(168,255,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(p.x - gs, p.y - gs, gs * 2, gs * 2);

      // Tiny core dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.2, p.size * 0.35), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(168,255,0," + (alpha * 0.7).toFixed(3) + ")";
      ctx.fill();
    }

    // Very subtle center glow on hover
    if (hoverStrength > 0.05) {
      var cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.35);
      var ca = Math.min(0.1, hoverStrength * 0.1) * ga;
      cg.addColorStop(0, "rgba(168,255,0," + ca.toFixed(3) + ")");
      cg.addColorStop(0.6, "rgba(168,255,0," + (ca * 0.15).toFixed(3) + ")");
      cg.addColorStop(1, "rgba(168,255,0,0)");
      ctx.fillStyle = cg;
      ctx.fillRect(0, 0, W, H);
    }

    requestAnimationFrame(tick);
  }

  wrap.addEventListener("mouseenter", function () { hovering = true; });
  wrap.addEventListener("mouseleave", function () { hovering = false; });
  wrap.addEventListener("touchstart", function () { hovering = true; }, { passive: true });
  wrap.addEventListener("touchend", function () { hovering = false; });

  window.addEventListener("resize", resize);
  init();
  requestAnimationFrame(tick);
})();

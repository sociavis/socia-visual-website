/* Logo Particle Orb — orbiting particles with sphere boundary + absorption hover */
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
  var PARTICLE_COUNT = 70;
  var particles = [];
  var MAX_ABSORB = 0.82; // cap absorption so particles never fully vanish
  var orbRotation = 0; // slow rotation for the orb wireframe

  function resize() {
    var rect = wrap.getBoundingClientRect();
    // Canvas is 2x the logo container to allow wide orbits
    W = rect.width * 2;
    H = rect.height * 2;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2;
    cy = H / 2;
  }

  function createParticle() {
    var orbitRadius = 0.52 + Math.random() * 0.4; // wider spread: 0.52–0.92 of half-size
    var speed = (0.2 + Math.random() * 0.6) * (Math.random() < 0.5 ? 1 : -1);
    var tiltX = (Math.random() - 0.5) * Math.PI * 0.9;
    var tiltY = (Math.random() - 0.5) * Math.PI;
    var tiltZ = Math.random() * Math.PI * 2;
    var phase = Math.random() * Math.PI * 2;
    var size = 0.8 + Math.random() * 1.8;
    var brightness = 0.3 + Math.random() * 0.7;
    return {
      orbitRadius: orbitRadius,
      baseOrbitRadius: orbitRadius,
      speed: speed,
      tiltX: tiltX,
      tiltY: tiltY,
      tiltZ: tiltZ,
      phase: phase,
      angle: phase,
      size: size,
      baseSize: size,
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
    var x = Math.cos(angle) * radius;
    var y = Math.sin(angle) * radius;
    var z = 0;

    var cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
    var y2 = y * cosX - z * sinX;
    var z2 = y * sinX + z * cosX;
    y = y2; z = z2;

    var cosY = Math.cos(tiltY), sinY = Math.sin(tiltY);
    var x2 = x * cosY + z * sinY;
    z2 = -x * sinY + z * cosY;
    x = x2; z = z2;

    var cosZ = Math.cos(tiltZ), sinZ = Math.sin(tiltZ);
    x2 = x * cosZ - y * sinZ;
    y2 = x * sinZ + y * cosZ;
    x = x2; y = y2;

    return { x: x, y: y, z: z };
  }

  // Draw a 3D wireframe sphere (orb boundary)
  function drawOrb(radius, alpha, time) {
    ctx.save();
    ctx.globalAlpha = alpha;

    var rings = 3;
    var segments = 48;
    var rotY = orbRotation;
    var rotX = 0.3; // slight tilt so rings don't overlap

    for (var r = 0; r < rings; r++) {
      var ringTiltExtra = (r / rings) * Math.PI; // spread rings across axes
      ctx.beginPath();
      for (var j = 0; j <= segments; j++) {
        var angle = (j / segments) * Math.PI * 2;
        var px = Math.cos(angle) * radius;
        var py = Math.sin(angle) * radius;
        var pz = 0;

        // Rotate ring around its own axis
        var cosRT = Math.cos(ringTiltExtra), sinRT = Math.sin(ringTiltExtra);
        var px2 = px * cosRT + pz * sinRT;
        pz = -px * sinRT + pz * cosRT;
        px = px2;

        // Global rotation Y
        var cosRY = Math.cos(rotY), sinRY = Math.sin(rotY);
        px2 = px * cosRY + pz * sinRY;
        pz = -px * sinRY + pz * cosRY;
        px = px2;

        // Global tilt X
        var cosRX = Math.cos(rotX), sinRX = Math.sin(rotX);
        var py2 = py * cosRX - pz * sinRX;
        pz = py * sinRX + pz * cosRX;
        py = py2;

        // Depth fade for this point
        var depthAlpha = 0.3 + 0.7 * ((pz / radius + 1) / 2);
        var sx = cx + px;
        var sy = cy + py;

        if (j === 0) {
          ctx.moveTo(sx, sy);
        } else {
          ctx.lineTo(sx, sy);
        }
      }
      // Pulsing brightness
      var pulseA = 0.08 + 0.04 * Math.sin(time * 0.001 + r);
      var hoverBoost = hoverStrength * 0.12;
      ctx.strokeStyle = "rgba(168,255,0," + Math.min(0.3, pulseA + hoverBoost).toFixed(3) + ")";
      ctx.lineWidth = 0.5 + hoverStrength * 0.5;
      ctx.stroke();
    }

    ctx.restore();
  }

  function tick(now) {
    if (!introStarted) {
      var check = document.querySelector(".hero-logo.intro-done");
      if (check) {
        introStarted = true;
        introStart = now;
      }
    }

    if (introStarted && introProgress < 1) {
      introProgress = Math.min(1, (now - introStart) / INTRO_DUR);
      introProgress = 1 - Math.pow(1 - introProgress, 3);
    }

    // Hover interpolation — clamped to [0, 1]
    var hoverTarget = hovering ? 1 : 0;
    hoverStrength += (hoverTarget - hoverStrength) * 0.04;
    hoverStrength = Math.max(0, Math.min(1, hoverStrength));

    orbRotation += 0.003 + hoverStrength * 0.008;

    var dt = 0.016;
    var halfW = W / 2;
    var halfH = H / 2;
    var baseRadius = Math.min(halfW, halfH);
    var orbRadius = baseRadius * 0.92; // orb sits at the outer edge of particle field

    ctx.clearRect(0, 0, W, H);
    if (introProgress <= 0) {
      requestAnimationFrame(tick);
      return;
    }

    var globalAlpha = introProgress;

    // Draw orb boundary behind particles
    drawOrb(orbRadius, globalAlpha, now);

    // Update particles
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      p.angle += p.speed * dt;

      // Absorption — capped at MAX_ABSORB
      if (hovering) {
        p.absorbProgress = Math.min(MAX_ABSORB, p.absorbProgress + 0.006 + Math.random() * 0.004);
      } else {
        p.absorbProgress = Math.max(0, p.absorbProgress - 0.02);
      }

      var absorbEase = p.absorbProgress * p.absorbProgress;
      var currentRadius = p.baseOrbitRadius * (1 - absorbEase * 0.7);
      var speedMult = 1 + absorbEase * 2.5;
      p.angle += p.speed * dt * (speedMult - 1);

      var pos = orbitPosition(p.angle, p.tiltX, p.tiltY, p.tiltZ, currentRadius * baseRadius);

      p.x = cx + pos.x;
      p.y = cy + pos.y;
      p.z = pos.z;

      // Capped size and brightness
      p.size = p.baseSize * (1 + absorbEase * 1.2);
      p.brightness = Math.min(1.5, p.baseBrightness * (1 + absorbEase * 1.5));

      if (p.trail.length > 6) p.trail.shift();
      p.trail.push({ x: p.x, y: p.y });
    }

    // Sort by z (back to front)
    particles.sort(function (a, b) { return a.z - b.z; });

    // Draw particles
    for (i = 0; i < particles.length; i++) {
      var p = particles[i];

      var alpha = globalAlpha * Math.min(1, p.brightness);
      var depthFade = 0.35 + 0.65 * ((p.z / baseRadius + 1) / 2);
      alpha *= depthFade;

      // Trail during absorption
      if (p.trail.length > 1 && p.absorbProgress > 0.08) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (var t = 1; t < p.trail.length; t++) {
          ctx.lineTo(p.trail[t].x, p.trail[t].y);
        }
        ctx.strokeStyle = "rgba(168,255,0," + (alpha * 0.25 * (p.absorbProgress / MAX_ABSORB)).toFixed(3) + ")";
        ctx.lineWidth = p.size * 0.4;
        ctx.stroke();
      }

      // Particle glow
      var glowSize = p.size * (2 + (p.absorbProgress / MAX_ABSORB) * 3);
      var grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
      grd.addColorStop(0, "rgba(168,255,0," + (alpha * 0.7).toFixed(3) + ")");
      grd.addColorStop(0.4, "rgba(168,255,0," + (alpha * 0.15).toFixed(3) + ")");
      grd.addColorStop(1, "rgba(168,255,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(p.x - glowSize, p.y - glowSize, glowSize * 2, glowSize * 2);

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.3, p.size * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(168,255,0," + alpha.toFixed(3) + ")";
      ctx.fill();
    }

    // Central glow — capped
    if (hoverStrength > 0.01) {
      var coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.45);
      var ga = Math.min(0.18, hoverStrength * 0.18) * globalAlpha;
      coreGlow.addColorStop(0, "rgba(168,255,0," + ga.toFixed(3) + ")");
      coreGlow.addColorStop(0.5, "rgba(168,255,0," + (ga * 0.25).toFixed(3) + ")");
      coreGlow.addColorStop(1, "rgba(168,255,0,0)");
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, W, H);
    }

    // Spark bursts — capped frequency
    if (hoverStrength > 0.4 && Math.random() < 0.1) {
      var sparkAngle = Math.random() * Math.PI * 2;
      var sparkDist = baseRadius * (0.05 + Math.random() * 0.12);
      var sx = cx + Math.cos(sparkAngle) * sparkDist;
      var sy = cy + Math.sin(sparkAngle) * sparkDist;
      var sparkGrd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 3.5);
      sparkGrd.addColorStop(0, "rgba(212,255,0," + (0.7 * globalAlpha).toFixed(3) + ")");
      sparkGrd.addColorStop(1, "rgba(168,255,0,0)");
      ctx.fillStyle = sparkGrd;
      ctx.fillRect(sx - 4, sy - 4, 8, 8);
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

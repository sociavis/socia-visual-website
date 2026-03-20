/* Logo Particle Orb — orbiting particles that get absorbed on hover */
(function () {
  var canvas = document.getElementById("logoParticles");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  var wrap = document.getElementById("logo3d");
  if (!wrap) return;

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var W, H, cx, cy;
  var hovering = false;
  var hoverStrength = 0; // 0 = idle, 1 = fully charged
  var introProgress = 0;
  var introStarted = false;
  var introStart = 0;
  var INTRO_DUR = 2500;
  var PARTICLE_COUNT = 60;
  var particles = [];

  function resize() {
    var rect = wrap.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2;
    cy = H / 2;
  }

  // Each particle orbits on a random tilted axis
  function createParticle(i) {
    var orbitRadius = 0.38 + Math.random() * 0.22; // as fraction of half-size
    var speed = (0.3 + Math.random() * 0.7) * (Math.random() < 0.5 ? 1 : -1);
    // Random orbit tilt — axis defined by two angles
    var tiltX = (Math.random() - 0.5) * Math.PI * 0.8;
    var tiltY = (Math.random() - 0.5) * Math.PI;
    var tiltZ = Math.random() * Math.PI * 2;
    var phase = Math.random() * Math.PI * 2;
    var size = 1 + Math.random() * 2;
    var brightness = 0.4 + Math.random() * 0.6;
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
      absorbed: false,
      absorbProgress: 0,
      // Trail
      trail: [],
      // For depth sorting
      z: 0
    };
  }

  function init() {
    resize();
    particles = [];
    for (var i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(createParticle(i));
    }
  }

  // Rotate a point on a unit circle by the orbit's tilt
  function orbitPosition(angle, tiltX, tiltY, tiltZ, radius) {
    // Start on XY plane
    var x = Math.cos(angle) * radius;
    var y = Math.sin(angle) * radius;
    var z = 0;

    // Rotate around X axis
    var cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
    var y2 = y * cosX - z * sinX;
    var z2 = y * sinX + z * cosX;
    y = y2; z = z2;

    // Rotate around Y axis
    var cosY = Math.cos(tiltY), sinY = Math.sin(tiltY);
    var x2 = x * cosY + z * sinY;
    z2 = -x * sinY + z * cosY;
    x = x2; z = z2;

    // Rotate around Z axis
    var cosZ = Math.cos(tiltZ), sinZ = Math.sin(tiltZ);
    x2 = x * cosZ - y * sinZ;
    y2 = x * sinZ + y * cosZ;
    x = x2; y = y2;

    return { x: x, y: y, z: z };
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
      introProgress = 1 - Math.pow(1 - introProgress, 3); // ease out cubic
    }

    // Hover interpolation
    var hoverTarget = hovering ? 1 : 0;
    hoverStrength += (hoverTarget - hoverStrength) * 0.04;
    if (Math.abs(hoverStrength - hoverTarget) < 0.001) hoverStrength = hoverTarget;

    var dt = 0.016; // ~60fps
    var halfW = W / 2;
    var halfH = H / 2;
    var baseRadius = Math.min(halfW, halfH);

    ctx.clearRect(0, 0, W, H);
    if (introProgress <= 0) {
      requestAnimationFrame(tick);
      return;
    }

    var globalAlpha = introProgress;

    // Sort particles by z for depth
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];

      // Advance orbit angle
      p.angle += p.speed * dt;

      // Absorption effect on hover
      if (hovering && !p.absorbed) {
        p.absorbProgress = Math.min(1, p.absorbProgress + 0.008 + Math.random() * 0.005);
      } else if (!hovering) {
        p.absorbProgress = Math.max(0, p.absorbProgress - 0.025);
        p.absorbed = false;
      }

      if (p.absorbProgress >= 1 && hovering) {
        p.absorbed = true;
      }

      // Orbit radius shrinks as absorption progresses
      var absorbEase = p.absorbProgress * p.absorbProgress;
      var currentRadius = p.baseOrbitRadius * (1 - absorbEase * 0.85);
      // Speed increases as it spirals in
      var speedMult = 1 + absorbEase * 3;
      p.angle += p.speed * dt * (speedMult - 1);

      var pos = orbitPosition(p.angle, p.tiltX, p.tiltY, p.tiltZ, currentRadius * baseRadius);

      p.x = cx + pos.x;
      p.y = cy + pos.y;
      p.z = pos.z;

      // Size pulse on absorption
      p.size = p.baseSize * (1 + absorbEase * 1.5);
      // Brightness surge
      p.brightness = p.baseBrightness * (1 + absorbEase * 2);

      // Trail positions
      if (p.trail.length > 6) p.trail.shift();
      p.trail.push({ x: p.x, y: p.y, a: absorbEase });
    }

    // Sort by z (back to front)
    particles.sort(function (a, b) { return a.z - b.z; });

    // Draw particles
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      if (p.absorbed && hovering) continue; // fully absorbed, invisible

      var alpha = globalAlpha * Math.min(1, p.brightness) * (p.absorbed ? 0 : 1);
      // Depth fade: particles further back are dimmer
      var depthFade = 0.4 + 0.6 * ((p.z / baseRadius + 1) / 2);
      alpha *= depthFade;

      // Draw trail
      if (p.trail.length > 1 && p.absorbProgress > 0.05) {
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (var t = 1; t < p.trail.length; t++) {
          ctx.lineTo(p.trail[t].x, p.trail[t].y);
        }
        ctx.strokeStyle = "rgba(168,255,0," + (alpha * 0.3 * p.absorbProgress).toFixed(3) + ")";
        ctx.lineWidth = p.size * 0.5;
        ctx.stroke();
      }

      // Particle glow
      var glowSize = p.size * (2 + p.absorbProgress * 4);
      var grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowSize);
      grd.addColorStop(0, "rgba(168,255,0," + (alpha * 0.8).toFixed(3) + ")");
      grd.addColorStop(0.4, "rgba(168,255,0," + (alpha * 0.2).toFixed(3) + ")");
      grd.addColorStop(1, "rgba(168,255,0,0)");
      ctx.fillStyle = grd;
      ctx.fillRect(p.x - glowSize, p.y - glowSize, glowSize * 2, glowSize * 2);

      // Particle core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(168,255,0," + alpha.toFixed(3) + ")";
      ctx.fill();
    }

    // Central glow intensifies with hover
    if (hoverStrength > 0.01) {
      var coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseRadius * 0.5);
      var ga = hoverStrength * 0.15 * globalAlpha;
      coreGlow.addColorStop(0, "rgba(168,255,0," + ga.toFixed(3) + ")");
      coreGlow.addColorStop(0.5, "rgba(168,255,0," + (ga * 0.3).toFixed(3) + ")");
      coreGlow.addColorStop(1, "rgba(168,255,0,0)");
      ctx.fillStyle = coreGlow;
      ctx.fillRect(0, 0, W, H);
    }

    // Occasional spark burst during absorption
    if (hoverStrength > 0.3 && Math.random() < 0.15 * hoverStrength) {
      var sparkAngle = Math.random() * Math.PI * 2;
      var sparkDist = baseRadius * (0.05 + Math.random() * 0.15);
      var sx = cx + Math.cos(sparkAngle) * sparkDist;
      var sy = cy + Math.sin(sparkAngle) * sparkDist;
      var sparkGrd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 4);
      sparkGrd.addColorStop(0, "rgba(212,255,0," + (0.8 * globalAlpha).toFixed(3) + ")");
      sparkGrd.addColorStop(1, "rgba(168,255,0,0)");
      ctx.fillStyle = sparkGrd;
      ctx.fillRect(sx - 4, sy - 4, 8, 8);
    }

    requestAnimationFrame(tick);
  }

  // Events
  wrap.addEventListener("mouseenter", function () { hovering = true; });
  wrap.addEventListener("mouseleave", function () { hovering = false; });
  wrap.addEventListener("touchstart", function () { hovering = true; }, { passive: true });
  wrap.addEventListener("touchend", function () { hovering = false; });

  window.addEventListener("resize", resize);
  init();
  requestAnimationFrame(tick);
})();

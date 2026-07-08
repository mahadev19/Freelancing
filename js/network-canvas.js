/* ==========================================================================
   NETWORK CANVAS
   Draws a slow-drifting node network into #networkCanvas (the hero).
   Nodes = "agents". Lines = connections when nodes are close enough.
   Occasional traveling pulse along a line = a signal being sent between
   agents — this is the site's signature visual, so it stays deliberate
   and unhurried rather than busy.

   Respects prefers-reduced-motion: draws one static frame and stops.
   ========================================================================== */

(function () {
  const canvas = document.getElementById('networkCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COLOR_NODE = '124, 111, 242';   // matches --accent-violet
  const COLOR_PULSE = '242, 166, 90';   // matches --accent-amber

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let nodes = [];
  let pulses = [];
  let rafId = null;

  const CONFIG = {
    linkDistance: 170,     // max distance (css px) for two nodes to connect
    baseSpeed: 0.12,       // px per frame drift speed
    nodeRadiusMin: 1.4,
    nodeRadiusMax: 2.6,
    pulseChancePerFrame: 0.006, // probability a new signal pulse spawns
    pulseSpeed: 0.012,     // fraction of line traveled per frame
  };

  function nodeCountForWidth(w) {
    // Fewer nodes on small screens — keeps it calm and keeps perf steady
    if (w < 600) return 22;
    if (w < 1000) return 34;
    return 48;
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeNodes() {
    const count = nodeCountForWidth(width);
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * CONFIG.baseSpeed,
      vy: (Math.random() - 0.5) * CONFIG.baseSpeed,
      r: CONFIG.nodeRadiusMin + Math.random() * (CONFIG.nodeRadiusMax - CONFIG.nodeRadiusMin),
    }));
    pulses = [];
  }

  function step() {
    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;

      // Gently bounce off edges rather than wrapping — keeps motion calm
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
      n.x = Math.max(0, Math.min(width, n.x));
      n.y = Math.max(0, Math.min(height, n.y));
    }
  }

  function findEligibleLinks() {
    const links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.linkDistance) {
          links.push({ a, b, dist });
        }
      }
    }
    return links;
  }

  function maybeSpawnPulse(links) {
    if (!links.length) return;
    if (Math.random() < CONFIG.pulseChancePerFrame) {
      const link = links[Math.floor(Math.random() * links.length)];
      pulses.push({ link, t: 0 });
    }
  }

  function draw(links) {
    ctx.clearRect(0, 0, width, height);

    // Lines — opacity falls off with distance
    for (const { a, b, dist } of links) {
      const opacity = (1 - dist / CONFIG.linkDistance) * 0.35;
      ctx.strokeStyle = `rgba(${COLOR_NODE}, ${opacity})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Nodes
    for (const n of nodes) {
      ctx.fillStyle = `rgba(${COLOR_NODE}, 0.55)`;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Traveling signal pulses along active links
    pulses.forEach((p) => {
      const { a, b } = p.link;
      const x = a.x + (b.x - a.x) * p.t;
      const y = a.y + (b.y - a.y) * p.t;
      ctx.fillStyle = `rgba(${COLOR_PULSE}, 0.9)`;
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      p.t += CONFIG.pulseSpeed;
    });
    pulses = pulses.filter((p) => p.t <= 1);
  }

  function frame() {
    step();
    const links = findEligibleLinks();
    maybeSpawnPulse(links);
    draw(links);
    rafId = requestAnimationFrame(frame);
  }

  function start() {
    resize();
    makeNodes();

    if (prefersReducedMotion) {
      // Single static frame: draw current link state once, no animation loop
      const links = findEligibleLinks();
      draw(links);
      return;
    }

    if (rafId) cancelAnimationFrame(rafId);
    frame();
  }

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (rafId) cancelAnimationFrame(rafId);
      start();
    }, 150);
  });

  // Pause the loop when the tab isn't visible — avoids wasted cycles
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
    } else if (!prefersReducedMotion) {
      frame();
    }
  });

  start();
})();

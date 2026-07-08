/* ==========================================================================
   INTERACTIONS
   Micro-interactions: scroll progress rail, active-nav highlighting,
   magnetic buttons, tilt cards, animated stat counters, mobile nav toggle.

   Each block is independent and guards for missing elements, so removing
   a feature from the HTML never breaks the others.
   ========================================================================== */

(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ *
   * 1. Scroll progress rail (fill height + section label)
   * ------------------------------------------------------------------ */
  (function initRail() {
    const railFill = document.getElementById('railFill');
    const railLabel = document.getElementById('railLabel');
    if (!railFill || !railLabel) return;

    const sections = Array.from(document.querySelectorAll('main section, main > header, .hero'));
    const labelMap = {
      hero: '00 / HERO',
      services: '01 / SERVICES',
      work: '02 / WORK',
      process: '03 / PROCESS',
      stack: '04 / STACK',
      support: '05 / SUPPORT',
      contact: '06 / CONTACT',
    };

    let ticking = false;

    function updateFill() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;
      railFill.style.height = `${progress * 100}%`;
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateFill);
        ticking = true;
      }
    }, { passive: true });

    updateFill();

    // Section label swaps via IntersectionObserver — cheaper than measuring
    // every section's bounding box on every scroll tick.
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.id;
              if (labelMap[id]) railLabel.textContent = labelMap[id];
            }
          });
        },
        { rootMargin: '-45% 0px -45% 0px' } // fires when section crosses viewport center
      );
      sections.forEach((s) => { if (s.id) observer.observe(s); });
    }
  })();

  /* ------------------------------------------------------------------ *
   * 2. Active nav-link highlighting (mirrors the section in view)
   * ------------------------------------------------------------------ */
  (function initActiveNav() {
    const navLinks = Array.from(document.querySelectorAll('[data-nav-link]'));
    if (!navLinks.length || !('IntersectionObserver' in window)) return;

    const linkById = new Map(
      navLinks.map((a) => [a.getAttribute('href').replace('#', ''), a])
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = linkById.get(entry.target.id);
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach((a) => a.classList.remove('is-active'));
            link.classList.add('is-active');
          }
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );

    linkById.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  })();

  /* ------------------------------------------------------------------ *
   * 3. Mobile nav toggle
   * ------------------------------------------------------------------ */
  (function initNavToggle() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    links.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  })();

  /* ------------------------------------------------------------------ *
   * 4. Magnetic buttons — cursor-follow pull within a radius
   * ------------------------------------------------------------------ */
  (function initMagnetic() {
    if (prefersReducedMotion) return;
    const buttons = document.querySelectorAll('[data-magnetic]');
    const STRENGTH = 0.35;
    const MAX_OFFSET = 14;

    buttons.forEach((btn) => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - (rect.left + rect.width / 2);
        const relY = e.clientY - (rect.top + rect.height / 2);
        const x = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relX * STRENGTH));
        const y = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relY * STRENGTH));
        btn.style.transform = `translate(${x}px, ${y}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    });
  })();

  /* ------------------------------------------------------------------ *
   * 5. Tilt cards — subtle 3D rotation following cursor position
   * ------------------------------------------------------------------ */
  (function initTilt() {
    if (prefersReducedMotion) return;
    const cards = document.querySelectorAll('[data-tilt]');
    const MAX_DEG = 6;

    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;  // 0 → 1
        const py = (e.clientY - rect.top) / rect.height;  // 0 → 1
        const rx = (px - 0.5) * MAX_DEG * 2;  // rotateY driven by horizontal position
        const ry = (0.5 - py) * MAX_DEG * 2;  // rotateX driven by vertical position
        card.style.setProperty('--rx', `${rx}deg`);
        card.style.setProperty('--ry', `${ry}deg`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  })();

  /* ------------------------------------------------------------------ *
   * 6. Stat counters — count up from 0 when scrolled into view
   * ------------------------------------------------------------------ */
  (function initCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    function animateCounter(el) {
      const target = parseFloat(el.dataset.target || '0', 10);
      const suffix = el.dataset.suffix || '';

      if (prefersReducedMotion) {
        el.textContent = `${target}${suffix}`;
        return;
      }

      const duration = 1200;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        const value = Math.round(target * eased);
        el.textContent = `${value}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((c) => observer.observe(c));
    } else {
      counters.forEach(animateCounter);
    }
  })();
})();

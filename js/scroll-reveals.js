/* ==========================================================================
   SCROLL REVEALS
   Animates every [data-reveal] element in as it enters the viewport.
   Grouped and staggered per parent <section> so each section reveals as
   one orchestrated moment rather than elements popping in independently.

   Depends on GSAP + ScrollTrigger (loaded via CDN in index.html, before
   this file). Falls back to an instant, no-animation reveal if either
   library failed to load, or if the user prefers reduced motion.
   ========================================================================== */

(function () {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));

  if (!revealEls.length) return;

  const gsapAvailable = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  // ---- Fallback path: no GSAP, or reduced motion requested ----
  // Elements are already visible via CSS ([data-reveal] has opacity/transform
  // set inline-style-free in base.css) — for reduced motion we just snap them
  // to visible immediately instead of animating.
  if (!gsapAvailable || prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Group reveal elements by their nearest ancestor <section> (or <header>
  // for the hero) so each group can be staggered together as one moment.
  const groups = new Map();

  revealEls.forEach((el) => {
    const group = el.closest('section, header') || document.body;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(el);
  });

  groups.forEach((elements) => {
    gsap.set(elements, { opacity: 0, y: 24 });

    ScrollTrigger.batch(elements, {
      start: 'top 85%',
      once: true,
      onEnter: (batch) => {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.1,
        });
      },
    });
  });

  // The hero reveals immediately on load rather than waiting for scroll —
  // it's the first thing visible, there's nothing to "scroll into."
  const hero = document.getElementById('hero');
  if (hero) {
    const heroEls = groups.get(hero);
    if (heroEls) {
      gsap.to(heroEls, {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        stagger: 0.12,
        delay: 0.2,
      });
      ScrollTrigger.getAll()
        .filter((st) => heroEls.includes(st.trigger))
        .forEach((st) => st.kill());
    }
  }
})();

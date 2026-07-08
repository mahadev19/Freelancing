/* ==========================================================================
   MAIN
   Orchestration entry point. Loaded last, after every other module has had
   a chance to attach its own listeners (each module in this project is
   self-initializing — this file does NOT call into them).

   Responsibilities here are deliberately narrow:
   1. Remove the .no-js fallback class now that JS has definitely run.
   2. Warn in the console (not to the user) if GSAP/ScrollTrigger failed to
      load, since scroll-reveals.js silently degrades to instant-visible
      in that case and it's useful to know why during development.
   ========================================================================== */

(function () {
  // JS has executed this far without throwing — safe to drop the fallback
  // class that keeps [data-reveal] content visible when JS never runs at all.
  document.documentElement.classList.remove('no-js');

  const gsapAvailable = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (!gsapAvailable) {
    console.warn(
      '[portfolio] GSAP/ScrollTrigger did not load — scroll reveals are showing instantly instead of animating. Check the CDN <script> tags in index.html if this is unexpected.'
    );
  }
})();

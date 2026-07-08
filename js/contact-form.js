/* ==========================================================================
   CONTACT FORM
   Opens/closes the contact modal from any [data-open-modal] trigger, and
   submits the form to Web3Forms (https://web3forms.com) — a free service
   that emails submissions straight to the inbox tied to the access key,
   with no backend server required for a static site.

   SETUP REQUIRED: replace the placeholder access_key value in the hidden
   input inside index.html's #contactForm with your own free key.
   ========================================================================== */

(function () {
  const overlay = document.getElementById('modalOverlay');
  const panel = overlay ? overlay.querySelector('.modal-panel') : null;
  const closeBtn = document.getElementById('modalClose');
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formStatus');
  const submitBtn = document.getElementById('formSubmit');
  const triggers = document.querySelectorAll('[data-open-modal]');

  if (!overlay || !form) return;

  let lastFocused = null;

  function openModal(e) {
    if (e) e.preventDefault();
    lastFocused = document.activeElement;
    overlay.hidden = false;
    // Next frame, so the transition from the CSS actually plays
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    const firstField = form.querySelector('#fName');
    if (firstField) firstField.focus();
  }

  function closeModal() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.hidden = true; }, 250); // matches --dur-med
    if (lastFocused) lastFocused.focus();
  }

  triggers.forEach((t) => t.addEventListener('click', openModal));
  closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal();
  });

  // ---- Submission ----
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot check — if this hidden field got filled in, silently drop it
    const honeypot = form.querySelector('.botcheck-field');
    if (honeypot && honeypot.checked) return;

    const accessKey = form.querySelector('[name="access_key"]').value;
    if (!accessKey || accessKey === 'YOUR_WEB3FORMS_ACCESS_KEY') {
      status.textContent = 'Form isn\u2019t connected yet — add a Web3Forms access key in index.html.';
      status.className = 'form-status is-error';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    status.textContent = '';
    status.className = 'form-status';

    try {
      const formData = new FormData(form);
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        status.textContent = 'Sent — I\u2019ll get back to you soon.';
        status.className = 'form-status is-success';
        form.reset();
        setTimeout(closeModal, 1800);
      } else {
        status.textContent = 'Something went wrong — try again, or email me directly.';
        status.className = 'form-status is-error';
      }
    } catch (err) {
      status.textContent = 'Network error — check your connection and try again.';
      status.className = 'form-status is-error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send \u2192';
    }
  });
})();

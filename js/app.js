/* ============================================================
   CONTIN TECH — interakce UI
   Help desk modal, scroll reveal, mobilní menu, odeslání formuláře
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ---- Help desk modal ---- */
  const overlay = document.getElementById('help-modal');
  const openers = document.querySelectorAll('[data-open-help]');
  const closer  = document.getElementById('help-close');

  function openModal() {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    const first = overlay.querySelector('input, textarea');
    if (first) setTimeout(() => first.focus(), 100);
  }
  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  openers.forEach(b => b.addEventListener('click', openModal));
  if (closer) closer.addEventListener('click', closeModal);
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---- Odeslání formuláře (nástřel: zatím jen front-end) ---- */
  const form = document.getElementById('help-form');
  const formBody = document.getElementById('form-body');
  const success = document.getElementById('form-success');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      /* TODO: napojit na backend / e-mail / CRM.
         Zatím simulace úspěšného odeslání. */
      formBody.style.display = 'none';
      success.style.display = 'block';
      setTimeout(() => {
        closeModal();
        formBody.style.display = 'block';
        success.style.display = 'none';
        form.reset();
      }, 2600);
    });
  }

  /* ---- Scroll reveal ---- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
      });
    }, { threshold: 0.15 });
    reveals.forEach(r => obs.observe(r));
  } else {
    reveals.forEach(r => r.classList.add('in'));
  }

  /* ---- Mobilní menu ---- */
  const burger = document.getElementById('burger');
  const menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', () => {
      const open = menu.style.display === 'flex';
      menu.style.display = open ? '' : 'flex';
      menu.style.position = 'absolute';
      menu.style.flexDirection = 'column';
      menu.style.top = '76px';
      menu.style.right = '0';
      menu.style.left = '0';
      menu.style.background = 'var(--carbon)';
      menu.style.padding = '1.5rem var(--gap)';
      menu.style.borderBottom = '1px solid var(--steel)';
    });
  }

  /* ---- Hlavička: ztmavení při scrollu ---- */
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) header.style.background = 'rgba(10,11,13,0.92)';
    else header.style.background = 'rgba(10,11,13,0.72)';
  });
});

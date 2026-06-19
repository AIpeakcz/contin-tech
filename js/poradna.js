/* ============================================================
   CONTIN TECH — Poradna
   Klientské filtrování článků podle tématu + diskuzní formulář.
   Maketa bez backendu: data se zatím nikam reálně neukládají.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  /* ---- Filtrování článků podle tématu (přehled poradny) ---- */
  const filters = document.getElementById('filters');
  const grid = document.getElementById('article-grid');
  const emptyNote = document.getElementById('empty-note');

  if (filters && grid) {
    const cards = Array.from(grid.querySelectorAll('.article-card'));

    filters.addEventListener('click', function (e) {
      const chip = e.target.closest('.chip');
      if (!chip) return;

      // přepnutí aktivního štítku
      filters.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      // zobraz/schovej karty podle vybraného tématu
      const filter = chip.dataset.filter;
      let visible = 0;
      cards.forEach(card => {
        const match = filter === 'all' || card.dataset.topic === filter;
        card.classList.toggle('is-hidden', !match);
        if (match) visible++;
      });

      // hláška, když k tématu není žádný článek
      if (emptyNote) emptyNote.classList.toggle('show', visible === 0);
    });
  }

  /* ---- Diskuzní formulář (detail článku) ---- */
  const replyForm = document.getElementById('reply-form');
  const replyBody = document.getElementById('reply-body');
  const replySuccess = document.getElementById('reply-success');
  const replyAgain = document.getElementById('reply-again');
  const callCheckbox = document.getElementById('rf-call');
  const phoneField = document.getElementById('phone-field');

  // pole na telefon se ukáže až po zvolení „Preferuji telefonický hovor"
  if (callCheckbox && phoneField) {
    callCheckbox.addEventListener('change', function () {
      phoneField.classList.toggle('show', callCheckbox.checked);
    });
  }

  if (replyForm && replyBody && replySuccess) {
    replyForm.addEventListener('submit', function (e) {
      e.preventDefault();

      /* TODO: napojit na backend (Supabase) — uložení příspěvku / odeslání dotazu.
         Veřejný příspěvek (visibility=public) → uložit a zobrazit v diskuzi.
         Soukromý dotaz (visibility=private) → odeslat týmu, veřejně neukazovat.
         Pole call/phone → předat preferenci telefonického kontaktu.
         Zatím jen front-end simulace úspěšného odeslání. */

      replyBody.style.display = 'none';
      replySuccess.style.display = 'block';
    });
  }

  // návrat z poděkování zpět na prázdný formulář
  if (replyAgain && replyForm && replyBody && replySuccess) {
    replyAgain.addEventListener('click', function () {
      replyForm.reset();
      if (phoneField) phoneField.classList.remove('show');
      replySuccess.style.display = 'none';
      replyBody.style.display = 'block';
    });
  }
});

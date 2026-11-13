/* ==========================================================================
   The Pilates Studio Yarm — Concept Set B Interactive Controller
   Body-focus reel filter, horizontal snap controls, dynamic fee ledger & dummy form
   Zero external network requests
   ========================================================================== */

(function () {
  'use strict';

  var DEMO_CONFIRMATION = 'Demo only – in the live site this would go straight to The Pilates Studio Yarm.';

  var SLOT_METADATA = {
    'mon-1815-beginners': { label: 'Monday 18:15\u201319:15 \u2014 Beginners Pilates', defaultMode: 'block' },
    'mon-1930-improvers': { label: 'Monday 19:30\u201320:30 \u2014 Improvers Pilates', defaultMode: 'waitlist' },
    'tue-1815-improvers': { label: 'Tuesday 18:15\u201319:15 \u2014 Improvers Pilates', defaultMode: 'block' },
    'tue-1930-intadv': { label: 'Tuesday 19:30\u201320:30 \u2014 Intermediate / Advanced Pilates', defaultMode: 'block' },
    'wed-0930-functional': { label: 'Wednesday 09:30\u201310:30 \u2014 Functional Pilates (Osteoporosis friendly)', defaultMode: 'block' },
    'wed-1045-power': { label: 'Wednesday 10:45\u201311:45 \u2014 Power Pilates', defaultMode: 'waitlist' },
    'wed-1800-begimp': { label: 'Wednesday 18:00\u201319:00 \u2014 Beginners / Improvers Pilates', defaultMode: 'block' },
    'thu-0930-intadv': { label: 'Thursday 09:30\u201310:30 \u2014 Intermediate / Advanced Pilates', defaultMode: 'waitlist' },
    'thu-1045-improvers': { label: 'Thursday 10:45\u201311:45 \u2014 Improvers Pilates', defaultMode: 'block' },
    'thu-1815-intadv': { label: 'Thursday 18:15\u201319:15 \u2014 Intermediate / Advanced Pilates', defaultMode: 'block' },
    'mon-1030-reformer': { label: 'Monday 10:30\u201311:30 \u2014 1:1 / Reformer Tuition', defaultMode: 'reformer' },
    'mon-1145-reformer': { label: 'Monday 11:45\u201312:45 \u2014 1:1 / Reformer Tuition', defaultMode: 'reformer' },
    'flex-reformer': { label: 'Flexible Daytime / Evening 1:1 Appointment', defaultMode: 'reformer' }
  };

  /* 1. Horizontal Touch-Snap Reel Scroll Buttons & Body-Focus Filter */
  var reelEl = document.getElementById('schedule-reel');
  var prevBtn = document.getElementById('reel-prev');
  var nextBtn = document.getElementById('reel-next');
  var focusPills = document.querySelectorAll('.focus-pill[data-focus]');
  var reelCards = document.querySelectorAll('.reel-card[data-focus-tags]');
  var reelStatus = document.getElementById('reel-count-status');

  if (reelEl && prevBtn && nextBtn) {
    prevBtn.addEventListener('click', function () {
      reelEl.scrollBy({ left: -320, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', function () {
      reelEl.scrollBy({ left: 320, behavior: 'smooth' });
    });
  }

  if (focusPills.length && reelCards.length) {
    focusPills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        var focus = pill.getAttribute('data-focus');
        var shown = 0;

        focusPills.forEach(function (p) {
          p.setAttribute('aria-pressed', p === pill ? 'true' : 'false');
        });

        reelCards.forEach(function (card) {
          var tags = (card.getAttribute('data-focus-tags') || '').split(',');
          var match = focus === 'all' || tags.indexOf(focus) !== -1;
          card.hidden = !match;
          if (match) shown += 1;
        });

        if (reelEl) {
          reelEl.scrollTo({ left: 0, behavior: 'smooth' });
        }

        if (reelStatus) {
          if (focus === 'all') {
            reelStatus.textContent = 'Showing all 12 published Monday\u2013Thursday sessions at The Granary. Swipe horizontally or tap a card to reserve.';
          } else {
            reelStatus.textContent = 'Showing ' + shown + ' studio session' + (shown === 1 ? '' : 's') + ' matched to ' + pill.textContent.trim() + '.';
          }
        }
      });
    });
  }

  /* 2. Sanctuary Reservation Ledger Live Sync */
  var modeSelect = document.getElementById('pb-mode');
  var slotSelect = document.getElementById('pb-slot');
  var summaryTitle = document.getElementById('summary-title');
  var summaryPrice = document.getElementById('summary-price');
  var summaryDetail = document.getElementById('summary-detail');

  function updateSummaryLedger() {
    if (!modeSelect || !slotSelect) return;
    var slotKey = slotSelect.value;
    var mode = modeSelect.value;
    var meta = SLOT_METADATA[slotKey] || { label: slotSelect.options[slotSelect.selectedIndex].text };

    if (summaryTitle) {
      summaryTitle.textContent = meta.label;
    }

    if (mode === 'reformer') {
      if (summaryPrice) summaryPrice.textContent = '\u00A340.00 / hr';
      if (summaryDetail) summaryDetail.textContent = 'Private 60-minute 1:1 or Reformer session by appointment';
    } else if (mode === 'waitlist') {
      if (summaryPrice) summaryPrice.textContent = 'Waiting List';
      if (summaryDetail) summaryDetail.textContent = 'Priority notification when a half-term mat place opens (\u00A39.00/class)';
    } else {
      if (summaryPrice) summaryPrice.textContent = '\u00A372.00';
      if (summaryDetail) summaryDetail.textContent = '8-week Winter Term block (\u00A39.00/class \u00B7 Mon 26 Oct \u2013 Fri 18 Dec 2026)';
    }
  }

  if (slotSelect && modeSelect) {
    slotSelect.addEventListener('change', function () {
      var meta = SLOT_METADATA[slotSelect.value];
      if (meta && meta.defaultMode) {
        modeSelect.value = meta.defaultMode;
      }
      updateSummaryLedger();
    });

    modeSelect.addEventListener('change', updateSummaryLedger);
  }

  /* 3. One-Tap Session Pickers from Reel & Vellum Card */
  var pickButtons = document.querySelectorAll('[data-pick-slot]');
  var bookingSection = document.getElementById('sanctuary-booking');

  pickButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var slotKey = btn.getAttribute('data-pick-slot');
      var pickMode = btn.getAttribute('data-pick-mode');

      if (slotSelect && slotKey) {
        slotSelect.value = slotKey;
      }
      if (modeSelect && pickMode) {
        modeSelect.value = pickMode;
      }
      updateSummaryLedger();

      if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      var nameInput = document.getElementById('pb-name');
      if (nameInput) {
        window.setTimeout(function () {
          nameInput.focus({ preventScroll: true });
        }, 420);
      }
    });
  });

  /* 4. Accessible Client-Side Dummy Form Validation */
  var form = document.getElementById('pilates-b-form');
  var confirmBox = document.getElementById('pb-confirmation');

  function setError(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    if (msg) {
      el.textContent = msg;
      el.hidden = false;
    } else {
      el.textContent = '';
      el.hidden = true;
    }
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var nameEl = document.getElementById('pb-name');
      var phoneEl = document.getElementById('pb-phone');
      var emailEl = document.getElementById('pb-email');
      var consentEl = document.getElementById('pb-consent');
      var firstInvalid = null;

      setError('err-pb-name', '');
      setError('err-pb-phone', '');
      setError('err-pb-email', '');
      setError('err-pb-consent', '');

      if (!nameEl.value.trim()) {
        setError('err-pb-name', 'Please enter your full name.');
        firstInvalid = firstInvalid || nameEl;
      }

      if (!phoneEl.value.trim()) {
        setError('err-pb-phone', 'Please enter a contact telephone number.');
        firstInvalid = firstInvalid || phoneEl;
      }

      var emailVal = emailEl.value.trim();
      if (!emailVal || emailVal.indexOf('@') === -1 || emailVal.indexOf('.') === -1) {
        setError('err-pb-email', 'Please enter a valid email address.');
        firstInvalid = firstInvalid || emailEl;
      }

      if (!consentEl.checked) {
        setError('err-pb-consent', 'Please confirm you understand screening and suitability review.');
        firstInvalid = firstInvalid || consentEl;
      }

      if (firstInvalid) {
        if (confirmBox) confirmBox.hidden = true;
        firstInvalid.focus();
        return;
      }

      if (confirmBox) {
        confirmBox.textContent = DEMO_CONFIRMATION;
        confirmBox.hidden = false;
      }
    });
  }
})();

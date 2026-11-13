/* ==========================================================================
   The Pilates Studio Yarm — Concept Set C Interactive Controller
   Sticky pill-tab tracker, day-tabbed schedule, Mobbin 3-step booking stepper
   Zero external network requests
   ========================================================================== */

(function () {
  'use strict';

  var DEMO_CONFIRMATION = 'Demo only – in the live site this would go straight to The Pilates Studio Yarm.';

  /* 1. Sticky Pill-Tab Active Highlight */
  var pillTabs = document.querySelectorAll('.pill-tab[data-section-tab]');
  pillTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      pillTabs.forEach(function (t) {
        t.classList.toggle('is-current', t === tab);
      });
    });
  });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var id = entry.target.id;
            pillTabs.forEach(function (t) {
              t.classList.toggle('is-current', t.getAttribute('data-section-tab') === id);
            });
          }
        });
      },
      { rootMargin: '-32% 0px -55% 0px' }
    );

    ['studio', 'timetable', 'reformer', 'book'].forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) observer.observe(sec);
    });
  }

  /* 2. Accessible Day-Tabbed Schedule List */
  var dayButtons = Array.prototype.slice.call(document.querySelectorAll('.day-seg-btn[role="tab"]'));
  var schedRows = document.querySelectorAll('.sched-row[data-sched-day]');
  var liveNote = document.getElementById('schedule-live-note');

  var DAY_NAMES = {
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    all: 'Monday\u2013Thursday'
  };

  function activateDay(targetBtn, focusBtn) {
    var day = targetBtn.getAttribute('data-day');
    var count = 0;

    dayButtons.forEach(function (btn) {
      var active = btn === targetBtn;
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
      btn.setAttribute('tabindex', active ? '0' : '-1');
    });

    schedRows.forEach(function (row) {
      var match = day === 'all' || row.getAttribute('data-sched-day') === day;
      row.hidden = !match;
      if (match) count += 1;
    });

    if (liveNote) {
      liveNote.textContent =
        'Showing ' + count + ' ' + (DAY_NAMES[day] || '') + ' studio session' + (count === 1 ? '' : 's') +
        ' at The Granary. Tap any row to pre-fill the 3-step booking stepper.';
    }

    if (focusBtn) {
      targetBtn.focus();
    }
  }

  dayButtons.forEach(function (btn, idx) {
    btn.addEventListener('click', function () {
      activateDay(btn, false);
    });

    btn.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowRight') next = (idx + 1) % dayButtons.length;
      if (event.key === 'ArrowLeft') next = (idx - 1 + dayButtons.length) % dayButtons.length;
      if (next !== null) {
        event.preventDefault();
        activateDay(dayButtons[next], true);
      }
    });
  });

  /* 3. Mobbin 3-Step Studio Booking Stepper */
  var currentStep = 1;
  var panes = document.querySelectorAll('[data-step-pane]');
  var indicators = document.querySelectorAll('[data-step-indicator]');
  var formatRadios = document.querySelectorAll('input[name="studio_format"]');
  var formatCards = document.querySelectorAll('.format-card');
  var sessionSelect = document.getElementById('pc-session');
  var step2Status = document.getElementById('step2-status-text');
  var step3Summary = document.getElementById('step3-summary');

  var ALL_OPTIONS = [];
  if (sessionSelect) {
    Array.prototype.slice.call(sessionSelect.options).forEach(function (opt) {
      ALL_OPTIONS.push({
        value: opt.value,
        text: opt.text,
        fmt: opt.getAttribute('data-fmt'),
        status: opt.getAttribute('data-status')
      });
    });
  }

  function getSelectedFormat() {
    var checked = document.querySelector('input[name="studio_format"]:checked');
    return checked ? checked.value : 'mat';
  }

  function syncFormatCards() {
    var fmt = getSelectedFormat();
    formatCards.forEach(function (card) {
      var radio = card.querySelector('input[type="radio"]');
      card.classList.toggle('is-selected', Boolean(radio && radio.value === fmt));
    });
  }

  function filterSessionDropdown(preferredSlot) {
    if (!sessionSelect) return;
    var fmt = getSelectedFormat();
    var currentVal = preferredSlot || sessionSelect.value;
    sessionSelect.innerHTML = '';

    var matched = false;
    ALL_OPTIONS.forEach(function (item) {
      if (item.fmt === fmt) {
        var opt = document.createElement('option');
        opt.value = item.value;
        opt.textContent = item.text;
        opt.setAttribute('data-status', item.status || '');
        if (item.value === currentVal) {
          opt.selected = true;
          matched = true;
        }
        sessionSelect.appendChild(opt);
      }
    });

    if (!matched && sessionSelect.options.length > 0) {
      sessionSelect.selectedIndex = 0;
    }
    updateStepSummaries();
  }

  function updateStepSummaries() {
    if (!sessionSelect || sessionSelect.options.length === 0) return;
    var selectedOpt = sessionSelect.options[sessionSelect.selectedIndex];
    var statusLabel = selectedOpt.getAttribute('data-status') || '';
    var fmt = getSelectedFormat();
    var fmtTitle = fmt === 'reformer' ? '1:1 & Reformer (£40.00/hr)' : 'Half-Term Mat Block (£9.00/class)';

    if (step2Status) {
      if (statusLabel.indexOf('Waiting List') !== -1) {
        step2Status.textContent = 'Currently Full \u2014 Join Priority Waiting List (no payment until a space opens)';
      } else if (fmt === 'reformer') {
        step2Status.textContent = 'By Appointment \u2014 \u00A340.00 per 60-minute private session';
      } else {
        step2Status.textContent = 'Available \u2014 Reserve 8-week Winter Term block (\u00A372.00 at \u00A39.00/class)';
      }
    }

    if (step3Summary) {
      step3Summary.innerHTML = '';
      var strong = document.createElement('strong');
      strong.textContent = 'Selected: ';
      step3Summary.appendChild(strong);
      step3Summary.appendChild(document.createTextNode(fmtTitle + ' \u00B7 ' + selectedOpt.textContent));
    }
  }

  function goToStep(stepNum) {
    currentStep = stepNum;
    panes.forEach(function (pane) {
      var n = parseInt(pane.getAttribute('data-step-pane'), 10);
      pane.hidden = n !== currentStep;
    });
    indicators.forEach(function (ind) {
      var n = parseInt(ind.getAttribute('data-step-indicator'), 10);
      ind.classList.toggle('is-active', n === currentStep);
      ind.classList.toggle('is-done', n < currentStep);
    });
    updateStepSummaries();
  }

  formatRadios.forEach(function (radio) {
    radio.addEventListener('change', function () {
      syncFormatCards();
      filterSessionDropdown();
    });
  });

  if (sessionSelect) {
    sessionSelect.addEventListener('change', updateStepSummaries);
  }

  document.querySelectorAll('[data-next-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      goToStep(parseInt(btn.getAttribute('data-next-step'), 10));
    });
  });

  document.querySelectorAll('[data-prev-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      goToStep(parseInt(btn.getAttribute('data-prev-step'), 10));
    });
  });

  document.querySelectorAll('[data-goto-step]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      goToStep(parseInt(btn.getAttribute('data-goto-step'), 10));
    });
  });

  /* Quick-Book Triggers from Timetable & Reformer Cards */
  document.querySelectorAll('[data-step-format]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var fmt = btn.getAttribute('data-step-format');
      var slot = btn.getAttribute('data-step-slot');
      var radio = document.querySelector('input[name="studio_format"][value="' + fmt + '"]');
      if (radio) {
        radio.checked = true;
      }
      syncFormatCards();
      filterSessionDropdown(slot);
      goToStep(3);

      var bookSection = document.getElementById('book');
      if (bookSection) {
        bookSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  filterSessionDropdown('mon-1815-beginners');

  /* 4. Client-Side Dummy Form Submission */
  var form = document.getElementById('pilates-stepper-form');
  var confirmEl = document.getElementById('pc-confirmation');

  function setErr(id, msg) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg || '';
    el.hidden = !msg;
  }

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      goToStep(3);

      var nameEl = document.getElementById('pc-name');
      var phoneEl = document.getElementById('pc-phone');
      var emailEl = document.getElementById('pc-email');
      var consentEl = document.getElementById('pc-consent');
      var invalid = null;

      setErr('err-pc-name', '');
      setErr('err-pc-phone', '');
      setErr('err-pc-email', '');
      setErr('err-pc-consent', '');

      if (!nameEl.value.trim()) {
        setErr('err-pc-name', 'Please enter your full name.');
        invalid = invalid || nameEl;
      }
      if (!phoneEl.value.trim()) {
        setErr('err-pc-phone', 'Please enter your telephone number.');
        invalid = invalid || phoneEl;
      }
      var em = emailEl.value.trim();
      if (!em || em.indexOf('@') === -1 || em.indexOf('.') === -1) {
        setErr('err-pc-email', 'Please enter a valid email address.');
        invalid = invalid || emailEl;
      }
      if (!consentEl.checked) {
        setErr('err-pc-consent', 'Please confirm pre-class health screening acknowledgement.');
        invalid = invalid || consentEl;
      }

      if (invalid) {
        if (confirmEl) confirmEl.hidden = true;
        invalid.focus();
        return;
      }

      if (confirmEl) {
        confirmEl.textContent = DEMO_CONFIRMATION;
        confirmEl.hidden = false;
      }
    });
  }
})();

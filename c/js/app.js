/* ==========================================================================
   The Pilates Studio Yarm — Concept Set C Interactive Controller
   Top scroll-progress hairline, sticky pill-tab tracker, day-tabbed schedule,
   1-tap practice goal presets, micro-toast, <dialog> photo lightbox, smart
   dock auto-clearance, Mobbin 3-step booking stepper & live receipt ticket
   Zero external network requests
   ========================================================================== */

(function () {
  'use strict';

  var DEMO_CONFIRMATION = 'Demo only \u2013 in the live site this would go straight to The Pilates Studio Yarm.';

  /* 0. Non-Blocking Micro-Toast Helper */
  var toastEl = document.getElementById('micro-toast');
  var toastTimer = null;

  function showMicroToast(message) {
    if (!toastEl || !message) return;
    if (toastTimer) window.clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastTimer = window.setTimeout(function () {
      toastEl.hidden = true;
    }, 3400);
  }

  /* 1. Sticky Header 2.5px Scroll-Progress Hairline */
  var progressRail = document.getElementById('scroll-progress-rail');
  if (progressRail) {
    var ticking = false;
    var updateProgress = function () {
      var docH = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = docH > 40 ? Math.min(1, Math.max(0, window.scrollY / docH)) : 0;
      progressRail.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(updateProgress);
      }
    }, { passive: true });
    updateProgress();
  }

  /* 2. Sticky Pill-Tab Active Highlight */
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

  /* 3. Accessible Day-Tabbed Schedule List */
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
    if (!targetBtn) return;
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

  /* 4. Mobbin 3-Step Studio Booking Stepper */
  var currentStep = 1;
  var panes = document.querySelectorAll('[data-step-pane]');
  var indicators = document.querySelectorAll('[data-step-indicator]');
  var formatRadios = document.querySelectorAll('input[name="studio_format"]');
  var formatCards = document.querySelectorAll('.format-card');
  var sessionSelect = document.getElementById('pc-session');
  var healthNotesInput = document.getElementById('pc-health');
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
    var fmtTitle = fmt === 'reformer' ? '1:1 & Reformer (\u00A340.00/hr)' : 'Half-Term Mat Block (\u00A39.00/class)';

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
      step3Summary.textContent = '';
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

  /* 5. 1-Tap Practice Goal Presets */
  var GOAL_PRESETS = {
    beginner: {
      format: 'mat',
      slot: 'mon-1815-beginners',
      dayTab: 'dtab-all',
      note: 'Goal: Complete Beginner Mat (\u00A39.00/class half-term block, Winter Term Mon 26 Oct \u2013 Fri 18 Dec 2026).',
      toast: 'Complete Beginner Mat preset selected \u2014 Mon 18:15 & Wed 18:00 (\u00A39/class) highlighted & pre-filled.'
    },
    back4good: {
      format: 'mat',
      slot: 'wed-1800-begimp',
      dayTab: 'dtab-all',
      note: 'Goal: Back4Good\u00AE low-back care, spinal mobility and posture support with pre-class health screening.',
      toast: 'Back4Good\u00AE Low Back Care preset selected \u2014 back-friendly Granary sessions highlighted & pre-filled.'
    },
    reformer: {
      format: 'reformer',
      slot: 'mon-1030-reformer',
      dayTab: 'dtab-mon',
      note: 'Goal: 1:1 Private Reformer session (\u00A340.00/hr by appointment at The Granary, 07702 300960).',
      toast: '1:1 Private Reformer (\u00A340/hr) preset selected \u2014 Monday 10:30 & 11:45 apparatus slots highlighted & pre-filled.'
    }
  };

  var presetButtons = document.querySelectorAll('.c-preset-btn[data-goal-preset]');
  var presetJump = document.getElementById('c-preset-jump');

  if (healthNotesInput) {
    healthNotesInput.addEventListener('input', function () {
      healthNotesInput.removeAttribute('data-preset-filled');
    });
  }

  presetButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-goal-preset');
      var cfg = GOAL_PRESETS[key];
      if (!cfg) return;

      presetButtons.forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });

      var targetDayBtn = document.getElementById(cfg.dayTab);
      if (targetDayBtn) activateDay(targetDayBtn, false);

      var matchedCount = 0;
      schedRows.forEach(function (row) {
        var tags = (row.getAttribute('data-preset-tags') || '').split(',');
        var isMatch = tags.indexOf(key) !== -1;
        row.classList.toggle('is-preset-match', isMatch);
        if (isMatch) matchedCount += 1;
      });

      if (liveNote) {
        liveNote.textContent = matchedCount + ' matching Granary studio session' + (matchedCount === 1 ? '' : 's') + ' highlighted for "' + btn.textContent.trim() + '".';
      }

      var fmtRadio = document.querySelector('input[name="studio_format"][value="' + cfg.format + '"]');
      if (fmtRadio) fmtRadio.checked = true;
      syncFormatCards();
      filterSessionDropdown(cfg.slot);
      if (healthNotesInput && (!healthNotesInput.value || healthNotesInput.getAttribute('data-preset-filled') === 'true')) {
        healthNotesInput.value = cfg.note;
        healthNotesInput.setAttribute('data-preset-filled', 'true');
      }
      goToStep(3);

      if (presetJump) presetJump.hidden = false;
      showMicroToast(cfg.toast);
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

      var chosenOpt = sessionSelect && sessionSelect.options[sessionSelect.selectedIndex]
        ? sessionSelect.options[sessionSelect.selectedIndex].textContent.split('([')[0].trim()
        : 'Granary session';
      showMicroToast('Selected: ' + chosenOpt + ' \u2014 Step 3 ready below.');

      var bookSection = document.getElementById('book');
      if (bookSection) {
        bookSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  filterSessionDropdown('mon-1815-beginners');

  /* 6. Native <dialog> Photo Lightbox */
  var lightboxDialog = document.getElementById('photo-lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxCaption = document.getElementById('lightbox-caption');
  var lightboxCta = document.getElementById('lightbox-cta');
  var lastTrigger = null;

  function openLightbox(el) {
    if (!lightboxDialog || !lightboxImg) return;
    lastTrigger = el;
    var src = el.getAttribute('data-lightbox-src');
    var alt = el.getAttribute('data-lightbox-alt') || '';
    var caption = el.getAttribute('data-lightbox-caption') || '';
    var ctaHref = el.getAttribute('data-lightbox-cta') || '#book';
    var ctaLabel = el.getAttribute('data-lightbox-cta-label') || 'Start 3-Step Booking';

    if (src) lightboxImg.src = src;
    lightboxImg.alt = alt;
    if (lightboxCaption) lightboxCaption.textContent = caption;
    if (lightboxCta) {
      lightboxCta.href = ctaHref;
      lightboxCta.textContent = ctaLabel;
    }

    if (typeof lightboxDialog.showModal === 'function') {
      lightboxDialog.showModal();
    } else {
      lightboxDialog.setAttribute('open', '');
    }
  }

  function closeLightbox() {
    if (!lightboxDialog) return;
    if (typeof lightboxDialog.close === 'function' && lightboxDialog.open) {
      lightboxDialog.close();
    } else {
      lightboxDialog.removeAttribute('open');
    }
    if (lastTrigger && typeof lastTrigger.focus === 'function') {
      lastTrigger.focus({ preventScroll: true });
    }
  }

  if (lightboxDialog) {
    document.querySelectorAll('.is-lightbox-trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        openLightbox(trigger);
      });
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(trigger);
        }
      });
    });

    lightboxDialog.querySelectorAll('[data-lightbox-close]').forEach(function (btn) {
      btn.addEventListener('click', closeLightbox);
    });

    lightboxDialog.addEventListener('click', function (e) {
      if (e.target === lightboxDialog) closeLightbox();
    });

    if (lightboxCta) {
      lightboxCta.addEventListener('click', closeLightbox);
    }
  }

  /* 7. Smart Form & Footer Auto-Clearance for Floating Mobile Dock */
  var mobileDock = document.querySelector('.mobile-app-dock');
  if (mobileDock && 'IntersectionObserver' in window) {
    var watched = document.querySelectorAll('#pilates-stepper-form, footer.app-footer');
    var activeZones = new Set();
    var dockObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activeZones.add(entry.target);
        } else {
          activeZones.delete(entry.target);
        }
      });
      mobileDock.classList.toggle('is-dock-hidden', activeZones.size > 0);
    }, { threshold: 0.08 });

    watched.forEach(function (el) {
      dockObs.observe(el);
    });
  }

  /* 8. Client-Side Form Validation + Live Owner-Receipt Summary Ticket */
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
      if (!phoneEl.value.trim() || phoneEl.value.replace(/\D/g, '').length < 7) {
        setErr('err-pc-phone', 'Please enter a valid UK telephone number.');
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
        var clientName = nameEl.value.trim();
        var contactStr = phoneEl.value.trim() + ' \u00B7 ' + em;
        var fmt = getSelectedFormat();
        var fmtTitle = fmt === 'reformer' ? '1:1 & Reformer (\u00A340.00/hr)' : 'Half-Term Mat Block (\u00A39.00/class)';
        var selectedOpt = sessionSelect && sessionSelect.options[sessionSelect.selectedIndex];
        var sessionStr = selectedOpt ? selectedOpt.textContent.split('([')[0].trim() : 'Granary Session';
        var statusStr = selectedOpt ? (selectedOpt.getAttribute('data-status') || fmtTitle) : fmtTitle;
        var notesStr = healthNotesInput && healthNotesInput.value.trim() ? healthNotesInput.value.trim() : 'Standard pre-class health screening';
        var refCode = 'PSY-' + String(Math.floor(1000 + Math.random() * 9000));

        var summaryText = [
          'The Pilates Studio Yarm \u2014 Enquiry Summary (' + refCode + ')',
          'Client: ' + clientName,
          'Contact: ' + contactStr,
          'Format: ' + fmtTitle,
          'Selected Session: ' + sessionStr,
          'Status / Rate: ' + statusStr,
          'Notes: ' + notesStr
        ].join('\n');

        confirmEl.textContent = '';

        var verbatimP = document.createElement('p');
        verbatimP.className = 'demo-verbatim-notice';
        verbatimP.textContent = DEMO_CONFIRMATION;
        confirmEl.appendChild(verbatimP);

        var ticket = document.createElement('div');
        ticket.className = 'owner-receipt-ticket';

        var head = document.createElement('div');
        head.className = 'ticket-head';
        var titleSpan = document.createElement('span');
        titleSpan.className = 'ticket-title';
        titleSpan.textContent = 'What The Pilates Studio Yarm Receives';
        var refSpan = document.createElement('span');
        refSpan.className = 'ticket-ref';
        refSpan.textContent = 'Ref: ' + refCode;
        head.appendChild(titleSpan);
        head.appendChild(refSpan);
        ticket.appendChild(head);

        var dl = document.createElement('dl');
        dl.className = 'ticket-dl';
        [
          ['Client Name', clientName],
          ['Direct Contact', contactStr],
          ['Selected Session', sessionStr],
          ['Format & Rate', fmtTitle + ' (' + statusStr + ')'],
          ['Screening & Goal Notes', notesStr]
        ].forEach(function (pair) {
          var row = document.createElement('div');
          var dt = document.createElement('dt');
          dt.textContent = pair[0];
          var dd = document.createElement('dd');
          dd.textContent = pair[1];
          row.appendChild(dt);
          row.appendChild(dd);
          dl.appendChild(row);
        });
        ticket.appendChild(dl);

        var actions = document.createElement('div');
        actions.className = 'ticket-actions';

        var copyBtn = document.createElement('button');
        copyBtn.type = 'button';
        copyBtn.className = 'ticket-btn';
        copyBtn.textContent = 'Copy Summary';
        copyBtn.addEventListener('click', function () {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(summaryText).then(function () {
              copyBtn.textContent = 'Copied \u2713';
              showMicroToast('Enquiry summary copied to clipboard.');
              window.setTimeout(function () { copyBtn.textContent = 'Copy Summary'; }, 2200);
            }).catch(function () {
              showMicroToast('Summary ready: ' + refCode);
            });
          } else {
            showMicroToast('Summary ready: ' + refCode);
          }
        });

        var resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'ticket-btn ticket-btn-secondary';
        resetBtn.textContent = 'Reset Demo';
        resetBtn.addEventListener('click', function () {
          form.reset();
          confirmEl.hidden = true;
          confirmEl.textContent = '';
          syncFormatCards();
          filterSessionDropdown('mon-1815-beginners');
          goToStep(1);
          showMicroToast('Demo stepper reset.');
        });

        actions.appendChild(copyBtn);
        actions.appendChild(resetBtn);
        ticket.appendChild(actions);
        confirmEl.appendChild(ticket);

        confirmEl.hidden = false;
        confirmEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
})();

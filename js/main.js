/* ==========================================================================
   The Pilates Studio Yarm — Client-Side Navigation, Sanctuary Pathway Guide,
   1-Tap Practice Goal Presets, Native <dialog> Lightbox, Smart Dock Clearance,
   URL-Aware Timetable Filter, Block Fee Calculator & Live Enquiry Ticket
   Zero external network calls · Keyboard accessible · Concept demonstration
   ========================================================================== */

(function () {
  'use strict';

  var DEMO_SUBMIT_TEXT = 'Demo only \u2013 in the live site this would go straight to The Pilates Studio Yarm.';

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

  /* 1. Keyboard-Accessible Mobile Index Navigation */
  var navToggle = document.querySelector('.nav-toggle');
  var primaryNav = document.getElementById('primary-nav');

  function closeMobileNav(returnFocus) {
    if (!navToggle || !primaryNav) return;
    primaryNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    var labelSpan = navToggle.querySelector('.nav-toggle-text');
    if (labelSpan) labelSpan.textContent = 'Index';
    if (returnFocus) {
      navToggle.focus();
    }
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = navToggle.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMobileNav(false);
      } else {
        primaryNav.classList.add('is-open');
        navToggle.setAttribute('aria-expanded', 'true');
        var labelSpan = navToggle.querySelector('.nav-toggle-text');
        if (labelSpan) labelSpan.textContent = 'Close';
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
        event.preventDefault();
        closeMobileNav(true);
      }
    });

    document.addEventListener('click', function (event) {
      if (
        navToggle.getAttribute('aria-expanded') === 'true' &&
        !primaryNav.contains(event.target) &&
        !navToggle.contains(event.target)
      ) {
        closeMobileNav(false);
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 980 && navToggle.getAttribute('aria-expanded') === 'true') {
        closeMobileNav(false);
      }
    });
  }

  /* 2. Interactive "Which Practice Suits Your Body?" Sanctuary Guide (index.html) */
  var pathwayTabList = document.querySelector('.pathway-selector-grid[role="tablist"]');
  var activatePathwayById = null;

  if (pathwayTabList) {
    var pathwayTabs = Array.prototype.slice.call(pathwayTabList.querySelectorAll('[role="tab"]'));
    var pathwayPanels = Array.prototype.slice.call(document.querySelectorAll('.pathway-panel[role="tabpanel"]'));

    function activatePathway(targetTab, moveFocus) {
      if (!targetTab) return;
      var panelId = targetTab.getAttribute('aria-controls');
      pathwayTabs.forEach(function (tab) {
        var active = tab === targetTab;
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.setAttribute('tabindex', active ? '0' : '-1');
      });
      pathwayPanels.forEach(function (panel) {
        panel.hidden = panel.id !== panelId;
      });
      if (moveFocus) {
        targetTab.focus();
      }
    }

    activatePathwayById = function (tabId) {
      var target = document.getElementById(tabId);
      if (target) activatePathway(target, false);
    };

    pathwayTabs.forEach(function (tab, idx) {
      tab.addEventListener('click', function () {
        activatePathway(tab, false);
      });

      tab.addEventListener('keydown', function (event) {
        var nextIdx = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          nextIdx = (idx + 1) % pathwayTabs.length;
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          nextIdx = (idx - 1 + pathwayTabs.length) % pathwayTabs.length;
        } else if (event.key === 'Home') {
          nextIdx = 0;
        } else if (event.key === 'End') {
          nextIdx = pathwayTabs.length - 1;
        }
        if (nextIdx !== null) {
          event.preventDefault();
          activatePathway(pathwayTabs[nextIdx], true);
        }
      });
    });
  }

  /* 3. Interactive Timetable Filter + URL ?level= Pre-Filtering (timetable-booking.html) */
  var filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
  var slotCards = document.querySelectorAll('.class-slot-card[data-levels]');
  var dayGroups = document.querySelectorAll('.timetable-day-group');
  var filterCountEl = document.getElementById('filter-count');

  function applyTimetableFilter(selectedFilter) {
    if (!filterButtons.length) return;
    var visibleSlots = 0;

    filterButtons.forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-filter') === selectedFilter ? 'true' : 'false');
    });

    slotCards.forEach(function (card) {
      var levels = (card.getAttribute('data-levels') || '').split(',');
      var matches = selectedFilter === 'all' || levels.indexOf(selectedFilter) !== -1;
      card.hidden = !matches;
      if (matches) visibleSlots += 1;
    });

    dayGroups.forEach(function (group) {
      var visibleInDay = group.querySelectorAll('.class-slot-card:not([hidden])').length;
      group.hidden = visibleInDay === 0;
    });

    if (filterCountEl) {
      var activeBtn = document.querySelector('.filter-btn[data-filter="' + selectedFilter + '"]');
      var filterLabel = activeBtn ? activeBtn.textContent.trim() : 'All';
      if (selectedFilter === 'all') {
        filterCountEl.textContent = 'Showing all ' + visibleSlots + ' published Monday\u2013Thursday studio slots (10 group classes + 2 Monday 1:1/Reformer slots).';
      } else {
        filterCountEl.textContent = 'Showing ' + visibleSlots + ' weekly session' + (visibleSlots === 1 ? '' : 's') + ' matching "' + filterLabel + '".';
      }
    }
  }

  if (filterButtons.length > 0) {
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filterVal = btn.getAttribute('data-filter');
        applyTimetableFilter(filterVal);
      });
    });

    try {
      var params = new URLSearchParams(window.location.search);
      var preFilter = params.get('level');
      if (preFilter) {
        var targetFilterBtn = document.querySelector('.filter-btn[data-filter="' + preFilter + '"]');
        if (targetFilterBtn) {
          applyTimetableFilter(preFilter);
        }
      }
    } catch (e) {
      /* Ignore malformed query params */
    }
  }

  /* 4. Half-Term Block Calculator & Slot Pre-Selection */
  var bookingClassSelect = document.getElementById('booking-class');
  var bookingModeSelect = document.getElementById('booking-mode');
  var bookingHealthInput = document.getElementById('booking-health');
  var calcWeeksSelect = document.getElementById('calc-weeks');
  var calcFigureEl = document.getElementById('calc-figure');
  var calcSubEl = document.getElementById('calc-sub');
  var calcSelectedSlotEl = document.getElementById('calc-selected-slot');

  function updateBlockCalculator() {
    if (!calcFigureEl || !calcSubEl) return;
    var weeks = calcWeeksSelect ? parseInt(calcWeeksSelect.value, 10) || 8 : 8;
    var ratePerClass = 9;
    var mode = bookingModeSelect ? bookingModeSelect.value : 'block';
    var selectedClassVal = bookingClassSelect ? bookingClassSelect.value : '';

    if (selectedClassVal.indexOf('reformer') !== -1 && bookingModeSelect && mode !== 'reformer') {
      bookingModeSelect.value = 'reformer';
      mode = 'reformer';
    }

    if (calcSelectedSlotEl && bookingClassSelect) {
      var chosenOption = bookingClassSelect.options[bookingClassSelect.selectedIndex];
      calcSelectedSlotEl.textContent = chosenOption && chosenOption.value
        ? chosenOption.textContent
        : 'Select a weekly class slot';
    }

    if (mode === 'reformer') {
      calcFigureEl.textContent = '\u00A340.00 / hr';
      calcSubEl.textContent = 'Private 60-minute 1:1 or Reformer studio tuition by appointment at The Granary (5-session block rate confirmed on enquiry).';
    } else if (mode === 'waitlist') {
      calcFigureEl.textContent = '\u00A30.00 today';
      calcSubEl.textContent = 'Priority Waiting List \u2014 standard block rate (\u00A3' + (weeks * ratePerClass).toFixed(2) + ' for ' + weeks + ' weeks at \u00A39.00/class) only applies if a mat space opens.';
    } else {
      var total = weeks * ratePerClass;
      calcFigureEl.textContent = '\u00A3' + total.toFixed(2);
      calcSubEl.textContent = weeks + '-week half-term block at \u00A39.00 per class (Winter Term 2026 published block = 8 weeks / \u00A372.00).';
    }
  }

  if (bookingClassSelect || bookingModeSelect || calcWeeksSelect) {
    if (bookingClassSelect) bookingClassSelect.addEventListener('change', updateBlockCalculator);
    if (bookingModeSelect) bookingModeSelect.addEventListener('change', updateBlockCalculator);
    if (calcWeeksSelect) calcWeeksSelect.addEventListener('change', updateBlockCalculator);
    updateBlockCalculator();
  }

  var selectSlotButtons = document.querySelectorAll('[data-select-class]');
  selectSlotButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var classVal = button.getAttribute('data-select-class');
      var modeVal = button.getAttribute('data-select-mode') || 'block';
      var formEl = document.getElementById('booking-form');

      if (bookingClassSelect && classVal) {
        bookingClassSelect.value = classVal;
      }
      if (bookingModeSelect && modeVal) {
        bookingModeSelect.value = modeVal;
      }
      updateBlockCalculator();

      var chosenLabel = bookingClassSelect && bookingClassSelect.options[bookingClassSelect.selectedIndex]
        ? bookingClassSelect.options[bookingClassSelect.selectedIndex].textContent.split('([')[0].trim()
        : 'Granary slot';
      showMicroToast('Selected: ' + chosenLabel + ' \u2014 pre-filled below.');

      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var nameInput = document.getElementById('booking-name');
        if (nameInput) {
          window.setTimeout(function () {
            nameInput.focus({ preventScroll: true });
          }, 300);
        }
      }
    });
  });

  /* 5. 1:1 Reformer Quick-Select Buttons (reformer-tuition.html) */
  var reformerSlotButtons = document.querySelectorAll('[data-reformer-slot]');
  var reformerSlotSelect = document.getElementById('reformer-slot');
  var reformerFocusSelect = document.getElementById('reformer-focus');
  var reformerNotesInput = document.getElementById('reformer-notes');

  reformerSlotButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var slotVal = btn.getAttribute('data-reformer-slot');
      var formSection = document.getElementById('reformer-enquiry');
      if (reformerSlotSelect && slotVal) {
        reformerSlotSelect.value = slotVal;
      }
      showMicroToast('Monday ' + (slotVal === 'mon-1145' ? '11:45\u201312:45' : '10:30\u201311:30') + ' 1:1 slot pre-filled.');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var nameInput = document.getElementById('reformer-name');
        if (nameInput) {
          window.setTimeout(function () {
            nameInput.focus({ preventScroll: true });
          }, 300);
        }
      }
    });
  });

  /* 6. 1-Tap Practice Goal Presets (Sets A: index.html, timetable-booking.html, reformer-tuition.html) */
  var GOAL_PRESETS = {
    beginner: {
      toast: 'Complete Beginner Mat preset applied \u2014 Mon 18:15 & Wed 18:00 (\u00A39/class block) highlighted.',
      pathwayTab: 'ptab-gentle',
      filter: 'all',
      bookingClass: 'mon-1815-beginners',
      bookingMode: 'block',
      bookingNote: 'Goal: Complete Beginner Mat (\u00A39.00/class half-term block, Winter Term Mon 26 Oct \u2013 Fri 18 Dec 2026). New to Body Control Pilates\u00AE.',
      reformerFocus: 'taster-orientation',
      reformerSlot: 'mon-1030',
      reformerNote: 'Goal: Complete Beginner orientation before joining a \u00A39.00/class Monday or Wednesday half-term mat block.'
    },
    back4good: {
      toast: 'Back4Good\u00AE Low Back Care preset applied \u2014 back-friendly mat & 1:1 Granary sessions highlighted.',
      pathwayTab: 'ptab-back',
      filter: 'all',
      bookingClass: 'wed-1800-begimp',
      bookingMode: 'block',
      bookingNote: 'Goal: Back4Good\u00AE low-back care, spinal mobility and posture support with pre-class health screening.',
      reformerFocus: 'individual-mat',
      reformerSlot: 'mon-1030',
      reformerNote: 'Goal: Certified Back4Good\u00AE 1:1 spinal alignment & low-back assessment (\u00A340.00/hr).'
    },
    reformer: {
      toast: '1:1 Private Reformer (\u00A340/hr) preset applied \u2014 Monday 10:30 & 11:45 apparatus slots highlighted.',
      pathwayTab: 'ptab-gentle',
      filter: 'all',
      bookingClass: 'mon-1030-reformer',
      bookingMode: 'reformer',
      bookingNote: 'Goal: Private 1:1 Reformer apparatus session (\u00A340.00/hr by appointment at The Granary, 07702 300960).',
      reformerFocus: 'reformer-single',
      reformerSlot: 'mon-1030',
      reformerNote: 'Goal: 1:1 Private Reformer session (\u00A340.00/hr) focusing on calibrated spring alignment and core precision.'
    }
  };

  var presetButtons = document.querySelectorAll('.goal-preset-btn[data-goal-preset]');
  var presetTaggedEls = document.querySelectorAll('[data-preset-tags]');
  var homePresetCta = document.getElementById('home-preset-cta');

  function applyGoalPreset(presetKey, silent) {
    var cfg = GOAL_PRESETS[presetKey];
    if (!cfg) return;

    presetButtons.forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-goal-preset') === presetKey ? 'true' : 'false');
    });

    if (filterButtons.length > 0) {
      applyTimetableFilter(cfg.filter);
    }

    presetTaggedEls.forEach(function (el) {
      var tags = (el.getAttribute('data-preset-tags') || '').split(',');
      el.classList.toggle('is-preset-match', tags.indexOf(presetKey) !== -1);
    });

    if (activatePathwayById && cfg.pathwayTab) {
      activatePathwayById(cfg.pathwayTab);
    }

    if (homePresetCta) {
      homePresetCta.href = 'timetable-booking.html?preset=' + encodeURIComponent(presetKey) + '#booking-form';
      homePresetCta.hidden = false;
    }

    if (bookingClassSelect && cfg.bookingClass) {
      bookingClassSelect.value = cfg.bookingClass;
    }
    if (bookingModeSelect && cfg.bookingMode) {
      bookingModeSelect.value = cfg.bookingMode;
    }
    if (bookingHealthInput && (!bookingHealthInput.value || bookingHealthInput.getAttribute('data-preset-filled') === 'true')) {
      bookingHealthInput.value = cfg.bookingNote;
      bookingHealthInput.setAttribute('data-preset-filled', 'true');
    }
    updateBlockCalculator();

    if (reformerFocusSelect && cfg.reformerFocus) {
      reformerFocusSelect.value = cfg.reformerFocus;
    }
    if (reformerSlotSelect && cfg.reformerSlot) {
      reformerSlotSelect.value = cfg.reformerSlot;
    }
    if (reformerNotesInput && (!reformerNotesInput.value || reformerNotesInput.getAttribute('data-preset-filled') === 'true')) {
      reformerNotesInput.value = cfg.reformerNote;
      reformerNotesInput.setAttribute('data-preset-filled', 'true');
    }

    if (!silent) {
      showMicroToast(cfg.toast);
    }
  }

  if (bookingHealthInput) {
    bookingHealthInput.addEventListener('input', function () {
      bookingHealthInput.removeAttribute('data-preset-filled');
    });
  }
  if (reformerNotesInput) {
    reformerNotesInput.addEventListener('input', function () {
      reformerNotesInput.removeAttribute('data-preset-filled');
    });
  }

  presetButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-goal-preset');
      applyGoalPreset(key, false);
    });
  });

  try {
    var presetParams = new URLSearchParams(window.location.search);
    var urlPreset = presetParams.get('preset');
    if (urlPreset && GOAL_PRESETS[urlPreset]) {
      applyGoalPreset(urlPreset, false);
    }
  } catch (err) {
    /* Ignore URL parse errors */
  }

  /* 7. Native <dialog> Photo Lightbox */
  var lightboxDialog = document.getElementById('photo-lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxCaption = document.getElementById('lightbox-caption');
  var lightboxCta = document.getElementById('lightbox-cta');
  var lastLightboxTrigger = null;

  function openLightbox(triggerEl) {
    if (!lightboxDialog || !lightboxImg) return;
    lastLightboxTrigger = triggerEl;
    var src = triggerEl.getAttribute('data-lightbox-src');
    var alt = triggerEl.getAttribute('data-lightbox-alt') || '';
    var caption = triggerEl.getAttribute('data-lightbox-caption') || '';
    var ctaHref = triggerEl.getAttribute('data-lightbox-cta') || '#booking-form';
    var ctaLabel = triggerEl.getAttribute('data-lightbox-cta-label') || 'Reserve Session';

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
    if (lastLightboxTrigger && typeof lastLightboxTrigger.focus === 'function') {
      lastLightboxTrigger.focus({ preventScroll: true });
    }
  }

  if (lightboxDialog) {
    document.querySelectorAll('.is-lightbox-trigger').forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        openLightbox(trigger);
      });
      trigger.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openLightbox(trigger);
        }
      });
    });

    lightboxDialog.querySelectorAll('[data-lightbox-close]').forEach(function (btn) {
      btn.addEventListener('click', closeLightbox);
    });

    lightboxDialog.addEventListener('click', function (event) {
      if (event.target === lightboxDialog) {
        closeLightbox();
      }
    });

    if (lightboxCta) {
      lightboxCta.addEventListener('click', function () {
        var href = lightboxCta.getAttribute('href') || '';
        if (href.charAt(0) === '#') {
          closeLightbox();
        }
      });
    }
  }

  /* 8. Smart Form & Footer Auto-Clearance for Floating Mobile Dock */
  var mobileDock = document.querySelector('.mobile-action-bar');
  if (mobileDock && 'IntersectionObserver' in window) {
    var clearanceTargets = document.querySelectorAll('main form, footer.site-footer');
    var activeZones = new Set();
    var dockObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          activeZones.add(entry.target);
        } else {
          activeZones.delete(entry.target);
        }
      });
      mobileDock.classList.toggle('is-dock-hidden', activeZones.size > 0);
    }, { threshold: 0.08 });

    clearanceTargets.forEach(function (target) {
      dockObserver.observe(target);
    });
  }

  /* 9. Accessible Form Validation + Live Digital Enquiry Ticket */
  function validateField(field) {
    var errorId = field.getAttribute('aria-describedby');
    var errorEl = errorId ? document.getElementById(errorId) : null;
    var valid = true;
    var message = '';

    if (field.type === 'checkbox') {
      if (field.required && !field.checked) {
        valid = false;
        message = 'Please confirm this health screening acknowledgement before submitting.';
      }
    } else {
      var val = (field.value || '').trim();
      if (field.required && !val) {
        valid = false;
        message = 'Please complete this required field.';
      } else if (val && field.type === 'email') {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(val)) {
          valid = false;
          message = 'Please enter a valid email address (for example name@example.co.uk).';
        }
      } else if (val && field.type === 'tel') {
        var digits = val.replace(/\D/g, '');
        if (digits.length < 7) {
          valid = false;
          message = 'Please enter a valid UK contact telephone number.';
        }
      }
    }

    if (!valid) {
      field.setAttribute('aria-invalid', 'true');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.hidden = false;
      }
    } else {
      field.removeAttribute('aria-invalid');
      if (errorEl) {
        errorEl.textContent = '';
        errorEl.hidden = true;
      }
    }

    return valid;
  }

  function getSelectedLabel(selectEl) {
    if (!selectEl || !selectEl.options || selectEl.selectedIndex < 0) return '';
    return selectEl.options[selectEl.selectedIndex].textContent.trim();
  }

  function buildReceiptTicket(form, confirmationBox) {
    var nameField = form.querySelector('[name="full_name"]');
    var phoneField = form.querySelector('[name="phone"]');
    var emailField = form.querySelector('[name="email"]');
    var classField = form.querySelector('[name="booking_class"], [name="session_focus"]');
    var modeField = form.querySelector('[name="booking_mode"], [name="preferred_slot"]');
    var notesField = form.querySelector('textarea');

    var clientName = nameField ? nameField.value.trim() : 'Guest';
    var contactStr = [
      phoneField ? phoneField.value.trim() : '',
      emailField ? emailField.value.trim() : ''
    ].filter(Boolean).join(' \u00B7 ');
    var sessionStr = classField ? getSelectedLabel(classField).split('([')[0].trim() : 'Granary Studio Session';
    var windowStr = modeField ? getSelectedLabel(modeField) : 'Winter Term 2026 (Mon 26 Oct \u2013 Fri 18 Dec 2026)';
    var notesStr = notesField && notesField.value.trim() ? notesField.value.trim() : 'Standard pre-class health screening';
    var refCode = 'PSY-' + String(Math.floor(1000 + Math.random() * 9000));

    var plainSummary = [
      'The Pilates Studio Yarm \u2014 Enquiry Summary (' + refCode + ')',
      'Client: ' + clientName,
      'Contact: ' + contactStr,
      'Selected Session: ' + sessionStr,
      'Booking Window / Type: ' + windowStr,
      'Notes: ' + notesStr
    ].join('\n');

    confirmationBox.textContent = '';

    var verbatimP = document.createElement('p');
    verbatimP.className = 'demo-verbatim-notice';
    verbatimP.textContent = DEMO_SUBMIT_TEXT;
    confirmationBox.appendChild(verbatimP);

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
    var rows = [
      ['Client Name', clientName],
      ['Direct Contact', contactStr],
      ['Selected Class / Tuition', sessionStr],
      ['Preferred Block / Window', windowStr],
      ['Screening & Goal Notes', notesStr]
    ];
    rows.forEach(function (pair) {
      var wrap = document.createElement('div');
      var dt = document.createElement('dt');
      dt.textContent = pair[0];
      var dd = document.createElement('dd');
      dd.textContent = pair[1];
      wrap.appendChild(dt);
      wrap.appendChild(dd);
      dl.appendChild(wrap);
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
        navigator.clipboard.writeText(plainSummary).then(function () {
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
      confirmationBox.hidden = true;
      confirmationBox.textContent = '';
      updateBlockCalculator();
      showMicroToast('Demo form reset.');
    });

    actions.appendChild(copyBtn);
    actions.appendChild(resetBtn);
    ticket.appendChild(actions);

    confirmationBox.appendChild(ticket);
  }

  var demoForms = document.querySelectorAll('form[data-demo-form]');
  demoForms.forEach(function (form) {
    var fields = form.querySelectorAll('input, select, textarea');
    var confirmationBox = form.querySelector('.form-confirmation');

    fields.forEach(function (field) {
      var eventName = field.tagName === 'SELECT' || field.type === 'checkbox' ? 'change' : 'input';
      field.addEventListener(eventName, function () {
        if (field.getAttribute('aria-invalid') === 'true') {
          validateField(field);
        }
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var firstInvalid = null;
      fields.forEach(function (field) {
        var isFieldValid = validateField(field);
        if (!isFieldValid && !firstInvalid) {
          firstInvalid = field;
        }
      });

      if (firstInvalid) {
        if (confirmationBox) {
          confirmationBox.hidden = true;
        }
        firstInvalid.focus();
        return;
      }

      if (confirmationBox) {
        buildReceiptTicket(form, confirmationBox);
        confirmationBox.hidden = false;
        confirmationBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  });
})();

// === Gallery Inspiration Polish (Awwwards / Godly / Mobbin) ===
(function () {
  'use strict';

  function initGalleryPolish() {
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. Subtle Top Header Reading-Progress Hairline (2.5px brand accent)
    var hdr = document.querySelector('header');
    if (hdr && !hdr.querySelector('.scroll-progress-rail')) {
      var cs = window.getComputedStyle(hdr);
      if (cs.position === 'static') {
        hdr.style.position = 'relative';
      }
      var rail = document.createElement('div');
      rail.className = 'scroll-progress-rail';
      rail.setAttribute('aria-hidden', 'true');
      hdr.appendChild(rail);
      var ticking = false;
      var updateRail = function () {
        var docH = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = docH > 40 ? Math.min(1, Math.max(0, window.scrollY / docH)) : 0;
        rail.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
        ticking = false;
      };
      window.addEventListener('scroll', function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(updateRail);
        }
      }, { passive: true });
      updateRail();
    }

    // 2. Choreographed Below-the-Fold Scroll Reveals
    if (!reduced && 'IntersectionObserver' in window) {
      var targets = document.querySelectorAll('.studio-card, .class-slot-card, .arch-photo-diptych .editorial-figure');
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.08 });

      var vh = window.innerHeight || 800;
      var staggerIdx = 0;
      targets.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.top > vh * 0.96) {
          el.style.setProperty('--reveal-delay', ((staggerIdx % 3) * 55) + 'ms');
          staggerIdx++;
          el.classList.add('reveal-ready');
          obs.observe(el);
        }
      });

      window.addEventListener('hashchange', function () {
        document.querySelectorAll('.reveal-ready:not(.is-revealed)').forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight * 1.1) {
            el.classList.add('is-revealed');
          }
        });
      });
    }

    // 3. Live factual Winter Term week indicator (26 Oct 2026 - 18 Dec 2026)
    var bar = document.querySelector('.editorial-index-bar span:first-child');
    if (bar) {
      var now = new Date();
      var start = new Date(2026, 9, 26);
      var end = new Date(2026, 11, 18, 23, 59, 59);
      if (now >= start && now <= end) {
        var weekNum = Math.min(8, Math.max(1, Math.floor((now - start) / (7 * 86400000)) + 1));
        if (bar.textContent.indexOf('Week ') === -1) {
          bar.textContent = bar.textContent + ' \u00B7 Week ' + weekNum + ' of 8';
        }
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGalleryPolish);
  } else {
    initGalleryPolish();
  }
})();

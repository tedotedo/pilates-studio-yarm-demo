/* ==========================================================================
   The Pilates Studio Yarm — Client-Side Navigation, Sanctuary Pathway Guide,
   URL-Aware Timetable Filter, Block Fee Calculator & Accessible Dummy Forms
   Zero external network calls · Keyboard accessible · Concept demonstration
   ========================================================================== */

(function () {
  'use strict';

  var DEMO_SUBMIT_TEXT = 'Demo only \u2013 in the live site this would go straight to The Pilates Studio Yarm.';

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
  if (pathwayTabList) {
    var pathwayTabs = Array.prototype.slice.call(pathwayTabList.querySelectorAll('[role="tab"]'));
    var pathwayPanels = Array.prototype.slice.call(document.querySelectorAll('.pathway-panel[role="tabpanel"]'));

    function activatePathway(targetTab, moveFocus) {
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
  var calcWeeksSelect = document.getElementById('calc-weeks');
  var calcFigureEl = document.getElementById('calc-figure');
  var calcSubEl = document.getElementById('calc-sub');
  var calcSelectedSlotEl = document.getElementById('calc-selected-slot');

  function updateBlockCalculator() {
    if (!calcFigureEl || !calcSubEl) return;
    var weeks = calcWeeksSelect ? parseInt(calcWeeksSelect.value, 10) || 8 : 8;
    var ratePerClass = 9;
    var mode = bookingModeSelect ? bookingModeSelect.value : 'block';

    if (calcSelectedSlotEl && bookingClassSelect) {
      var chosenOption = bookingClassSelect.options[bookingClassSelect.selectedIndex];
      calcSelectedSlotEl.textContent = chosenOption && chosenOption.value
        ? chosenOption.textContent
        : 'Select a weekly class slot';
    }

    if (mode === 'waitlist') {
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
  reformerSlotButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var slotVal = btn.getAttribute('data-reformer-slot');
      var formSection = document.getElementById('reformer-enquiry');
      if (reformerSlotSelect && slotVal) {
        reformerSlotSelect.value = slotVal;
      }
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

  /* 6. Accessible Client-Side Dummy Form Validation & Submission */
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
        confirmationBox.textContent = DEMO_SUBMIT_TEXT;
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

    // 1. Subtle Top Header Reading-Progress Hairline
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

    // 2. Choreographed Below-the-Fold Scroll Reveals (Godly / SiteInspire)
    if (!reduced && 'IntersectionObserver' in window) {
      var targets = document.querySelectorAll('.schedule-day-col, .tuition-card, .folio-panel, .apparatus-card, .faq-entry, .sanctuary-card');
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
        if (rect.top > vh * 0.94) {
          el.style.setProperty('--reveal-delay', ((staggerIdx % 3) * 55) + 'ms');
          staggerIdx++;
          el.classList.add('reveal-ready');
          obs.observe(el);
        }
      });

      // Safety fallback on hash jump so targeted sections reveal immediately
      window.addEventListener('hashchange', function () {
        document.querySelectorAll('.reveal-ready:not(.is-revealed)').forEach(function (el) {
          if (el.getBoundingClientRect().top < window.innerHeight * 1.1) {
            el.classList.add('is-revealed');
          }
        });
      });
    }

    // 3. Mobbin Smart Date Defaults + 1-Tap Quick Date Chips
    function toIso(d) {
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return d.getFullYear() + '-' + m + '-' + day;
    }
    function nextWeekday(base, targetDow) {
      var diff = (targetDow - base.getDay() + 7) % 7;
      if (diff === 0) diff = 7;
      return new Date(base.getFullYear(), base.getMonth(), base.getDate() + diff);
    }

    var today = new Date();
    var todayIso = toIso(today);
    document.querySelectorAll('input[type="date"]').forEach(function (input) {
      if (!input.min) {
        input.min = todayIso;
      }
      var fieldWrap = input.parentElement;
      if (!fieldWrap || fieldWrap.querySelector('[data-friday-chips]') || fieldWrap.querySelector('.quick-date-chips')) {
        return;
      }
      var isReturn = input.id === 'return-date';
      var chipRow = document.createElement('div');
      chipRow.className = 'quick-date-chips';
      chipRow.setAttribute('aria-label', 'Quick date options');

      var presets = [];
      if (isReturn) {
        presets = [
          { label: 'Same Day', calc: function () { var o = document.getElementById('outbound-date'); return (o && o.value) ? o.value : todayIso; } },
          { label: '+2 Days', calc: function () {
            var o = document.getElementById('outbound-date');
            var base = (o && o.value) ? new Date(o.value + 'T12:00:00') : today;
            return toIso(new Date(base.getFullYear(), base.getMonth(), base.getDate() + 2));
          } }
        ];
      } else {
        var tmrw = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        var fri = today.getDay() === 5 ? today : nextWeekday(today, 5);
        var sat = today.getDay() === 6 ? today : nextWeekday(today, 6);
        presets = [
          { label: 'Tomorrow', iso: toIso(tmrw) },
          { label: (today.getDay() === 5 ? 'Tonight (Fri)' : 'This Friday'), iso: toIso(fri) },
          { label: (today.getDay() === 6 ? 'Today (Sat)' : 'This Saturday'), iso: toIso(sat) }
        ];
      }

      presets.forEach(function (p) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quick-date-chip';
        btn.textContent = p.label;
        btn.addEventListener('click', function () {
          var val = p.calc ? p.calc() : p.iso;
          input.value = val;
          chipRow.querySelectorAll('.quick-date-chip').forEach(function (c) { c.classList.remove('is-selected'); });
          btn.classList.add('is-selected');
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        chipRow.appendChild(btn);
      });

      input.insertAdjacentElement('afterend', chipRow);
    });

  // Live factual Winter Term week indicator (26 Oct 2026 - 18 Dec 2026)
  (function () {
    var bar = document.querySelector('.editorial-index-bar span:first-child');
    if (!bar) return;
    var now = new Date();
    var start = new Date(2026, 9, 26); // 26 Oct 2026
    var end = new Date(2026, 11, 18, 23, 59, 59); // 18 Dec 2026
    if (now >= start && now <= end) {
      var weekNum = Math.min(8, Math.max(1, Math.floor((now - start) / (7 * 86400000)) + 1));
      if (bar.textContent.indexOf('Week ') === -1) {
        bar.textContent = bar.textContent + ' · Week ' + weekNum + ' of 8';
      }
    }
  })();

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGalleryPolish);
  } else {
    initGalleryPolish();
  }
})();

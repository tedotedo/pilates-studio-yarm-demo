/* ==========================================================================
   The Pilates Studio Yarm — Client-Side Navigation, Timetable Filter & Forms
   Zero external network calls · Keyboard accessible · Concept demonstration
   ========================================================================== */

(function () {
  'use strict';

  var DEMO_SUBMIT_TEXT = 'Demo only \u2013 in the live site this would go straight to The Pilates Studio Yarm.';

  /* 1. Keyboard-Accessible Mobile Navigation */
  var navToggle = document.querySelector('.nav-toggle');
  var primaryNav = document.getElementById('primary-nav');

  function closeMobileNav(returnFocus) {
    if (!navToggle || !primaryNav) return;
    primaryNav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    var labelSpan = navToggle.querySelector('.nav-toggle-text');
    if (labelSpan) labelSpan.textContent = 'Menu';
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
      if (window.innerWidth >= 900 && navToggle.getAttribute('aria-expanded') === 'true') {
        closeMobileNav(false);
      }
    });
  }

  /* 2. Interactive Timetable Filter (timetable-booking.html) */
  var filterButtons = document.querySelectorAll('.filter-btn[data-filter]');
  var slotCards = document.querySelectorAll('.class-slot-card[data-levels]');
  var dayGroups = document.querySelectorAll('.timetable-day-group');
  var filterCountEl = document.getElementById('filter-count');

  function applyTimetableFilter(selectedFilter) {
    var visibleSlots = 0;

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
        filterButtons.forEach(function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        applyTimetableFilter(filterVal);
      });
    });
  }

  /* 3. Half-Term Block Calculator & Slot Pre-Selection */
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

  /* 4. 1:1 Reformer Quick-Select Buttons (reformer-tuition.html) */
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

  /* 5. Accessible Client-Side Dummy Form Validation & Submission */
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

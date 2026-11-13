/* ==========================================================================
   The Pilates Studio Yarm — Concept Set B Interactive Controller
   Top scroll-progress hairline, 4-frame lookbook rail (01 / 04 + dots + arrows),
   1-tap practice goal presets, micro-toast, <dialog> lightbox, smart dock
   auto-clearance, dynamic fee ledger & live owner-receipt enquiry ticket
   Zero external network requests
   ========================================================================== */

(function () {
  'use strict';

  var DEMO_CONFIRMATION = 'Demo only \u2013 in the live site this would go straight to The Pilates Studio Yarm.';

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

  /* 2. Horizontal Touch-Snap Movement Reel & Body-Focus Filter */
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

  function applyReelFilter(focus) {
    var shown = 0;
    var activePill = null;
    focusPills.forEach(function (p) {
      var isTarget = p.getAttribute('data-focus') === focus;
      p.setAttribute('aria-pressed', isTarget ? 'true' : 'false');
      if (isTarget) activePill = p;
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
        var label = activePill ? activePill.textContent.trim() : focus;
        reelStatus.textContent = 'Showing ' + shown + ' studio session' + (shown === 1 ? '' : 's') + ' matched to ' + label + '.';
      }
    }
  }

  if (focusPills.length && reelCards.length) {
    focusPills.forEach(function (pill) {
      pill.addEventListener('click', function () {
        applyReelFilter(pill.getAttribute('data-focus'));
      });
    });
  }

  /* 3. 4-Frame Sanctuary Lookbook Rail (01 / 04 Counter + Arrows + Dots) */
  var lookbookRail = document.getElementById('lookbook-rail');
  var lookbookCounter = document.getElementById('lookbook-counter');
  var lookbookPrev = document.getElementById('lookbook-prev');
  var lookbookNext = document.getElementById('lookbook-next');
  var lookbookFrames = lookbookRail ? Array.prototype.slice.call(lookbookRail.querySelectorAll('.lookbook-frame')) : [];
  var lookbookDots = Array.prototype.slice.call(document.querySelectorAll('.lookbook-dot[data-lookbook-index]'));
  var currentLookbookIdx = 0;

  function syncLookbookUI(idx) {
    if (!lookbookFrames.length) return;
    currentLookbookIdx = Math.max(0, Math.min(lookbookFrames.length - 1, idx));
    var numStr = String(currentLookbookIdx + 1).padStart(2, '0') + ' / ' + String(lookbookFrames.length).padStart(2, '0');
    if (lookbookCounter) {
      lookbookCounter.textContent = numStr;
    }
    lookbookDots.forEach(function (dot, i) {
      var active = i === currentLookbookIdx;
      dot.classList.toggle('is-active', active);
      dot.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function scrollToLookbookFrame(idx) {
    if (!lookbookRail || !lookbookFrames.length) return;
    var bounded = (idx + lookbookFrames.length) % lookbookFrames.length;
    var target = lookbookFrames[bounded];
    if (target) {
      lookbookRail.scrollTo({ left: target.offsetLeft - lookbookRail.offsetLeft, behavior: 'smooth' });
      syncLookbookUI(bounded);
    }
  }

  if (lookbookRail && lookbookFrames.length) {
    var lbTicking = false;
    lookbookRail.addEventListener('scroll', function () {
      if (lbTicking) return;
      lbTicking = true;
      window.requestAnimationFrame(function () {
        var scrollLeft = lookbookRail.scrollLeft;
        var closest = 0;
        var minDist = Infinity;
        lookbookFrames.forEach(function (frame, i) {
          var dist = Math.abs((frame.offsetLeft - lookbookRail.offsetLeft) - scrollLeft);
          if (dist < minDist) {
            minDist = dist;
            closest = i;
          }
        });
        syncLookbookUI(closest);
        lbTicking = false;
      });
    }, { passive: true });

    if (lookbookPrev) {
      lookbookPrev.addEventListener('click', function () {
        scrollToLookbookFrame(currentLookbookIdx - 1);
      });
    }
    if (lookbookNext) {
      lookbookNext.addEventListener('click', function () {
        scrollToLookbookFrame(currentLookbookIdx + 1);
      });
    }
    lookbookDots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var idx = parseInt(dot.getAttribute('data-lookbook-index'), 10) || 0;
        scrollToLookbookFrame(idx);
      });
    });
  }

  /* 4. Sanctuary Reservation Ledger Live Sync */
  var modeSelect = document.getElementById('pb-mode');
  var slotSelect = document.getElementById('pb-slot');
  var notesInput = document.getElementById('pb-notes');
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

  /* 5. 1-Tap Practice Goal Presets */
  var GOAL_PRESETS = {
    beginner: {
      focus: 'beginner',
      slot: 'mon-1815-beginners',
      mode: 'block',
      note: 'Goal: Complete Beginner Mat (\u00A39.00/class half-term block, Winter Term Mon 26 Oct \u2013 Fri 18 Dec 2026).',
      toast: 'Complete Beginner Mat preset selected \u2014 Mon 18:15 & Wed 18:00 (\u00A39/class) highlighted & pre-filled.'
    },
    back4good: {
      focus: 'back4good',
      slot: 'wed-1800-begimp',
      mode: 'block',
      note: 'Goal: Back4Good\u00AE low-back care, spinal mobility and posture support with pre-class health screening.',
      toast: 'Back4Good\u00AE Low Back Care preset selected \u2014 back-friendly Granary sessions highlighted & pre-filled.'
    },
    reformer: {
      focus: 'reformer',
      slot: 'mon-1030-reformer',
      mode: 'reformer',
      note: 'Goal: 1:1 Private Reformer session (\u00A340.00/hr by appointment at The Granary, 07702 300960).',
      toast: '1:1 Private Reformer (\u00A340/hr) preset selected \u2014 Mon 10:30 & 11:45 apparatus slots highlighted & pre-filled.'
    }
  };

  var presetChips = document.querySelectorAll('.b-preset-chip[data-goal-preset]');
  var presetJump = document.getElementById('b-preset-jump');

  if (notesInput) {
    notesInput.addEventListener('input', function () {
      notesInput.removeAttribute('data-preset-filled');
    });
  }

  presetChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var key = chip.getAttribute('data-goal-preset');
      var cfg = GOAL_PRESETS[key];
      if (!cfg) return;

      presetChips.forEach(function (c) {
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });

      applyReelFilter(cfg.focus);

      reelCards.forEach(function (card) {
        var tags = (card.getAttribute('data-focus-tags') || '').split(',');
        card.classList.toggle('is-preset-match', tags.indexOf(cfg.focus) !== -1);
      });

      if (slotSelect) slotSelect.value = cfg.slot;
      if (modeSelect) modeSelect.value = cfg.mode;
      if (notesInput && (!notesInput.value || notesInput.getAttribute('data-preset-filled') === 'true')) {
        notesInput.value = cfg.note;
        notesInput.setAttribute('data-preset-filled', 'true');
      }
      updateSummaryLedger();

      if (presetJump) presetJump.hidden = false;
      showMicroToast(cfg.toast);
    });
  });

  /* 6. One-Tap Session Pickers from Reel & Vellum Card */
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

      var meta = SLOT_METADATA[slotKey];
      showMicroToast('Selected: ' + (meta ? meta.label : 'Granary session') + ' \u2014 pre-filled below.');

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

  /* 7. Native <dialog> Photo Lightbox */
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
    var ctaHref = el.getAttribute('data-lightbox-cta') || '#sanctuary-booking';
    var ctaLabel = el.getAttribute('data-lightbox-cta-label') || 'Reserve Space';

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
      lightboxCta.addEventListener('click', function () {
        closeLightbox();
      });
    }
  }

  /* 8. Smart Form & Footer Auto-Clearance for Floating Sanctuary Dock */
  var floatingDock = document.querySelector('.floating-pill-dock');
  if (floatingDock && 'IntersectionObserver' in window) {
    var watched = document.querySelectorAll('#pilates-b-form, footer.sanctuary-footer');
    var inViewSet = new Set();
    var dockObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          inViewSet.add(entry.target);
        } else {
          inViewSet.delete(entry.target);
        }
      });
      floatingDock.classList.toggle('is-dock-hidden', inViewSet.size > 0);
    }, { threshold: 0.08 });

    watched.forEach(function (el) {
      dockObs.observe(el);
    });
  }

  /* 9. Accessible Form Validation + Live Owner-Receipt Summary Ticket */
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

      if (!phoneEl.value.trim() || phoneEl.value.replace(/\D/g, '').length < 7) {
        setError('err-pb-phone', 'Please enter a valid UK contact telephone number.');
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
        var clientName = nameEl.value.trim();
        var contactStr = phoneEl.value.trim() + ' \u00B7 ' + emailVal;
        var slotMeta = SLOT_METADATA[slotSelect.value];
        var sessionStr = slotMeta ? slotMeta.label : slotSelect.options[slotSelect.selectedIndex].text;
        var pathwayStr = modeSelect.options[modeSelect.selectedIndex].text;
        var notesStr = notesInput && notesInput.value.trim() ? notesInput.value.trim() : 'Standard Body Control Pilates\u00AE pre-class screening';
        var refCode = 'PSY-' + String(Math.floor(1000 + Math.random() * 9000));

        var summaryText = [
          'The Pilates Studio Yarm \u2014 Enquiry Summary (' + refCode + ')',
          'Client: ' + clientName,
          'Contact: ' + contactStr,
          'Selected Session: ' + sessionStr,
          'Booking Pathway: ' + pathwayStr,
          'Notes: ' + notesStr
        ].join('\n');

        confirmBox.textContent = '';

        var verbatimP = document.createElement('p');
        verbatimP.className = 'demo-verbatim-notice';
        verbatimP.textContent = DEMO_CONFIRMATION;
        confirmBox.appendChild(verbatimP);

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
          ['Selected Granary Session', sessionStr],
          ['Booking Pathway', pathwayStr],
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
          confirmBox.hidden = true;
          confirmBox.textContent = '';
          updateSummaryLedger();
          showMicroToast('Demo form reset.');
        });

        actions.appendChild(copyBtn);
        actions.appendChild(resetBtn);
        ticket.appendChild(actions);
        confirmBox.appendChild(ticket);

        confirmBox.hidden = false;
        confirmBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }
})();

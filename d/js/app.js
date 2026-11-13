/* The Pilates Studio Yarm — Concept D: The Term Card (demo only)
   Timetable is the studio's published Monday–Thursday schedule; availability is illustrative. */
(function () {
  'use strict';

  var DAYS = [
    { name: 'Mon', full: 'Monday', classes: [
      { id: 'mon-1815', t: '18:15–19:15', n: 'Beginners', lv: ['beg'], left: 3 },
      { id: 'mon-1930', t: '19:30–20:30', n: 'Improvers', lv: ['imp'], left: 0 } ] },
    { name: 'Tue', full: 'Tuesday', classes: [
      { id: 'tue-1815', t: '18:15–19:15', n: 'Improvers', lv: ['imp'], left: 3 },
      { id: 'tue-1930', t: '19:30–20:30', n: 'Intermediate / Advanced', lv: ['adv'], left: 3 } ] },
    { name: 'Wed', full: 'Wednesday', classes: [
      { id: 'wed-0930', t: '09:30–10:30', n: 'Functional', sub: 'Osteoporosis friendly', lv: ['fun'], left: 3 },
      { id: 'wed-1045', t: '10:45–11:45', n: 'Power', lv: ['pow'], left: 0 },
      { id: 'wed-1800', t: '18:00–19:00', n: 'Beginners / Improvers', lv: ['beg', 'imp'], left: 3 } ] },
    { name: 'Thu', full: 'Thursday', classes: [
      { id: 'thu-0930', t: '09:30–10:30', n: 'Intermediate / Advanced', lv: ['adv'], left: 0 },
      { id: 'thu-1045', t: '10:45–11:45', n: 'Improvers', lv: ['imp'], left: 3 },
      { id: 'thu-1815', t: '18:15–19:15', n: 'Intermediate / Advanced', lv: ['adv'], left: 3 } ] }
  ];

  var weekEl = document.querySelector('[data-week]');
  var reserve = document.querySelector('[data-reserve]');
  var selected = null, level = 'all', byId = {};

  function dots(n) {
    var s = '';
    for (var i = 0; i < 3; i++) s += '<i class="dot' + (i < n ? ' dot--on' : '') + '"></i>';
    return s;
  }

  DAYS.forEach(function (d) {
    var day = document.createElement('div');
    day.className = 'day';
    day.innerHTML = '<h3 class="day__name">' + d.name + '<span class="visually-hidden"> ' + d.full + '</span></h3><div class="day__list"></div>';
    d.classes.forEach(function (c) {
      c.day = d.full; byId[c.id] = c;
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'cls'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('data-id', c.id);
      b.innerHTML = '<span class="cls__time">' + c.t.split('–')[0] + '</span>' +
        '<span class="cls__name">' + c.n + (c.sub ? '<small>' + c.sub + '</small>' : '') + '</span>' +
        '<span class="cls__dots" aria-hidden="true">' + dots(c.left) + '</span>' +
        '<span class="visually-hidden">' + (c.left ? 'places left' : 'full, waiting list open') + '</span>';
      b.addEventListener('click', function () { pick(c.id, true); });
      day.querySelector('.day__list').appendChild(b);
    });
    weekEl.appendChild(day);
  });

  function pick(id, scroll) {
    selected = byId[id];
    Array.prototype.forEach.call(document.querySelectorAll('.cls'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-id') === id ? 'true' : 'false');
    });
    var full = selected.left === 0;
    reserve.hidden = false;
    document.querySelector('[data-r-mode]').textContent = full ? 'Join the waiting list' : 'Reserve a place';
    document.querySelector('[data-r-class]').textContent = selected.n + (selected.sub ? ' (' + selected.sub.toLowerCase() + ')' : '');
    document.querySelector('[data-r-when]').textContent = selected.day + ', ' + selected.t + ' · The Granary';
    document.querySelector('[data-r-price]').textContent = full ? 'This class is full. We will contact you when a mat comes free.' : '8-week block · £72.00';
    document.querySelector('[data-r-btn]').textContent = full ? 'Join the waiting list' : 'Request this place';
    document.querySelector('[data-r-done]').hidden = true;
    if (scroll) reserve.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-level]'), function (chip, i, all) {
    chip.addEventListener('click', function () {
      level = chip.getAttribute('data-level');
      Array.prototype.forEach.call(all, function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      Array.prototype.forEach.call(document.querySelectorAll('.cls'), function (b) {
        var c = byId[b.getAttribute('data-id')];
        b.classList.toggle('is-dim', level !== 'all' && c.lv.indexOf(level) === -1);
      });
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-pick]'), function (b) {
    b.addEventListener('click', function () { pick(b.getAttribute('data-pick'), true); });
  });

  var form = document.querySelector('[data-reserve-form]');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = form.elements, err = document.querySelector('[data-r-error]'), done = document.querySelector('[data-r-done]');
    if (!f.name.value.trim() || !f.phone.value.trim()) { err.hidden = false; done.hidden = true; return; }
    err.hidden = true; done.hidden = false;
    done.textContent = (selected.left ? 'Place requested: ' : 'Waiting list: ') + selected.n + ', ' + selected.day + ' ' + selected.t +
      '. Demo only, nothing has been sent.';
  });
})();

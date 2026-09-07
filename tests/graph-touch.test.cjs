const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

function source(file) {
  return fs.readFileSync(path.join(__dirname, '..', 'seiten', file), 'utf8');
}

// Exercise the actual pointer handlers without needing a browser or the lesson UI.
function handler(text, marker) {
  const start = text.indexOf(marker);
  assert.notEqual(start, -1, marker);
  const open = text.indexOf('{', start);
  let depth = 1;
  let end = open + 1;
  while (depth && end < text.length) {
    if (text[end] === '{') depth++;
    if (text[end] === '}') depth--;
    end++;
  }
  assert.equal(depth, 0);
  return '(function (ev) ' + text.slice(open, end) + ')';
}

function event(pointerType, pointerId = 7) {
  return { pointerType, pointerId, clientX: 60, clientY: 40,
    target: { classList: { contains: () => false }, getAttribute: () => null },
    preventDefault() { this.prevented = true; } };
}

test('affine graph background scrolls on touch and still positions with the mouse', () => {
  let changes = 0;
  const context = { P: { size: 100, cx: 50, cy: 50, unit: 10,
    el: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100 }) } },
    m: {}, activeHandleKey: 't', snap: v => v, clampC: v => v,
    applyHandle: () => changes++, onChange() {} };
  const run = vm.runInNewContext(handler(source('Affines-Matrixlabor.html'),
    'P.el.addEventListener("pointerdown", function(ev)'), context);
  const touch = event('touch');
  run(touch);
  assert.equal(changes, 0, 'scrolling must not move the active handle');
  assert.equal(touch.prevented, undefined);
  run(event('mouse'));
  assert.equal(changes, 1);
});

test('Phong graph background scrolls on touch and still positions with the mouse', () => {
  let changes = 0;
  const context = { activePhongTarget: 'light', SC: { light: [1, 2] },
    svgPoint: () => ({ x: 3, y: 4 }), runLab: () => changes++ };
  const run = vm.runInNewContext(handler(source('Phonglabor.html'),
    'document.getElementById("plot").addEventListener("pointerdown", function (ev)'), context);
  const touch = event('touch');
  run(touch);
  assert.equal(changes, 0);
  assert.equal(touch.prevented, undefined);
  assert.deepEqual(context.SC.light, [1, 2]);
  run(event('mouse'));
  assert.equal(changes, 1);
});

test('affine handles capture the pointer on the surviving SVG during redraw', () => {
  let captured;
  const context = { h: { k: 't' }, m: {}, activeHandleKey: 'e1', onChange() {},
    P: { el: { setPointerCapture: id => captured = id } },
    hitTarget: { setPointerCapture() { throw new Error('temporary handle cannot retain capture'); } } };
  const run = vm.runInNewContext(handler(source('Affines-Matrixlabor.html'), 'function startDrag(ev)'), context);
  const touch = event('touch');
  run(touch);
  assert.equal(captured, 7);
  assert.equal(touch.prevented, true);
  assert.equal(context.drag.pointerId, 7);
});

test('Phong handles remain draggable with touch', () => {
  let captured;
  let redraws = 0;
  const context = { runLab: () => redraws++ };
  const run = vm.runInNewContext(handler(source('Phonglabor.html'),
    'document.getElementById("plot").addEventListener("pointerdown", function (ev)'), context);
  const touch = event('touch');
  touch.target.getAttribute = () => 'light';
  touch.currentTarget = { setPointerCapture: id => captured = id };
  run(touch);
  assert.equal(captured, 7);
  assert.equal(context.drag.target, 'light');
  assert.equal(context.drag.pointerId, 7);
  assert.equal(redraws, 1);
  assert.equal(touch.prevented, true);
});

for (const file of ['Affines-Matrixlabor.html', 'Phonglabor.html']) {
  test(file + ': drag moves only for its own pointer and ends on cancellation', () => {
    let changes = 0;
    const context = { drag: { pointerId: 7, target: 'light', k: 't', m: {},
      P: { el: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100 }) },
        size: 100, cx: 50, cy: 50, unit: 10 }, cb: () => changes++ },
      applyHandle() {}, snap: v => v, clampC: v => v,
      SC: {}, svgPoint: () => ({ x: 3, y: 4 }), runLab: () => changes++ };
    const text = source(file);
    const move = vm.runInNewContext(handler(text,
      'window.addEventListener("pointermove", function (ev)'), context);
    const end = vm.runInNewContext(handler(text, 'function endDrag(ev)'), context);
    move(event('touch', 8));
    assert.equal(changes, 0);
    move(event('touch'));
    assert.equal(changes, 1);
    end(event('touch', 8));
    assert(context.drag);
    assert(text.includes('window.addEventListener("pointercancel", endDrag)'));
    end(event('touch'));
    assert.equal(context.drag, null);
    move(event('touch'));
    assert.equal(changes, 1);
  });
}

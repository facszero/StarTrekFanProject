'use strict';

const U = {
  lerp:      (a, b, t)        => a + (b - a) * t,
  clamp:     (v, lo, hi)      => Math.max(lo, Math.min(hi, v)),
  rnd:       (lo, hi)         => lo + Math.random() * (hi - lo),
  rndInt:    (lo, hi)         => Math.floor(lo + Math.random() * (hi - lo + 1)),
  rndPick:   (arr)            => arr[Math.floor(Math.random() * arr.length)],
  dist:      (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay),
  easeIn:    (t)              => t * t,
  easeOut:   (t)              => 1 - (1-t)*(1-t),
  easeInOut: (t)              => t < .5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2,

  // Canvas roundRect – uses native if available, else polyfill
  rRect(ctx, x, y, w, h, r) {
    if (typeof r === 'number') r = [r, r, r, r];
    const [tl, tr, br, bl] = r.length === 4 ? r : [r[0], r[0], r[0], r[0]];
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.arcTo(x+w, y,   x+w,   y+tr,  tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.arcTo(x+w, y+h, x+w-br, y+h,  br);
    ctx.lineTo(x + bl, y + h);
    ctx.arcTo(x,   y+h, x,     y+h-bl, bl);
    ctx.lineTo(x, y + tl);
    ctx.arcTo(x,   y,   x+tl,  y,      tl);
    ctx.closePath();
  },

  // Convert "#rrggbb" + alpha → "rgba(r,g,b,a)"
  rgba(hex, a) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  },

  circles(ax, ay, ar, bx, by, br) { return Math.hypot(bx-ax, by-ay) < ar+br; },
};

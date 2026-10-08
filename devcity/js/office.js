// Escritório isométrico: mesas, movimento da equipe e desenho no canvas.
(() => {
  const TCOL = { normal: '#6cc4ff', perf: '#5ad49a', caos: '#ff9a3c' }, SKIN = ['#f1c7a3', '#d9a47c', '#a86f4c', '#7a4b32', '#ffdbb8'];
  const desks = o => {
    const cols = Math.floor((o.w - 1) / 2);
    return Array.from({ length: o.desks }, (_, i) => [1 + (i % cols) * 2, 1 + Math.floor(i / cols) * 2]);
  };
  window.deskCapacity = () => OFFICES[S.office].desks;
  window.reindex = reset => {
    const ds = desks(OFFICES[S.office]);
    S.staff.forEach((e, i) => { e.desk = i; if (reset && ds[i]) { e.x = ds[i][0] + .6; e.y = ds[i][1] + 1.05; e.go = 0; } });
  };

  function moveStaff(dt) {
    const o = OFFICES[S.office], ds = desks(o);
    for (const e of S.staff) {
      const d = ds[e.desk] || ds[0], [tx, ty] = e.go ? [o.w - 1.55 + (e.id % 3) * .25, o.h - .6] : [d[0] + .6, d[1] + 1.05];
      const dx = tx - e.x, dy = ty - e.y, dist = Math.hypot(dx, dy), step = dt * .0022;
      if (dist > step) { e.x += dx / dist * step; e.y += dy / dist * step; }
      else { e.x = tx; e.y = ty; if (e.go && (e.away -= dt) <= 0) e.go = 0; }
    }
  }
  HOOKS.frame.push(dt => { if (dt) moveStaff(dt); });

  DRAW.office = now => {
    const W = cv.width, H = cv.height, o = OFFICES[S.office], n = o.w + o.h;
    cam.tw = Math.min(W * .94 * 2 / n, H * .9 / (n / 4 + .75)); cam.th = cam.tw / 2;
    cam.ox = W / 2 + (o.h - o.w) * cam.tw / 4; cam.oy = (H - (n * cam.th / 2 + cam.tw * .75)) / 2 + cam.tw * .75;
    const TW = cam.tw;
    ctx.fillStyle = S.crunch ? '#070a12' : '#121725'; ctx.fillRect(0, 0, W, H);
    const wh = TW * .75, win = S.crunch ? '#18264a' : '#86b8e3';
    poly([iso(0, 0), iso(o.w, 0), up(iso(o.w, 0), wh), up(iso(0, 0), wh)], o.wall[0]);
    poly([iso(0, 0), iso(0, o.h), up(iso(0, o.h), wh), up(iso(0, 0), wh)], o.wall[1]);
    const gap = o.glass ? 1 : 2, ww = o.glass ? .85 : .9, h1 = wh * (o.glass ? .1 : .3), h2 = wh * (o.glass ? .95 : .8);
    for (let x = .5; x + ww < o.w; x += gap) poly([up(iso(x, 0), h1), up(iso(x + ww, 0), h1), up(iso(x + ww, 0), h2), up(iso(x, 0), h2)], win);
    for (let y = .5; y + ww < o.h; y += gap) poly([up(iso(0, y), h1), up(iso(0, y + ww), h1), up(iso(0, y + ww), h2), up(iso(0, y), h2)], win);
    for (let x = 0; x < o.w; x++) for (let y = 0; y < o.h; y++) poly([iso(x, y), iso(x + 1, y), iso(x + 1, y + 1), iso(x, y + 1)], o.floor[(x + y) & 1]);
    const items = [], dh = TW * .18, working = S.project && running();
    desks(o).forEach(([dx, dy], i) => items.push([dx + dy + .9, () => {
      const e = S.staff.find(s => s.desk === i), on = e && S.project && Math.hypot(e.x - dx - .6, e.y - dy - 1.05) < .15;
      box(dx, dy, 1.2, .6, dh, ['#b58a5e', '#7d5c3e', '#946d4a']);
      box(dx + .3, dy + .12, .6, .08, TW * .22, ['#222833', on ? `hsl(195 85% ${52 + (working ? 8 * Math.sin(now / 140 + i) : 0)}%)` : '#2a3140', '#1b2029'], dh);
    }]));
    items.push([o.w + o.h - 2.6, () => box(o.w - 1.6, o.h - 1.6, .6, .6, TW * .42, ['#d7d9de', '#8e9199', '#a7aab2'])]);
    items.push([o.h - .4, () => { box(.25, o.h - .9, .5, .5, TW * .14, ['#7a4a2e', '#5c3622', '#6b3f28']); const [px, py] = iso(.5, o.h - .65); ctx.fillStyle = '#3f9a5c'; ctx.beginPath(); ctx.arc(px, py - TW * .3, TW * .2, 0, 7); ctx.fill(); }]);
    for (const e of S.staff) items.push([e.x + e.y, () => {
      const [sx, by] = iso(e.x, e.y), s = TW / 40, atDesk = !e.go, sy = by - (atDesk && working ? Math.abs(Math.sin(now / 180 + e.id)) * s : 0);
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(sx, by, 6 * s, 3 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = TCOL[e.trait]; ctx.beginPath(); ctx.roundRect(sx - 4.5 * s, sy - 17 * s, 9 * s, 14 * s, 3.5 * s); ctx.fill();
      ctx.fillStyle = SKIN[e.id % SKIN.length]; ctx.beginPath(); ctx.arc(sx, sy - 21 * s, 4.2 * s, 0, 7); ctx.fill();
      if (e.morale < 25) { ctx.fillStyle = '#ff5f6d'; ctx.font = `700 ${11 * s}px sans-serif`; ctx.textAlign = 'center'; ctx.fillText('!', sx, sy - 28 * s); }
    }]);
    items.sort((a, b) => a[0] - b[0]).forEach(([, f]) => f());
  };
})();

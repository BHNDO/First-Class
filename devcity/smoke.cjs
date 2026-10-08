// Smoke test: plays ~40 in-game years with a simple bot and fails on any page error.
// Run: NODE_PATH=$(npm root -g) node devcity/smoke.cjs   (needs playwright + chromium)
const { chromium } = require('playwright');
const fs = require('fs');
const assert = require('assert');

(async () => {
  const html = '<!doctype html><meta name="viewport" content="width=device-width">' + fs.readFileSync(__dirname + '/index.html', 'utf8');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/*', r => r.abort()); // offline: fonts fall back
  await page.setContent(html);

  const r = await page.evaluate(async () => {
    const dlg = document.querySelector('#modal');
    for (let m = 0; m < 12 * 40 && year() < 2016; m++) {
      for (let d = 0; d < 30; d++) {
        tickDay();
        const p = S.project;
        if (!p) { S.draft.feats = [...S.researched]; ACT.start(); }
        else if (p.phase === 'qa' && p.bugs < 15) { if (S.money > 60000) ACT.ad(0); ACT.launch(); }
      }
      TECH.filter(t => t.y <= year() && S.rp >= t.rp && !S.researched.includes(t.id)).forEach(t => ACT.research(t.id));
      if (S.money > monthlyCost() * 6 + 20000 && S.cands.length) ACT.hire(0);
      const next = OFFICES[S.office + 1];
      if (next && S.money > next.cost * 3) ACT.move(S.office + 1);
      if (year() >= 1985 && !S.console && S.money > rd() * 3) ACT.hwlaunch();
      if (S.rivals[0] && S.money > 500000) { ACT.buy(0); if (S.rivals[0].own >= 51) ACT.absorb(0); }
      for (const t of TABS) { S.tab = t[0]; renderTab(); }
      await new Promise(res => setTimeout(res));
      while (dlg.open) { dlg.close(); await new Promise(res => setTimeout(res)); }
    }
    return { year: year(), money: S.money, games: S.games.length, best: Math.max(...S.games.map(g => g.score)), staff: S.staff.length, office: S.office, ips: S.ips.length };
  });
  await browser.close();
  console.log(r);
  assert.deepStrictEqual(errors, []);
  assert.ok(Number.isFinite(r.money), 'money is a number');
  assert.ok(r.games > 5, 'bot launched games');
})().catch(e => { console.error(e); process.exit(1); });

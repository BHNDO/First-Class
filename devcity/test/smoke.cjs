// Teste de fumaça: abre um jogo novo, joga ~40 anos com um bot, roda os autotestes dos módulos (SELFTESTS)
// e carrega um save da versão 1 (test/save-v1.json). Falha em qualquer erro de página ou console.error.
// Rodar: NODE_PATH=$(npm root -g) node devcity/test/smoke.cjs
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const serve = require('./serve.cjs');

const YEARS = +process.env.YEARS || 40;

(async () => {
  const srv = await serve(), browser = await chromium.launch(), errors = [];
  const open = async (save) => {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => m.type() === 'error' && (m.location().url || '').startsWith(srv.url) && errors.push('console: ' + m.text()));
    await page.route(r => !r.href.startsWith(srv.url), r => r.abort()); // offline: fontes caem no fallback
    await page.addInitScript(s => { try { localStorage.clear(); if (s) localStorage.setItem('devcity-save-v1', s); } catch {} }, save || '');
    await page.goto(srv.url);
    await page.waitForFunction(() => document.querySelector('#modal').open);
    return page;
  };

  // 1) Jogo novo: nome do estúdio, bot de várias décadas e autotestes.
  const page = await open();
  const r = await page.evaluate(async YEARS => {
    const dlg = document.querySelector('#modal');
    const drain = async () => { let idle = 0; while (idle < 4) { if (dlg.open) { dlg.close(); idle = 0; } else idle++; await new Promise(r => setTimeout(r, 8)); } };
    document.querySelector('#mb input[name=studio]').value = '  Bot   Studio ';
    document.querySelector('#mf button').click();
    await until(() => S.studio); setSpeed(0); await drain();
    const studio = S.studio;
    for (let m = 0; m < 12 * YEARS && year() < 1976 + YEARS; m++) {
      for (let d = 0; d < 30; d++) {
        tickDay();
        const p = S.project;
        if (!p) { S.draft.feats = [...S.researched]; await ACT.start(); }
        else if (p.phase === 'qa' && p.bugs < 15 && S.day - (S.games[0]?.day ?? -999) > 150) { if (S.money > 60000) ACT.ad(0); ACT.launch(); }
      }
      TECH.filter(t => t.y <= year() && S.rp >= t.rp && !S.researched.includes(t.id)).forEach(t => ACT.research(t.id));
      if (S.money > monthlyCost() * 6 + 20000 && S.cands.length) ACT.hire(0);
      if (S.staff.length >= deskCapacity() && OFFICES[S.office + 1] && S.money > OFFICES[S.office + 1].cost * 3) ACT.move(S.office + 1);
      if (year() >= 1985 && !S.console && S.money > 1e6) ACT.hwlaunch();
      const r0 = S.rivals.find(x => !x.sub && x.own < 51);
      if (r0 && S.money > 500000) ACT.buy(S.rivals.indexOf(r0));
      if (m % 6 === 0) { for (const t of TABS) selectTab(t[0]); for (const v of ['city', 'office']) setView(v); }
      await drain();
    }
    for (const t of TABS) selectTab(t[0]);
    const tests = [];
    for (const t of SELFTESTS) { await drain(); try { await t.run(); tests.push(['ok', t.name]); } catch (e) { tests.push(['FALHOU', t.name, String(e && e.stack || e)]); } }
    await drain();
    return { studio, year: year(), money: Math.round(S.money), games: S.games.length, best: Math.max(...S.games.map(g => g.score)), staff: S.staff.length, tests };
  }, YEARS);
  console.log(JSON.stringify({ ...r, tests: undefined }));
  for (const t of r.tests) console.log(t[0], '·', t[1], t[2] ? '\n   ' + t[2] : '');

  // 2) Save da versão 1: carrega, completa campos novos e continua jogando.
  const v1 = fs.readFileSync(__dirname + '/save-v1.json', 'utf8');
  const p2 = await open(v1);
  const r2 = await p2.evaluate(async () => {
    const dlg = document.querySelector('#modal');
    const asked = !!document.querySelector('#mb input[name=studio]');
    document.querySelector('#mb input[name=studio]').value = 'Legado';
    document.querySelector('#mf button').click(); await until(() => S.studio);
    setSpeed(0);
    for (let i = 0; i < 720; i++) { tickDay(); if (i % 30 === 0) { let idle = 0; while (idle < 3) { if (dlg.open) { dlg.close(); idle = 0; } else idle++; await new Promise(r => setTimeout(r, 8)); } } }
    for (const t of TABS) selectTab(t[0]);
    return { asked, studio: S.studio, year: year(), games: S.games.length, money: Math.round(S.money) };
  });
  console.log('save v1:', JSON.stringify(r2));
  await browser.close(); srv.close();

  if (errors.length) console.log('ERROS:\n' + [...new Set(errors)].slice(0, 20).join('\n'));
  assert.deepStrictEqual(errors, [], 'erros de página ou console');
  assert.strictEqual(r.studio, 'Bot Studio', 'nome do estúdio');
  assert.ok(r.games > 5, 'o bot lançou jogos');
  assert.ok(Number.isFinite(r.money), 'caixa é um número');
  assert.ok(r.tests.every(t => t[0] === 'ok'), 'autotestes');
  assert.ok(r2.asked && r2.studio === 'Legado' && r2.year >= 1987, 'save v1 carregou e pediu o nome');
  console.log('OK');
})().catch(e => { console.error(e); process.exit(1); });

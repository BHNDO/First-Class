// Project DevCity: núcleo do jogo (dados, estado, simulação, abas principais e registros de extensão).
// Os módulos em js/*.js se registram nos objetos abaixo. O contrato está em ARCHITECTURE.md.

// ---------- Registros de extensão ----------
const HOOKS = { day: [], month: [], year: [], start: [], launch: [], boot: [], cash: [], frame: [], input: [], render: [], view: [] };
const MOD = { prod: [], qa: [], morale: [], rp: [], score: [], units: [], ppu: [], sell: [], hireSkill: [], rent: [], totalPts: [] };
const CAP = { servers: [], factory: [], prestige: [], assets: [] };
const DRAW = {}, VIEWS = {}, ACT = {}, LIVE = {}, BADGES = {}, DEFAULTS = {};
const DEV_EXTRA = { prod: [], qa: [] };
const BLOCK_START = [];
const SELFTESTS = [];
const TABS = [['dev', 'Desenvolvimento'], ['hw', 'Hardware'], ['mkt', 'Marketing'], ['fin', 'Finanças'], ['staff', 'Equipe'], ['res', 'Pesquisa'], ['ip', 'Propriedades']];
const CATS = {
  vendas: 'Vendas de jogos', console: 'Vendas de consoles', royalties: 'Royalties de consoles', dividendos: 'Dividendos', subsidiarias: 'Resultado de subsidiárias',
  licenciamento: 'Licenciamento de IPs', salarios: 'Salários', aluguel: 'Aluguel', recrutamento: 'Recrutamento', marketing: 'Marketing', pd: 'P&D de hardware',
  acoes: 'Compra e venda de ações', imoveis: 'Imóveis', outros: 'Outros',
};

function safe(f, args) { try { return f(...args); } catch (err) { console.error(err); } }
const run = (k, ...a) => HOOKS[k].forEach(f => safe(f, a));
const mod = (k, v, c) => MOD[k].reduce((acc, f) => { const r = safe(f, [acc, c]); return Number.isFinite(r) ? r : acc; }, v);
const capacity = k => CAP[k].reduce((a, f) => a + (safe(f, []) || 0), 0);
const isPlain = o => o !== null && typeof o === 'object' && !Array.isArray(o);
function fill(t, d) { for (const k in d) { if (t[k] === undefined) t[k] = structuredClone(d[k]); else if (isPlain(d[k]) && isPlain(t[k])) fill(t[k], d[k]); } return t; }
function addDefaults(d) { (function merge(t, s) { for (const k in s) { if (isPlain(s[k]) && isPlain(t[k])) merge(t[k], s[k]); else t[k] = s[k]; } })(DEFAULTS, d); }
function addTab(id, label, after) { const i = TABS.findIndex(t => t[0] === after); TABS.splice(i < 0 ? TABS.length : i + 1, 0, [id, label]); }
const check = (ok, msg) => { if (!ok) throw new Error(msg); };

// ---------- Dados do jogo ----------
const AXES = ['Jogabilidade', 'História', 'Gráficos', 'Som'];
const GENRES = [ // ideal = foco ideal em AXES (soma 100)
  { id: 'acao', n: 'Ação', y: 1976, ideal: [40, 10, 35, 15] },
  { id: 'aventura', n: 'Aventura', y: 1977, ideal: [20, 45, 20, 15] },
  { id: 'esportes', n: 'Esportes', y: 1978, ideal: [45, 5, 30, 20] },
  { id: 'rpg', n: 'RPG', y: 1980, ideal: [25, 45, 20, 10] },
  { id: 'corrida', n: 'Corrida', y: 1982, ideal: [40, 5, 35, 20] },
  { id: 'luta', n: 'Luta', y: 1987, ideal: [50, 5, 30, 15] },
  { id: 'simulacao', n: 'Simulação', y: 1989, ideal: [50, 10, 25, 15] },
  { id: 'estrategia', n: 'Estratégia', y: 1992, ideal: [55, 20, 15, 10] },
  { id: 'fps', n: 'FPS', y: 1993, ideal: [45, 10, 30, 15] },
  { id: 'vn', n: 'Visual Novel', y: 1994, ideal: [10, 60, 20, 10] },
];
const TOPICS = [
  { n: 'Espaço', y: 1976, good: ['acao', 'estrategia', 'simulacao', 'fps'] },
  { n: 'Fantasia', y: 1976, good: ['rpg', 'aventura', 'estrategia'] },
  { n: 'Futebol', y: 1976, good: ['esportes', 'simulacao'] },
  { n: 'Piratas', y: 1976, good: ['aventura', 'acao'] },
  { n: 'Zumbis', y: 1978, good: ['acao', 'fps', 'aventura'] },
  { n: 'Carros', y: 1978, good: ['corrida', 'simulacao'] },
  { n: 'Medieval', y: 1980, good: ['estrategia', 'rpg', 'luta'] },
  { n: 'Detetive', y: 1980, good: ['aventura', 'vn'] },
  { n: 'Ninjas', y: 1982, good: ['luta', 'acao'] },
  { n: 'Mitologia Nórdica', y: 1984, good: ['rpg', 'acao'] },
  { n: 'Cyberpunk', y: 1985, good: ['rpg', 'fps', 'acao'] },
  { n: 'Militar', y: 1985, good: ['estrategia', 'fps', 'simulacao'] },
  { n: 'Cidade', y: 1989, good: ['simulacao', 'estrategia'] },
  { n: 'Romance', y: 1990, good: ['vn', 'aventura'] },
  { n: 'Escola', y: 1992, good: ['vn', 'simulacao'] },
  { n: 'Pós-apocalipse', y: 1997, good: ['fps', 'rpg', 'aventura'] },
  { n: 'E-sports', y: 2008, good: ['esportes', 'estrategia', 'luta', 'fps'] },
];
const TECH = [ // t = tempo extra de produção, q = qualidade técnica
  { id: 'sprites', n: 'Sprites 8-bit', y: 1980, rp: 15, t: .15, q: 1 },
  { id: 'save', n: 'Save em disquete', y: 1982, rp: 20, t: .1, q: 1 },
  { id: 'iso', n: 'Gráficos isométricos', y: 1984, rp: 35, t: .2, q: 1.5 },
  { id: 'dialogo', n: 'Árvore de diálogos', y: 1986, rp: 40, t: .2, q: 1.5 },
  { id: 'synth', n: 'Trilha sintetizada', y: 1987, rp: 30, t: .1, q: 1 },
  { id: '3d', n: '3D poligonal', y: 1992, rp: 90, t: .5, q: 3 },
  { id: 'cd', n: 'Áudio de CD', y: 1993, rp: 60, t: .2, q: 1.5 },
  { id: 'online', n: 'Multiplayer online', y: 1997, rp: 120, t: .4, q: 2.5 },
  { id: 'mundo', n: 'Mundo aberto', y: 2001, rp: 160, t: .7, q: 3 },
  { id: 'ragdoll', n: 'Física ragdoll', y: 2004, rp: 150, t: .3, q: 2 },
  { id: 'digital', n: 'Distribuição digital', y: 2008, rp: 120, t: 0, q: 0, d: 'Fim do custo de mídia física em todos os jogos' },
  { id: 'micro', n: 'Microtransações', y: 2009, rp: 100, t: .15, q: 0, d: '+30% de receita, −0,5 na nota da crítica' },
  { id: 'rt', n: 'Raytracing', y: 2018, rp: 300, t: .5, q: 3 },
  { id: 'ml', n: 'IA com machine learning', y: 2020, rp: 350, t: .4, q: 3 },
];
const ERAS = [['O Berço', 1976, 1979], ['Era de Ouro', 1980, 1989], ['Revolução 3D e CD', 1990, 1999], ['Física Avançada', 2000, 2009], ['Era Moderna', 2010, 2099]];
const SLOTS = [['cpu', 'Processador'], ['midia', 'Mídia'], ['frio', 'Refrigeração'], ['ctrl', 'Controle']];
const HW = { // [nome, ano, potência, calor (negativo = refrigeração), custo por unidade]
  cpu: [['4-bit', 1976, 1, 1, 15], ['8-bit', 1980, 2, 2, 25], ['16-bit', 1987, 4, 3, 40], ['32-bit', 1993, 8, 5, 60], ['128-bit', 1999, 14, 7, 90], ['Multi-core', 2005, 24, 10, 120], ['Octa-core', 2013, 40, 13, 160]],
  midia: [['Fita cassete', 1976, 0, 0, 4], ['Cartucho', 1978, 1, 0, 12], ['CD-ROM', 1993, 2, 1, 5], ['DVD', 2000, 3, 1, 6], ['Blu-ray', 2006, 4, 1, 10], ['SSD NVMe', 2020, 6, 2, 30]],
  frio: [['Passiva', 1976, 0, -3, 1], ['Ventoinha', 1980, 0, -6, 6], ['Alta rotação', 1995, 0, -10, 14], ['Câmara de vapor', 2010, 0, -16, 28]],
  ctrl: [['Joystick', 1976, 0, 0, 5], ['D-Pad', 1983, 1, 0, 6], ['Analógico duplo', 1997, 2, 0, 12], ['Sensor de movimento', 2006, 3, 1, 25]],
};
const ADS = [['Anúncio em revista', 1976, 2000, 8], ['Comercial de TV', 1985, 15000, 25], ['Site e fóruns', 1997, 6000, 15], ['Influenciadores', 2008, 25000, 35]];
const OFFICES = [
  { n: 'Garagem dos pais', zone: 'Subúrbio', desks: 2, rent: 0, prest: 0, cost: 0, w: 6, h: 5, floor: ['#3a3d45', '#35383f'], wall: ['#4c5160', '#424755'] },
  { n: 'Sala comercial', zone: 'Avenida comercial', desks: 6, rent: 1500, prest: 1, cost: 12000, w: 9, h: 7, floor: ['#6b4f3a', '#624835'], wall: ['#b9b2a4', '#a7a093'] },
  { n: 'Galpão industrial', zone: 'Periferia', desks: 10, rent: 2200, prest: 0, cost: 25000, w: 12, h: 9, floor: ['#4b4e52', '#46494d'], wall: ['#7a6a58', '#6c5d4d'] },
  { n: 'Torre de vidro', zone: 'Centro Financeiro', desks: 16, rent: 12000, prest: 3, cost: 180000, w: 14, h: 10, floor: ['#d5dae2', '#ccd2db'], wall: ['#2c4a6e', '#25405f'], glass: true },
];
const TRAITS = {
  normal: { n: 'Equilibrado', ico: '=', spd: 1, bug: .15, qa: 1 },
  perf: { n: 'Perfeccionista', ico: '✓', spd: .75, bug: .04, qa: 1.5 },
  caos: { n: 'Caótico', ico: '⚡', spd: 1.4, bug: .45, qa: .8 },
};
const DIRS = { cons: ['Conservadora', .8, 0, .05], eq: ['Equilibrada', 1, .05, .1], agr: ['Agressiva', 1.5, .2, .18] }; // [nome, lucro, chance de mês no prejuízo, volatilidade da ação]
const FIRST = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabi', 'Hugo', 'Iara', 'João', 'Lara', 'Marcos', 'Nina', 'Otávio', 'Paula', 'Rafa', 'Sofia', 'Tiago', 'Vera', 'Yuri'];
const LAST = ['Silva', 'Souza', 'Lima', 'Costa', 'Rocha', 'Alves', 'Nunes', 'Prado', 'Dias', 'Moura'];
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MS_PER_DAY = [0, 450, 200, 80];
const SAVE_KEY = 'devcity-save-v1';

// ---------- Utilidades ----------
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtN = v => Math.round(v).toLocaleString('pt-BR');
const fmt$ = v => (v < 0 ? '−$' : '$') + fmtN(Math.abs(v));
const fmt1 = v => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const cleanName = (s, fb) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, 28) || fb;
const year = () => 1976 + Math.floor(S.day / 360);
const infl = () => 1 + (year() - 1976) / 20;
const tech = id => TECH.find(t => t.id === id);
const genre = () => GENRES.find(g => g.id === (S.project?.genre || S.draft.genre));
const ipOf = id => S.ips.find(i => String(i.id) === String(id));
const norm = sl => { const s = sl.reduce((a, v) => a + v, 0); return s ? sl.map(v => v / s * 100) : [25, 25, 25, 25]; };
const align = (cur, ideal) => Math.max(0, 1 - cur.reduce((a, v, i) => a + Math.abs(v - ideal[i]), 0) / 120);
const expQ = y => .5 * TECH.filter(t => t.y <= y - 2).reduce((a, t) => a + t.q, 0);
const pts = e => mod('prod', e.skill * TRAITS[e.trait].spd * (.4 + e.morale / 166) * (S.crunch ? 1.5 : 1) * .5, e);
const teamOut = () => S.staff.reduce((a, e) => a + pts(e), 0);
const draftTotal = () => Math.round(mod('totalPts', 250 * (1 + (year() - 1976) / 6) * (1 + S.draft.feats.reduce((a, id) => a + tech(id).t, 0)), S.draft));
const estDays = () => Math.ceil((S.project ? Math.max(0, S.project.total - S.project.done) : draftTotal()) / Math.max(.1, teamOut()));
const avgMorale = () => S.staff.reduce((a, e) => a + e.morale, 0) / S.staff.length;
const rent = () => mod('rent', OFFICES[S.office].rent);
const monthlyCost = () => rent() + S.staff.reduce((a, e) => a + e.sal, 0);
const subProfit = r => r.p * 250 * DIRS[r.dir || 'eq'][1];
const dividend = r => r.sub ? subProfit(r) : r.p * 250 * r.own / 100 * .4;
function cash(v, cat = 'outros') {
  S.money += v;
  if (v >= 0) S.inM += v; else S.outM -= v;
  const b = (S.books[year()] ||= {});
  b[cat] = (b[cat] || 0) + v;
  run('cash', v, cat);
}
function newEmp() {
  const skill = clamp(Math.round(mod('hireSkill', rnd(2, 4.5 + OFFICES[S.office].prest * 1.6 + capacity('prestige') * 1.6 + S.rep / 30))), 1, 10);
  return { n: `${pick(FIRST)} ${pick(LAST)}`, trait: pick(['normal', 'normal', 'perf', 'caos']), skill, sal: Math.round((250 + skill * 170) * (1 + (year() - 1976) / 40) / 10) * 10 };
}
function newIp(n, fans = 0) { return { id: S.nextId++, n, fans, games: 0, sum: 0, last: -9999, legend: false, burned: false }; }
// Sobrescritas por js/office.js (mesas vêm das salas construídas).
function deskCapacity() { return OFFICES[S.office].desks; }
function reindex() { S.staff.forEach((e, i) => { e.desk = i; }); }

addDefaults({ studio: '', view: 'office', books: {}, divisions: [] });
function newGame() {
  return fill({
    day: 0, money: 30000, rep: 10, fans: 0, rp: 0, speed: 0, last: 1, crunch: false, office: 0, debt: 0, nextId: 1, intro: false,
    staff: [{ id: 0, n: 'Você (fundação)', trait: 'normal', skill: 5, sal: 0, morale: 90, x: 1.6, y: 2.05, go: 0, away: 0, desk: 0 }],
    cands: [], researched: [], project: null, games: [], ips: [], hist: [], console: null,
    inM: 0, outM: 0, lastIn: 0, lastOut: 0,
    rivals: [
      { n: 'Atomix Interactive', ip: 'Galaxy Raiders', p: 14, prev: 14, own: 0, fans: 4000, sub: false, dir: 'eq' },
      { n: 'Pixel Forge', ip: 'Reino de Cristal', p: 9, prev: 9, own: 0, fans: 2500, sub: false, dir: 'eq' },
      { n: 'Lunar Soft', ip: 'Turbo Lane', p: 6, prev: 6, own: 0, fans: 1500, sub: false, dir: 'eq' },
      { n: 'Bitmonk Studios', ip: 'Monk Fist', p: 11, prev: 11, own: 0, fans: 3000, sub: false, dir: 'eq' },
      { n: 'Kaiju Works', ip: 'Kaiju Smash', p: 18, prev: 18, own: 0, fans: 5000, sub: false, dir: 'eq' },
    ],
    draft: { name: 'Meu Primeiro Jogo', ip: 'new', genre: 'acao', topic: 'Espaço', sl: [40, 15, 30, 15], feats: [] },
    hw: { cpu: 1, midia: 1, frio: 1, ctrl: 0, price: 199, name: 'DevBox' },
    mkt: { promise: false }, tab: 'dev',
  }, DEFAULTS);
}

// ---------- Modal, toasts e tempo (máquina de estados: pausado / rodando) ----------
let S, dirty = true, tfilter = '', modalOpen = 0, mq = Promise.resolve();
const running = () => S.speed > 0 && !modalOpen;
function setSpeed(n) { if (n) S.last = n; S.speed = n; updateTime(); }
function updateTime() {
  document.body.classList.toggle('paused', !running());
  for (const b of document.querySelectorAll('[data-speed]')) b.setAttribute('aria-pressed', +b.dataset.speed === S.speed);
  $('#crunchTag').hidden = !S.crunch;
}
// btns: [rótulo, valor, classe, pularValidação]. Resolve com { v: valor do botão, data: campos [name] do corpo }.
function modal(title, html, btns = [['Continuar']], lock = false) {
  const show = () => new Promise(res => {
    const d = $('#modal');
    $('#mt').textContent = title; $('#mb').innerHTML = html;
    $('#mf').replaceChildren(...btns.map(([label, val, cls, skip], i) => {
      const b = document.createElement('button');
      b.textContent = label; b.value = val ?? 'ok'; b.className = cls ?? (i === 0 ? 'primary' : ''); b.formNoValidate = !!skip;
      return b;
    }));
    d.oncancel = e => { if (lock) e.preventDefault(); };
    d.onclose = () => {
      const data = Object.fromEntries([...$('#mb').querySelectorAll('[name]')].map(i => [i.name, i.type === 'checkbox' ? i.checked : i.value]));
      modalOpen--; updateTime(); res({ v: d.returnValue, data });
    };
    d.returnValue = ''; modalOpen++; updateTime(); d.showModal();
    $('#mb').querySelector('input')?.select();
  });
  return (mq = mq.then(show));
}
function toast(msg, kind = '') {
  const t = document.createElement('div'), box = $('#toasts');
  t.className = 'toast ' + kind; t.textContent = msg; box.prepend(t);
  while (box.children.length > 4) box.lastChild.remove();
  setTimeout(() => t.remove(), 6000);
}
function shake() { const s = $('#stage'); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); }
function markDirty(...tabs) { if (!tabs.length || tabs.includes(S.tab)) dirty = true; }
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {} }
function load() { try { return JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { return null; } }

// ---------- Simulação ----------
function tickDay() {
  S.day++;
  const p = S.project;
  for (const e of S.staff) {
    e.morale = clamp(e.morale + mod('morale', S.crunch ? -1.6 : .5 + OFFICES[S.office].prest * .15, e), 0, 100);
    const out = pts(e), tr = TRAITS[e.trait];
    if (p?.phase === 'prod') { p.done += out; p.bugs += out * tr.bug; }
    else if (p) p.bugs = Math.max(0, p.bugs - mod('qa', out * .35 * tr.qa, e));
    S.rp += mod('rp', e.skill * .02 * (p ? 1 : 3), e);
    if (!e.go && Math.random() < (e.morale < 50 ? .08 : .03)) { e.go = 1; e.away = 3000; }
  }
  if (p?.phase === 'prod' && p.done >= p.total) { p.phase = 'qa'; toast(`${p.name}: produção concluída. Fase de QA.`, 'good'); markDirty('dev'); }
  if (p) { p.hype *= .996; p.lie *= .996; }
  for (const g of S.games) if (g.left > 0) {
    const sold = clamp(Math.round(mod('sell', Math.ceil(g.left * .035), g)), 0, g.left);
    g.left -= sold; g.units += sold; g.rev += sold * g.ppu; cash(sold * g.ppu, 'vendas');
  }
  // crunch: burnout e vazamentos
  for (const e of [...S.staff]) if (e.id && e.morale < 8 && Math.random() < .03) {
    S.staff.splice(S.staff.indexOf(e), 1); reindex();
    modal('Burnout', `<p>${esc(e.n)} pediu demissão por esgotamento depois de semanas de crunch.</p>`);
    markDirty('staff');
  }
  if (S.crunch && avgMorale() < 30 && Math.random() < .02) {
    S.rep = clamp(S.rep - 15, 0, 100);
    if (p) p.hype *= .5;
    modal('Vazamento para a imprensa', '<p>Funcionários exaustos vazaram documentos internos sobre o crunch. A reputação caiu 15 pontos, o hype do projeto caiu pela metade e contratar talentos ficou mais difícil.</p>');
  }
  if (S.day % 7 === 0) { S.hist.push({ h: p ? p.hype : 0, l: p ? p.hype + p.lie : 0, f: S.fans }); if (S.hist.length > 52) S.hist.shift(); }
  run('day');
  if (S.day % 30 === 0) month();
}

function month() {
  cash(-S.staff.reduce((a, e) => a + e.sal, 0), 'salarios');
  cash(-rent(), 'aluguel');
  for (const r of S.rivals) {
    r.prev = r.p; r.p = Math.max(1, r.p * (1 + (Math.random() - .46) * (r.sub ? DIRS[r.dir || 'eq'][3] : .1))); r.fans = Math.round(r.fans * 1.01);
    if (r.sub) cash(Math.random() < DIRS[r.dir || 'eq'][2] ? -subProfit(r) * .6 : subProfit(r), 'subsidiarias');
    else if (r.own) cash(dividend(r), 'dividendos');
  }
  S.rp += S.divisions.reduce((a, d) => a + d.rp, 0);
  for (const i of S.ips) if (i.legend) cash(i.fans * .3, 'licenciamento');
  run('month');
  S.lastIn = S.inM; S.lastOut = S.outM; S.inM = S.outM = 0;
  S.cands = [newEmp(), newEmp(), newEmp()];
  if (S.money < 0) {
    S.debt++;
    if (S.debt >= 3) modal('Falência', `<p>Três meses seguidos no vermelho. Os credores fecharam a ${esc(S.studio)}.</p>`, [['Recomeçar em 1976']], true).then(() => { S = newGame(); boot(); });
    else toast(`Caixa negativo: ${3 - S.debt} ${3 - S.debt > 1 ? 'meses' : 'mês'} até a falência.`, 'bad');
  } else S.debt = 0;
  if (S.day % 360 === 0) newYear();
  save();
  markDirty();
}

function newYear() {
  const y = year(), n = [
    ...GENRES.filter(g => g.y === y).map(g => 'gênero ' + g.n),
    ...TOPICS.filter(t => t.y === y).map(t => 'tema ' + t.n),
    ...TECH.filter(t => t.y === y).map(t => t.n + ' (pesquisa)'),
    ...SLOTS.flatMap(([k]) => HW[k].filter(c => c[1] === y).map(c => c[0] + ' (hardware)')),
  ];
  if (y === 1980) n.push('mercado de consoles');
  const era = ERAS.find(e => e[1] === y);
  if (era) toast(`Nova era: ${era[0]}`, 'good');
  if (n.length) toast(`${y}: ${n.join(', ')}`);
  run('year', y);
}

function launch() {
  const p = S.project, y = year(), g = GENRES.find(x => x.id === p.genre);
  let ip = S.ips.find(i => String(i.id) === String(p.ip) && !i.burned);
  const tr = (p.feats.reduce((a, id) => a + tech(id).q, 0) + 2) / (expQ(y) + 2);
  const al = align(norm(S.draft.sl), g.ideal), good = TOPICS.find(t => t.n === p.topic).good.includes(p.genre);
  const fatigue = ip && S.day - ip.last < 720, mtx = p.feats.includes('micro');
  const prev = S.games[0], repeat = prev && prev.genre === g.n && prev.topic === p.topic, sat = clamp((S.day - (prev?.day ?? -999)) / 180, .1, 1);
  const skill = S.staff.reduce((a, e) => a + e.skill, 0) / S.staff.length / 10;
  const ctx = { p, g, y, ip };
  let score = 1 + 9 * (.35 * al + .15 * (good ? 1 : .4) + .3 * Math.min(1, tr) + .2 * skill) + (tr > 1 ? .4 : 0) - p.bugs / 30 - (fatigue ? 1.2 : 0) - (repeat ? 1 : 0) - (mtx ? .5 : 0) + rnd(-.5, .5);
  score = Math.round(clamp(mod('score', score, ctx), 1, 10) * 10) / 10;
  ctx.score = score;
  const notes = [];
  let hype = p.hype + p.lie;
  if (p.lie > 10 && score < 8) { hype = 0; S.rep = clamp(S.rep - 15, 0, 100); S.fans = Math.round(S.fans * .85); notes.push(['bad', 'Overhype: o jogo não entregou o que o marketing prometeu. As vendas e a reputação desabaram.']); }
  if (repeat) notes.push(['warn', `Mesma combinação do jogo anterior (${g.n} + ${esc(p.topic)}): a crítica achou repetitivo.`]);
  if (sat < 1) notes.push(['warn', 'Mercado saturado: seu jogo anterior ainda está nas prateleiras, então as vendas caíram.']);
  if (fatigue) notes.push(['warn', 'Fadiga da franquia: a sequência saiu cedo demais e perdeu pontos.']);
  if (ip?.legend && score < 6) { ip.burned = true; ip.legend = false; ip.fans = 0; S.rep = clamp(S.rep - 20, 0, 100); notes.push(['bad', `Review bombing: usar ${esc(ip.n)} para vender um jogo fraco queimou a franquia.`]); }
  if (p.bugs > 100) notes.push(['warn', `Lançado com ${Math.round(p.bugs)} bugs conhecidos.`]);
  if (!ip) { ip = newIp(p.name); S.ips.push(ip); }
  ctx.ip = ip; ctx.hype = hype;
  const units = Math.round(mod('units', 15000 * 1.07 ** (y - 1976) * (score / 10) ** 3 * 1.2 * (1 + hype / 100) * (1 + S.rep / 200) * (ip.legend ? 1.5 : 1) * sat + ip.fans * .6, ctx));
  const ppu = mod('ppu', (8 + (y - 1976) * .5 - (S.researched.includes('digital') ? 0 : 2)) * (mtx ? 1.3 : 1), ctx);
  const game = { n: p.name, ip: ip.id, genre: g.n, topic: p.topic, score, y, day: S.day, bugs: Math.round(p.bugs), units: 0, left: units, rev: 0, ppu };
  S.games.unshift(game);
  ip.games++; ip.sum += score; ip.last = S.day;
  if (!ip.burned) ip.fans = Math.max(0, Math.round(ip.fans + units * .08 * (score - 5) / 5));
  if (!ip.burned && !ip.legend && (score >= 9.5 || (ip.games >= 3 && ip.sum / ip.games >= 8.5))) {
    ip.legend = true;
    notes.push(['good', `${esc(ip.n)} virou um fenômeno cultural. Efeito buraco negro: a IP vende 50% mais, gera licenciamento todo mês e domina as feiras.`]);
  }
  S.fans = Math.max(0, Math.round(S.fans + units * .04 * (score - 4) / 6));
  S.rep = clamp(S.rep + (score - 6) * 2, 0, 100);
  run('launch', game, p, notes);
  S.project = null; S.draft.name = `Jogo ${S.games.length + 1}`;
  const cls = score >= 7 ? 'good' : score >= 5 ? 'warn' : 'bad';
  const verdict = score >= 9 ? 'Obra-prima.' : score >= 7 ? 'Muito divertido.' : score >= 5 ? 'Mediano.' : 'Passe longe.';
  modal(`${p.name} chegou às lojas`, `<div class="review"><div class="score ${cls}">${fmt1(score)}</div><div><p><b>${verdict}</b></p><p class="muted">${g.n} · ${esc(p.topic)} · ${esc(ip.n)}</p><p>Projeção: ${fmtN(game.left)} cópias a ${fmt$(game.ppu)} cada.</p></div></div>${notes.map(([k, t]) => `<p class="note ${k}">${t}</p>`).join('')}`);
  markDirty();
}

function campaign(i) {
  const [n, y0, c0, g0] = ADS[i], p = S.project, c = c0 * infl();
  if (!p || year() < y0 || S.money < c) return;
  cash(-c, 'marketing');
  const g = g0 * rnd(.8, 1.2);
  p.hype += g; if (S.mkt.promise) p.lie += g;
  toast(`${n}: +${Math.round(g * (S.mkt.promise ? 2 : 1))} de hype`);
  markDirty();
}

// ---------- Estúdio próprio e aquisições ----------
const studioField = (v = '') => `<label class="field">Nome da sua desenvolvedora<input name="studio" value="${esc(v)}" maxlength="28" required autocomplete="off" placeholder="Ex.: Lua Nova Games"></label>`;
function intro() {
  S.intro = true;
  modal('Bem-vindo ao Project DevCity', `<p>Janeiro de 1976. Você vai abrir um estúdio de jogos na garagem dos seus pais com $30.000 no caixa.</p>
    ${studioField()}
    <ul><li>Em <b>Desenvolvimento</b>, escolha gênero e tema, ajuste o foco da equipe e inicie a produção.</li>
    <li>Na fase de QA, espere os bugs caírem antes de lançar.</li>
    <li>Use o lucro para contratar, mudar de sede, pesquisar, fabricar consoles e comprar rivais.</li></ul>
    <p class="small">Atalhos: <kbd>Espaço</kbd> pausa e continua, <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> mudam a velocidade.</p>`, [['Abrir o estúdio']], true)
    .then(({ data }) => { S.studio = cleanName(data.studio, 'Estúdio Sem Nome'); toast(`${S.studio} abriu as portas na garagem.`, 'good'); refreshLive(); save(); setSpeed(1); });
}
function askStudio() {
  modal('Dê um nome à sua desenvolvedora', `<p>Seu estúdio ainda não tem nome.</p>${studioField()}`, [['Salvar nome']], true)
    .then(({ data }) => { S.studio = cleanName(data.studio, 'Estúdio Sem Nome'); refreshLive(); save(); markDirty(); });
}
async function renameModal(title, current) {
  const { v, data } = await modal(title, `<label class="field">Novo nome<input name="name" value="${esc(current)}" maxlength="28" required autocomplete="off"></label>`, [['Salvar', 'ok'], ['Cancelar', 'cancel', '', true]]);
  return v === 'ok' ? cleanName(data.name, current) : null;
}
function renameRival(r, name) { if (name && name !== r.n) { r.orig ??= r.n; r.n = name; } }
async function takeover(r) {
  const { v, data } = await modal(`A ${r.n} agora é sua`, `<p>Com ${r.own}% das ações, a ${esc(r.n)} responde à ${esc(S.studio)}. Mantenha o nome ou dê uma nova identidade ao estúdio.</p>
    <label class="field">Nome do estúdio comprado<input name="name" value="${esc(r.n)}" maxlength="28" required autocomplete="off"></label>
    <ul class="small"><li><b>Subsidiária</b>: continua lançando jogos com esse nome e manda o resultado mensal para você, conforme a diretriz que você definir.</li>
    <li><b>Divisão interna</b>: a equipe vira um laboratório de pesquisa com esse nome, e a IP ${esc(r.ip)} e parte dos fãs passam para a ${esc(S.studio)}.</li></ul>`,
    [['Manter como subsidiária', 'sub'], ['Absorver como divisão', 'absorb', ''], ['Decidir depois', 'later', '', true]]);
  const i = S.rivals.indexOf(r);
  if (i < 0 || (v !== 'sub' && v !== 'absorb')) return;
  renameRival(r, cleanName(data.name, r.n));
  ACT[v](i);
}

// ---------- Ações dos painéis ----------
Object.assign(ACT, {
  genre: id => { S.draft.genre = id; markDirty(); },
  topic: n => { S.draft.topic = n; markDirty(); },
  start: () => {
    if (S.project) return;
    const why = BLOCK_START.map(f => safe(f, [S.draft])).find(Boolean);
    if (why) return toast(why, 'warn');
    const d = S.draft, ip = S.ips.find(i => String(i.id) === String(d.ip) && !i.burned);
    S.project = { name: d.name.trim() || 'Sem título', ip: ip ? ip.id : 'new', genre: d.genre, topic: d.topic, feats: d.feats.filter(f => S.researched.includes(f)), total: draftTotal(), done: 0, bugs: 0, phase: 'prod', hype: 5 + (ip ? Math.min(60, ip.fans / 1000) : 0), lie: 0, armed: false, fair: false };
    run('start', S.project, d);
    toast(`Produção de ${S.project.name} iniciada.`);
    markDirty();
  },
  launch: () => { const p = S.project; if (p.bugs > 100 && !p.armed) { p.armed = true; markDirty(); } else launch(); },
  ad: i => campaign(+i),
  fair: () => {
    const p = S.project, c = 50000 * infl();
    if (!p || p.fair || S.money < c) return;
    cash(-c, 'marketing'); p.fair = true;
    if (ipOf(p.ip)?.legend) { p.hype += 150; shake(); toast(`One more thing: ${p.name} roubou a feira. Os rivais adiaram seus lançamentos.`, 'good'); }
    else { p.hype += 60 * rnd(.8, 1.2); toast('Apresentação na feira concluída: +60 de hype.'); }
    markDirty();
  },
  buy: i => {
    const r = S.rivals[i], lot = r.p * 1700;
    if (S.money < lot || r.own >= 51 || r.sub) return;
    cash(-lot, 'acoes'); r.own += 17; r.p *= 1.04;
    if (r.own >= 51) takeover(r);
    markDirty();
  },
  sell: i => {
    const r = S.rivals[i];
    if (!r.own) return;
    const lots = r.sub ? r.own / 17 : 1;
    cash(r.p * 1700 * lots * .97, 'acoes'); r.own -= 17 * lots; r.p *= .97 ** lots;
    if (r.sub) { r.sub = false; toast(`Você vendeu a ${r.n}. Ela volta a ser independente.`); }
    markDirty();
  },
  decide: i => takeover(S.rivals[i]),
  sub: i => { const r = S.rivals[i]; r.sub = true; r.dir ||= 'eq'; toast(`${r.n} virou subsidiária da ${S.studio}.`, 'good'); markDirty(); },
  absorb: i => {
    const [r] = S.rivals.splice(i, 1), ip = newIp(r.ip, r.fans);
    ip.games = 1; ip.sum = 7; S.ips.push(ip); S.fans += Math.round(r.fans * .3);
    S.divisions.push({ n: r.n, orig: r.orig, ip: r.ip, rp: Math.round(3 + r.p / 4) });
    toast(`${r.n} virou uma divisão da ${S.studio}. A IP ${r.ip} agora é sua.`, 'good'); markDirty();
  },
  rename: async i => { const r = S.rivals[i], n = await renameModal(`Renomear ${r.n}`, r.n); if (n) { renameRival(r, n); markDirty(); } },
  renameDiv: async i => { const d = S.divisions[i], n = await renameModal(`Renomear ${d.n}`, d.n); if (n && n !== d.n) { d.orig ??= d.n; d.n = n; markDirty(); } },
  renameStudio: async () => { const n = await renameModal('Renomear sua desenvolvedora', S.studio); if (n) { S.studio = n; refreshLive(); markDirty(); } },
  crunch: () => { S.crunch = !S.crunch; toast(S.crunch ? 'Crunch ativado: +50% de produção, a moral vai cair.' : 'Crunch encerrado.', S.crunch ? 'warn' : ''); updateTime(); markDirty(); },
  hire: i => {
    const c = S.cands[i];
    if (!c || S.staff.length >= deskCapacity() || S.money < c.sal) return;
    cash(-c.sal, 'recrutamento'); S.cands.splice(i, 1);
    const o = OFFICES[S.office];
    S.staff.push(Object.assign(c, { id: S.nextId++, morale: 80, x: o.w - .5, y: o.h / 2, go: 0, away: 0 }));
    reindex(); toast(`${c.n} entrou para a equipe.`); markDirty();
  },
  fire: id => {
    const i = S.staff.findIndex(e => String(e.id) === String(id));
    if (i < 1) return;
    const [e] = S.staff.splice(i, 1);
    S.staff.forEach(x => { x.morale = Math.max(0, x.morale - 5); });
    reindex(); toast(`${e.n} saiu da equipe. A moral caiu um pouco.`); markDirty();
  },
  research: id => {
    const t = tech(id);
    if (S.rp < t.rp || S.researched.includes(id)) return;
    S.rp -= t.rp; S.researched.push(id); toast(`Pesquisa concluída: ${t.n}.`, 'good'); markDirty();
  },
});

// ---------- Valores atualizados a cada dia ----------
const rp = (r, i) => { const a = -Math.PI / 2 + i * Math.PI / 2; return [+(110 + r * Math.cos(a)).toFixed(1), +(90 + r * Math.sin(a)).toFixed(1)]; };
Object.assign(LIVE, {
  studio: () => S.studio || 'Seu estúdio',
  money: () => fmt$(S.money),
  date: () => `${S.day % 30 + 1} ${MONTHS[Math.floor(S.day % 360 / 30)]} ${year()}`,
  rep: () => Math.round(S.rep),
  fans: () => fmtN(S.fans),
  rp: () => fmtN(Math.floor(S.rp)),
  office: () => `${OFFICES[S.office].n} · ${OFFICES[S.office].zone}`,
  hype: () => S.project ? fmtN(S.project.hype + S.project.lie) : '—',
  prog: () => S.project ? Math.min(1, S.project.done / S.project.total) : 0,
  phase: () => !S.project ? '' : S.project.phase === 'prod' ? `Produção · ${Math.floor(Math.min(1, S.project.done / S.project.total) * 100)}%` : 'Polimento e QA · os bugs caem a cada dia',
  bugs: () => String(Math.round(S.project?.bugs || 0)).padStart(4, '0'),
  est: () => S.project?.phase === 'qa' ? 'Produção concluída' : `≈ ${estDays()} dias de produção com a equipe atual`,
  estv: () => S.project?.phase === 'qa' ? 0 : estDays(),
  sl: i => Math.round(norm(S.draft.sl)[i]) + '%',
  align: () => Math.round(align(norm(S.draft.sl), genre().ideal) * 100) + '%',
  radar: () => {
    const poly = vals => vals.map((v, i) => rp(66 * Math.min(v, 60) / 60, i).join(',')).join(' ');
    return `<polygon class="r-ideal" points="${poly(genre().ideal)}"/><polygon class="r-cur" points="${poly(norm(S.draft.sl))}"/>`;
  },
  warn: () => { const g = genre(), cur = norm(S.draft.sl); return AXES.map((a, i) => Math.abs(cur[i] - g.ideal[i]) > 20 ? `<li>${a} ${cur[i] > g.ideal[i] ? 'alto' : 'baixo'} demais para ${g.n}</li>` : '').join(''); },
  chart: () => {
    const h = S.hist;
    if (h.length < 2) return '<text x="300" y="95" text-anchor="middle" class="c-empty">O gráfico começa na segunda semana de jogo.</text>';
    const mH = Math.max(20, ...h.map(p => p.l)), mF = Math.max(20, ...h.map(p => p.f)), n = h.length - 1;
    const line = (k, m) => h.map((p, i) => `${(20 + i * 560 / n).toFixed(1)},${(160 - p[k] / m * 140).toFixed(1)}`);
    return `<polygon class="c-gap" points="${line('l', mH).join(' ')} ${line('h', mH).reverse().join(' ')}"/><polyline class="c-fans" points="${line('f', mF).join(' ')}"/><polyline class="c-prom" points="${line('l', mH).join(' ')}"/><polyline class="c-hype" points="${line('h', mH).join(' ')}"/>`;
  },
  morale: id => S.staff.find(e => String(e.id) === id)?.morale ?? 0,
  avgm: () => Math.round(avgMorale()),
  lastIn: () => fmt$(S.lastIn), lastOut: () => fmt$(S.lastOut), burn: () => fmt$(monthlyCost()),
  badge: id => BADGES[id] ? safe(BADGES[id], []) || '' : '',
});
BADGES.res = () => TECH.filter(t => t.y <= year() && !S.researched.includes(t.id) && S.rp >= t.rp).length;

function refreshLive() {
  for (const el of document.querySelectorAll('[data-live]')) {
    const [k, a] = el.dataset.live.split(':');
    if (!LIVE[k]) continue;
    const v = safe(LIVE[k], [a]);
    if (el.tagName === 'METER' || el.tagName === 'PROGRESS') el.value = v ?? 0;
    else if ('html' in el.dataset) el.innerHTML = v ?? '';
    else el.textContent = v ?? '';
  }
  $('#money').classList.toggle('neg', S.money < 0);
  $('#launch')?.classList.toggle('risk', (S.project?.bugs || 0) > 100);
}

// ---------- Abas principais ----------
const tag = t => `<span class="tag ${t}"><span aria-hidden="true">${TRAITS[t].ico}</span> ${TRAITS[t].n}</span>`;
const extra = list => list.map(f => safe(f, []) || '').join('');
Object.assign(VIEWS, {
  dev() {
    const d = S.draft, p = S.project, y = year(), lk = p ? 'disabled' : '', q = tfilter.toLowerCase().trim();
    const feats = TECH.filter(t => S.researched.includes(t.id));
    return `<div class="dev">
    <section class="col"><h3 class="eyebrow">1 · Pré-produção</h3>
      <label class="field">Nome do jogo<input id="d-name" data-bind="draft.name" value="${esc(d.name)}" maxlength="40" ${lk}></label>
      <label class="field">Franquia<select id="d-ip" data-bind="draft.ip" ${lk}><option value="new">Nova IP</option>${S.ips.filter(i => !i.burned).map(i => `<option value="${i.id}" ${String(d.ip) === String(i.id) ? 'selected' : ''}>${esc(i.n)} (sequência${i.legend ? ', lendária' : ''})</option>`).join('')}</select></label>
      <p class="label">Gênero</p>
      <div class="chips">${GENRES.map(g => `<button class="chip${g.id === d.genre ? ' on' : ''}" id="g-${g.id}" data-act="genre" data-a="${g.id}" aria-pressed="${g.id === d.genre}" ${g.y > y || p ? 'disabled' : ''}>${g.n}${g.y > y ? ` <small>${g.y}</small>` : ''}</button>`).join('')}</div>
      <p class="label">Tema · ★ combina com ${genre().n}</p>
      <input id="tfilter" type="search" placeholder="Buscar tema ou gênero" value="${esc(tfilter)}" aria-label="Buscar tema ou gênero">
      <div class="chips">${TOPICS.map((t, i) => {
        if (t.y > y) return '';
        const good = t.good.includes(d.genre), key = `${t.n} ${t.good.map(id => GENRES.find(g => g.id === id).n).join(' ')}`.toLowerCase();
        return `<button class="chip${good ? ' good' : ''}${t.n === d.topic ? ' on' : ''}" id="t-${i}" data-act="topic" data-a="${t.n}" data-name="${esc(key)}" aria-pressed="${t.n === d.topic}" ${p ? 'disabled' : ''} ${q && !key.includes(q) ? 'hidden' : ''}>${good ? '★ ' : ''}${t.n}</button>`;
      }).join('')}</div>
    </section>
    <section class="col"><h3 class="eyebrow">2 · Produção</h3>
      <div class="prod">
        <div>${AXES.map((a, i) => `<label class="field"><span>${a} <output data-live="sl:${i}"></output></span><input type="range" id="sl-${i}" min="0" max="100" value="${d.sl[i]}" data-bind="draft.sl.${i}" data-num></label>`).join('')}</div>
        <figure class="radar"><svg viewBox="0 0 220 180" role="img" aria-label="Foco atual da equipe comparado ao ideal do gênero">
          ${[22, 44, 66].map(r => `<polygon class="r-ring" points="${[0, 1, 2, 3].map(i => rp(r, i).join(',')).join(' ')}"/>`).join('')}
          ${AXES.map((a, i) => { const [x, yy] = rp(66, i), [lx, ly] = rp(80, i); return `<line class="r-axis" x1="110" y1="90" x2="${x}" y2="${yy}"/><text class="r-lbl" x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle">${a}</text>`; }).join('')}
          <g data-live="radar" data-html></g></svg>
          <figcaption><span class="key ideal"></span>Ideal para ${genre().n} <span class="key cur"></span>Seu foco · alinhamento <b data-live="align"></b></figcaption></figure>
      </div>
      <ul class="warn" data-live="warn" data-html></ul>
      <p class="label">Recursos pesquisados</p>
      ${feats.length ? `<div class="feats">${feats.map(t => `<label class="check"><input type="checkbox" id="f-${t.id}" data-feat="${t.id}" ${(p ? p.feats : d.feats).includes(t.id) ? 'checked' : ''} ${lk}> ${t.n} <small>${t.d || `+${Math.round(t.t * 100)}% de tempo`}</small></label>`).join('')}</div>` : '<p class="small muted">Pesquise recursos na aba Pesquisa para usá-los nos jogos.</p>'}
      ${extra(DEV_EXTRA.prod)}
      <div class="est"><span data-live="est"></span><meter data-live="estv" min="0" max="240" low="90" high="160" optimum="0"></meter></div>
      <button class="primary wide" id="start" data-act="start" ${p ? 'disabled' : ''}>${p ? 'Projeto em andamento' : 'Iniciar produção'}</button>
    </section>
    <section class="col"><h3 class="eyebrow">3 · Polimento e QA</h3>
      ${p ? `<h4 class="pname">${esc(p.name)}</h4><p class="small muted">${genre().n} · ${esc(p.topic)}${p.ip !== 'new' ? ' · sequência' : ''}</p>
        <p class="small" data-live="phase"></p><progress data-live="prog" max="1"></progress>
        <div class="seg"><span data-live="bugs"></span><small class="muted">bugs conhecidos</small></div>
        <p class="small">Hype acumulado: <b data-live="hype"></b>. O foco ao lado ainda pode ser ajustado até o lançamento.</p>
        <button id="launch" class="primary" data-act="launch" ${p.phase !== 'qa' ? 'disabled' : ''}>${p.phase !== 'qa' ? 'Aguardando o fim da produção' : p.armed ? 'Confirmar lançamento com bugs' : 'Lançar jogo'}</button>
        ${p.armed ? '<p class="small warn">Acima de 100 bugs a crítica não perdoa. Clique de novo para confirmar ou espere o QA.</p>' : ''}`
      : `<p class="empty">Nenhum jogo em produção. Escolha gênero e tema e clique em Iniciar produção.</p>${S.games[0] ? `<p class="small">Último lançamento: <b>${esc(S.games[0].n)}</b> · nota ${fmt1(S.games[0].score)}</p>` : ''}`}
      ${extra(DEV_EXTRA.qa)}
    </section></div>`;
  },

  mkt() {
    const p = S.project, y = year(), f = infl();
    return `<div class="kpis">
      <div><span class="label">Hype do projeto</span><b data-live="hype"></b></div>
      <div><span class="label">Fãs do estúdio</span><b data-live="fans"></b></div>
      <div><span class="label">Reputação</span><b data-live="rep"></b></div></div>
    <figure class="chart"><svg viewBox="0 0 600 180" role="img" aria-label="Hype real, hype prometido e fãs nas últimas 52 semanas">
      <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect class="hatch-line" width="2" height="6"/></pattern></defs>
      <line class="c-base" x1="20" x2="580" y1="160" y2="160"/><g data-live="chart" data-html></g></svg>
      <figcaption><span class="key hype"></span>Hype real <span class="key prom"></span>Hype prometido (área hachurada = promessa sem entrega) <span class="key fans"></span>Fãs · escalas relativas, últimas 52 semanas</figcaption></figure>
    <h3 class="eyebrow">Campanhas${p ? ' para ' + esc(p.name) : ''}</h3>
    ${p ? '' : '<p class="small muted">Inicie a produção de um jogo para investir em marketing.</p>'}
    <div class="adlist">${ADS.map(([n, y0, c, g], i) => `<button id="ad-${i}" data-act="ad" data-a="${i}" ${!p || y < y0 || S.money < c * f ? 'disabled' : ''}><b>${n}</b><small>${y < y0 ? 'Disponível em ' + y0 : `${fmt$(c * f)} · +${g} de hype`}</small></button>`).join('')}
      <button id="ad-fair" data-act="fair" ${!p || y < 1995 || p.fair || S.money < 50000 * f ? 'disabled' : ''}><b>Conferência na feira</b><small>${y < 1995 ? 'Disponível em 1995' : p?.fair ? 'Já apresentado' : `${fmt$(50000 * f)} · +60 de hype (IP lendária: muito mais)`}</small></button></div>
    <label class="check risk"><input type="checkbox" id="promise" data-bind="mkt.promise" ${S.mkt.promise ? 'checked' : ''}> Prometer recursos revolucionários</label>
    <p class="small muted">O hype das campanhas dobra, mas a diferença fica marcada no gráfico. Se o jogo sair com nota abaixo de 8, a promessa vira escândalo e as vendas e a reputação desabam.</p>`;
  },

  fin() {
    const subs = S.rivals.filter(r => r.sub);
    return `<div class="studio-head"><h3>${esc(S.studio)}</h3><button id="rename-studio" data-act="renameStudio">Renomear</button></div>
    <div class="kpis">
      <div><span class="label">Caixa</span><b data-live="money"></b></div>
      <div><span class="label">Receita no mês passado</span><b data-live="lastIn"></b></div>
      <div><span class="label">Despesas no mês passado</span><b data-live="lastOut"></b></div>
      <div><span class="label">Aluguel e salários por mês</span><b data-live="burn"></b></div></div>
    ${subs.length || S.divisions.length ? `<h3 class="eyebrow">Seu grupo</h3><div class="group">
      ${subs.map(r => { const i = S.rivals.indexOf(r); return `<div class="card current"><b>${esc(r.n)}</b>${r.orig ? `<small class="muted">antiga ${esc(r.orig)}</small>` : ''}<span>Subsidiária · IP ${esc(r.ip)} · ≈ ${fmt$(subProfit(r))}/mês</span>
        <label class="field">Diretriz<select id="dir-${i}" data-bind="rivals.${i}.dir" data-rerender>${Object.entries(DIRS).map(([k, [n, m, risk]]) => `<option value="${k}" ${(r.dir || 'eq') === k ? 'selected' : ''}>${n} · lucro ×${fmt1(m)}${risk ? `, ${Math.round(risk * 100)}% de risco de prejuízo` : ''}</option>`).join('')}</select></label>
        <div class="acts"><button id="ren-${i}" data-act="rename" data-a="${i}">Renomear</button><button id="sellsub-${i}" data-act="sell" data-a="${i}">Vender · ${fmt$(r.p * 1700 * r.own / 17 * .97)}</button></div></div>`; }).join('')}
      ${S.divisions.map((d, i) => `<div class="card"><b>${esc(d.n)}</b>${d.orig ? `<small class="muted">antiga ${esc(d.orig)}</small>` : ''}<span>Divisão interna · +${d.rp} PP por mês</span><div class="acts"><button id="rendiv-${i}" data-act="renameDiv" data-a="${i}">Renomear</button></div></div>`).join('')}
    </div>` : ''}
    <h3 class="eyebrow">Bolsa de estúdios rivais</h3>
    <div class="scroll"><table class="tbl"><thead><tr><th>Estúdio</th><th class="num">Ação</th><th>Sua parte</th><th class="num">Para você/mês</th><th>Ordens</th></tr></thead><tbody>
    ${S.rivals.map((r, i) => {
      const lot = r.p * 1700, ch = (r.p / r.prev - 1) * 100, host = r.own >= 51 && !r.sub;
      return `<tr class="${host ? 'hostile' : ''}"><th scope="row">${esc(r.n)}<small>IP: ${esc(r.ip)}${r.orig ? ` · antiga ${esc(r.orig)}` : ''}</small></th>
        <td class="num">$${r.p.toFixed(2).replace('.', ',')}<small class="${ch >= 0 ? 'up' : 'down'}">${ch >= 0 ? '▲' : '▼'} ${fmt1(Math.abs(ch))}%</small></td>
        <td><span class="donut" style="--v:${r.own}" aria-hidden="true"></span> ${r.own}%</td>
        <td class="num">${fmt$(dividend(r))}</td>
        <td><div class="acts">${host ? `<span class="hostile-tag">Controle obtido</span><button class="danger" id="decide-${i}" data-act="decide" data-a="${i}">Decidir nome e destino</button>`
          : r.sub ? '<span class="muted">Subsidiária</span>'
          : `<button id="buy-${i}" data-act="buy" data-a="${i}" ${S.money < lot ? 'disabled' : ''}>Comprar 17% · ${fmt$(lot)}</button>${r.own ? `<button id="sell-${i}" data-act="sell" data-a="${i}">Vender 17%</button>` : ''}`}</div></td></tr>`;
    }).join('') || '<tr><td colspan="5">Você comprou todos os rivais.</td></tr>'}
    </tbody></table></div>
    <p class="small muted">Cada lote compra 17% do estúdio. Com 51% você assume o controle, escolhe o nome e decide entre subsidiária e divisão interna.</p>`;
  },

  staff() {
    const cap = deskCapacity(), full = S.staff.length >= cap;
    return `<div class="crunch${S.crunch ? ' on' : ''}">
      <button id="crunch" data-act="crunch" aria-pressed="${S.crunch}" class="${S.crunch ? 'danger' : ''}">${S.crunch ? 'Encerrar crunch' : 'Ativar crunch'}</button>
      <p class="small">Horas extras obrigatórias: +50% de produção, mas a moral despenca. Moral muito baixa causa burnout e vazamentos para a imprensa. Moral média: <b data-live="avgm"></b>/100.</p></div>
    <h3 class="eyebrow">Equipe · ${S.staff.length} de ${cap} mesas</h3>
    <div class="scroll"><table class="tbl"><thead><tr><th>Nome</th><th>Perfil</th><th class="num">Talento</th><th>Moral</th><th class="num">Salário</th><th></th></tr></thead><tbody>
    ${S.staff.map(e => `<tr><th scope="row">${esc(e.n)}</th><td>${tag(e.trait)}</td><td class="num">${e.skill}/10</td><td><meter data-live="morale:${e.id}" min="0" max="100" low="30" high="60" optimum="100" aria-label="Moral de ${esc(e.n)}"></meter></td><td class="num">${fmt$(e.sal)}</td><td>${e.id ? `<button id="fire-${e.id}" data-act="fire" data-a="${e.id}">Demitir</button>` : ''}</td></tr>`).join('')}
    </tbody></table></div>
    <h3 class="eyebrow">Candidatos do mês</h3>
    ${full ? '<p class="small muted">Todas as mesas estão ocupadas. Mude para uma sede maior na aba Cidade e imóveis.</p>' : ''}
    <div class="cards">${S.cands.map((c, i) => `<div class="card"><b>${esc(c.n)}</b>${tag(c.trait)}<span>Talento ${c.skill}/10 · ${fmt$(c.sal)}/mês</span><button id="hire-${i}" data-act="hire" data-a="${i}" ${full || S.money < c.sal ? 'disabled' : ''}>Contratar</button></div>`).join('') || '<p class="small muted">Novos candidatos no próximo mês.</p>'}</div>
    <p class="small muted">Perfeccionistas trabalham devagar e quase não geram bugs. Caóticos são rápidos e enchem o código de erros. Sedes com prestígio atraem candidatos melhores.</p>`;
  },

  res() {
    const y = year();
    return `<p>Pontos de pesquisa: <b data-live="rp"></b> PP. <span class="small muted">Toda a equipe gera pesquisa; sem projeto em andamento, gera o triplo.</span></p>
    <div id="tl" class="timeline">${ERAS.map(([n, a, b]) => `<section class="era${y >= a && y <= b ? ' now' : ''}"><h3>${n}<small>${a}–${b > 2050 ? 'hoje' : b}</small></h3>
      <p class="genres">${GENRES.filter(g => g.y >= a && g.y <= b).map(g => `<span class="pill${g.y > y ? ' off' : ''}">${g.n}</span>`).join('')}</p>
      ${TECH.filter(t => t.y >= a && t.y <= b).map(t => { const done = S.researched.includes(t.id), lk = t.y > y;
        return `<div class="tech${done ? ' done' : lk ? ' locked' : ''}"><b>${t.n}</b><small>${t.y} · ${t.d || `+${Math.round(t.t * 100)}% de tempo, qualidade +${String(t.q).replace('.', ',')}`}</small>${done ? '<span class="ok">Pesquisado</span>' : lk ? `<span class="small muted">Bloqueado até ${t.y}</span>` : `<button id="r-${t.id}" data-act="research" data-a="${t.id}" ${S.rp < t.rp ? 'disabled' : ''}>Pesquisar · ${t.rp} PP</button>`}</div>`; }).join('')}
    </section>`).join('')}</div>
    <p class="small muted">A crítica compara seus recursos com o que já existe na época. Jogos sem tecnologia recente perdem nota.</p>`;
  },

  ip() {
    if (!S.ips.length) return '<p class="empty">Lance seu primeiro jogo para criar uma propriedade intelectual.</p>';
    const mf = Math.max(1, ...S.ips.map(i => i.fans));
    return `<div class="ips">${S.ips.map(i => `<article class="ipc${i.legend ? ' legend' : ''}${i.burned ? ' burned' : ''}" data-ip="${i.id}"><h4>${esc(i.n)}</h4>
      <span class="pill">${i.burned ? 'Queimada por review bombing' : i.legend ? 'Fenômeno cultural' : `${i.games} jogo${i.games === 1 ? '' : 's'}`}</span>
      <label class="small">Fidelidade · ${fmtN(i.fans)} fãs<meter min="0" max="${mf}" value="${i.fans}"></meter></label>
      <label class="small">Nota média · ${i.games ? fmt1(i.sum / i.games) : '—'}<meter min="0" max="10" low="5" high="7.5" optimum="10" value="${i.games ? i.sum / i.games : 0}"></meter></label>
      ${!i.burned && S.day - i.last < 720 ? '<p class="small warn">Fadiga: outra sequência antes de 2 anos perde nota.</p>' : ''}
      ${i.legend ? `<p class="small">Licenciamento transmídia: ${fmt$(i.fans * .3)}/mês</p>` : ''}</article>`).join('')}</div>
    <h3 class="eyebrow">Arquivo de lançamentos</h3>
    <div class="scroll"><table class="tbl"><thead><tr><th>Jogo</th><th>Ano</th><th>Gênero e tema</th><th class="num">Nota</th><th class="num">Cópias</th><th class="num">Receita</th><th>Status</th></tr></thead><tbody>
    ${S.games.map(g => `<tr><th scope="row">${esc(g.n)}</th><td>${g.y}</td><td>${g.genre} · ${esc(g.topic)}</td><td class="num">${fmt1(g.score)}</td><td class="num">${fmtN(g.units)}</td><td class="num">${fmt$(g.rev)}</td><td>${g.left > 0 ? 'À venda' : 'Fora de catálogo'}</td></tr>`).join('') || '<tr><td colspan="7">Nenhum jogo lançado ainda.</td></tr>'}
    </tbody></table></div>`;
  },
});

function renderTab() {
  const tp = $('#tp'), f = document.activeElement?.id, top = tp.scrollTop, tl = $('#tl')?.scrollLeft;
  tp.innerHTML = (VIEWS[S.tab] && safe(VIEWS[S.tab], [])) ?? '<p class="empty">Esta aba não carregou.</p>';
  tp.scrollTop = top;
  if (tl != null && $('#tl')) $('#tl').scrollLeft = tl;
  if (f && tp.querySelector('#' + CSS.escape(f))) tp.querySelector('#' + CSS.escape(f)).focus({ preventScroll: true });
  refreshLive();
  run('render', S.tab);
}
function selectTab(id, focus) {
  S.tab = TABS.some(t => t[0] === id) ? id : 'dev';
  for (const b of $('#tabs').children) { const on = b.dataset.tab === S.tab; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; }
  $('#tp').setAttribute('aria-labelledby', 'tab-' + S.tab);
  $('#panel').classList.remove('collapsed'); $('#collapse').setAttribute('aria-expanded', true); $('#collapse').textContent = 'Recolher';
  renderTab(); $('#tp').scrollTop = 0;
  if (focus) $('#tab-' + S.tab).focus();
}
function setView(v) {
  S.view = DRAW[v] ? v : 'office';
  for (const b of document.querySelectorAll('[data-view]')) b.setAttribute('aria-pressed', b.dataset.view === S.view);
  cv.setAttribute('aria-label', S.view === 'city' ? 'Mapa da cidade' : 'Escritório do estúdio em vista isométrica');
  run('view', S.view);
}

// ---------- Canvas e projeção isométrica compartilhados ----------
const cv = $('#world'), ctx = cv.getContext('2d');
const cam = { tw: 40, th: 20, ox: 0, oy: 0 };
const iso = (x, y) => [cam.ox + (x - y) * cam.tw / 2, cam.oy + (x + y) * cam.th / 2];
const up = ([x, y], h) => [x, y - h];
function poly(ps, fill, stroke) {
  ctx.beginPath(); ps.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}
function box(x, y, w, d, h, [top, left, right], z = 0) {
  const P = (X, Y) => up(iso(X, Y), z), a = P(x, y + d), b = P(x + w, y + d), r = P(x + w, y), t = P(x, y);
  poly([a, b, up(b, h), up(a, h)], left);
  poly([b, r, up(r, h), up(b, h)], right);
  poly([up(t, h), up(r, h), up(b, h), up(a, h)], top);
}

// ---------- Laço principal, inicialização e eventos ----------
let acc = 0, lastT = performance.now();
function frame(now) {
  const dt = Math.min(250, now - lastT), go = running(); lastT = now;
  if (go) {
    acc += dt; let ticked = false;
    while (running() && acc >= MS_PER_DAY[S.speed]) { acc -= MS_PER_DAY[S.speed]; tickDay(); ticked = true; }
    if (ticked) refreshLive();
  } else acc = 0;
  run('frame', go ? dt * S.speed : 0, now);
  if (dirty) { dirty = false; renderTab(); }
  if (cv.width && cv.height) safe(DRAW[S.view] || DRAW.office, [now]);
  requestAnimationFrame(frame);
}
function boot() {
  fill(S, DEFAULTS);
  S.speed = 0;
  if (!S.cands.length) S.cands = [newEmp(), newEmp(), newEmp()];
  run('boot');
  $('#tabs').innerHTML = TABS.map(([id, n]) => `<button role="tab" id="tab-${id}" data-tab="${id}" aria-controls="tp">${n}<span class="badge" data-live="badge:${id}"></span></button>`).join('');
  selectTab(S.tab); setView(S.view); updateTime(); refreshLive();
  if (!S.intro) intro(); else if (!S.studio) askStudio();
}
function start(data) {
  S = data?.S || load() || newGame();
  boot();
  requestAnimationFrame(frame);
}

for (const b of document.querySelectorAll('[data-speed]')) b.onclick = () => setSpeed(+b.dataset.speed);
for (const b of document.querySelectorAll('[data-view]')) b.onclick = () => setView(b.dataset.view);
$('#tabs').onclick = e => { const b = e.target.closest('[role=tab]'); if (b) selectTab(b.dataset.tab); };
$('#tabs').onkeydown = e => {
  const i = TABS.findIndex(t => t[0] === S.tab), k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
  if (k === undefined) return;
  e.preventDefault(); selectTab(TABS[(k + TABS.length) % TABS.length][0], true);
};
$('#collapse').onclick = () => { const c = $('#panel').classList.toggle('collapsed'); $('#collapse').setAttribute('aria-expanded', !c); $('#collapse').textContent = c ? 'Abrir painel' : 'Recolher'; };
$('#reset').onclick = e => {
  const b = e.currentTarget;
  if (b.dataset.armed) { delete b.dataset.armed; b.textContent = 'Novo jogo'; S = newGame(); save(); boot(); return; }
  b.dataset.armed = 1; b.textContent = 'Confirmar novo jogo?';
  setTimeout(() => { delete b.dataset.armed; b.textContent = 'Novo jogo'; }, 3000);
};
$('#tp').addEventListener('click', e => { const b = e.target.closest('[data-act]'); if (b && !b.disabled && ACT[b.dataset.act]) { ACT[b.dataset.act](b.dataset.a); refreshLive(); } });
$('#tp').addEventListener('input', e => {
  const t = e.target, d = t.dataset, tp = $('#tp');
  if (t.id === 'tfilter') {
    tfilter = t.value; const q = t.value.toLowerCase().trim();
    for (const c of tp.querySelectorAll('[data-name]')) c.hidden = !!q && !c.dataset.name.includes(q);
    return;
  }
  if (d.feat) S.draft.feats = t.checked ? [...new Set([...S.draft.feats, d.feat])] : S.draft.feats.filter(x => x !== d.feat);
  if (d.bind) { const ks = d.bind.split('.'), last = ks.pop(); ks.reduce((o, k) => o[k], S)[last] = t.type === 'checkbox' ? t.checked : 'num' in d ? +t.value : t.value; }
  run('input', e);
  if ('rerender' in d) markDirty();
  refreshLive();
});
addEventListener('keydown', e => {
  if ($('#modal').open || e.target.matches('input:not([type=range]):not([type=checkbox]), select, textarea')) return;
  if (e.code === 'Space' && !e.target.closest('button, input, [role=tab]')) { e.preventDefault(); setSpeed(S.speed ? 0 : S.last); }
  else if (/^[0-3]$/.test(e.key)) setSpeed(+e.key);
});
addEventListener('visibilitychange', () => { if (document.hidden) save(); });
new ResizeObserver(() => { const r = cv.getBoundingClientRect(), k = devicePixelRatio || 1; cv.width = Math.round(r.width * k); cv.height = Math.round(r.height * k); }).observe(cv);

// ---------- Autotestes do núcleo (rodados por test/smoke.cjs) ----------
const until = async (f, ms = 3000) => { for (let t = 0; t < ms; t += 10) { if (f()) return; await new Promise(r => setTimeout(r, 10)); } throw new Error('tempo esgotado esperando a condição'); };
const testRival = () => S.rivals.find(x => !x.sub && x.own < 51) || (S.rivals.push({ n: 'Teste Games', ip: 'Teste', p: 5, prev: 5, own: 0, fans: 100, sub: false, dir: 'eq' }), S.rivals.at(-1));
SELFTESTS.push({
  name: 'núcleo: renomear estúdio comprado ao assumir o controle',
  async run() {
    const r = testRival();
    r.own = 51; const pr = takeover(r); await until(() => $('#modal').open && $('#mb input[name=name]'));
    $('#mb input[name=name]').value = '  Nova   Pixel  '; $('#mf button[value=sub]').click(); await pr;
    check(r.n === 'Nova Pixel' && r.sub && r.orig, `renomear falhou: ${JSON.stringify(r)}`);
  },
});
SELFTESTS.push({
  name: 'núcleo: manter o nome ao absorver como divisão',
  async run() {
    const r = testRival(), name = r.n, before = S.divisions.length;
    r.own = 51; const pr = takeover(r); await until(() => $('#modal').open && $('#mb input[name=name]'));
    $('#mf button[value=absorb]').click(); await pr;
    check(S.divisions.length === before + 1 && S.divisions.at(-1).n === name && !S.rivals.includes(r), 'absorver falhou');
  },
});
SELFTESTS.push({
  name: 'núcleo: nome do estúdio é limpo e limitado',
  run() { check(cleanName('   a   b  ', 'x') === 'a b' && cleanName('   ', 'x') === 'x' && cleanName('y'.repeat(50), 'x').length === 28, 'cleanName'); },
});

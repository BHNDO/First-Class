// Hardware: projeto, preço e ciclo de vida do console próprio (aba Hardware).
(() => {
  const rd = () => 80000 * (1 + (year() - 1980) / 10);
  const consoleMarket = () => 30000 * 1.05 ** (year() - 1980);
  const bestPower = () => SLOTS.reduce((a, [k]) => a + Math.max(...HW[k].filter(c => c[1] <= year()).map(c => c[2])), 0);
  const share = (power, price, cost) => clamp(.15 * (power / bestPower()) ** 2 * (cost * 1.4 / price) ** 1.3 * (.5 + S.rep / 100), 0, .6);
  const hwFail = c => clamp(.25 + .08 * c.heat, .25, .9);
  function hwStats() {
    const cs = SLOTS.map(([k]) => HW[k][S.hw[k]]);
    const gen = cs.reduce((a, c) => a + Math.max(0, c[3]), 0), cool = cs.reduce((a, c) => a - Math.min(0, c[3]), 0);
    return { power: cs.reduce((a, c) => a + c[2], 0), cost: cs.reduce((a, c) => a + c[4], 0), gen, cool, heat: gen - cool };
  }

  async function redLight() {
    const c = S.console, recall = Math.round(c.base * c.cost * .7);
    const { v } = await modal('Luz vermelha', `<p>O ${esc(c.name)} está superaquecendo. Cerca de ${Math.round(hwFail(c) * 100)}% dos ${fmtN(c.base)} consoles vendidos falharam.</p><p>Um recall global custa ${fmt$(recall)}. Ignorar o defeito destrói a confiança na marca e tira o console das lojas.</p>`,
      [[`Recall global (${fmt$(recall)})`, 'recall', 'danger'], ['Ignorar o defeito', 'ignore', '']], true);
    if (S.console !== c) return;
    if (v === 'recall') { cash(-recall, 'pd'); c.defect = false; S.rep = clamp(S.rep - 5, 0, 100); toast('Recall concluído. O console voltou às lojas sem defeito.', 'warn'); }
    else { S.rep = clamp(S.rep - 35, 0, 100); S.fans = Math.round(S.fans * .6); S.console = null; toast(`${c.name} saiu do mercado. A reputação despencou.`, 'bad'); }
    markDirty('hw');
  }

  HOOKS.month.push(() => {
    const c = S.console;
    if (!c) return;
    c.age++;
    const u = Math.round(consoleMarket() * share(c.power, c.price, c.cost) * .97 ** c.age), loss = c.price < c.cost;
    c.base += u; c.last = u; c.studios = Math.round(c.base / 3000 * (loss ? 1.5 : 1));
    cash(u * (c.price - c.cost), 'console');
    cash(u * 8 * (loss ? 1.5 : 1), 'royalties'); // jogos de terceiros vendidos para quem comprou o console
    if (c.defect && c.age === 3) redLight();
  });
  MOD.units.push(v => v * (S.console ? 1.2 : 1)); // seus jogos vendem mais com console próprio no mercado

  ACT.hwlaunch = () => {
    const st = hwStats(), cost = rd();
    if (S.money < cost || year() < 1980) return;
    cash(-cost, 'pd');
    if (S.console) toast(`${S.console.name} foi descontinuado.`);
    S.console = { name: S.hw.name.trim() || 'Console', power: st.power, cost: st.cost, price: S.hw.price, heat: st.heat, defect: st.heat > 0, base: 0, last: 0, age: 0, studios: 0 };
    toast(`${S.console.name} chegou às lojas.`, 'good'); markDirty();
  };

  Object.assign(LIVE, {
    hwprice: () => fmt$(S.hw.price),
    hwbe: () => {
      const { cost } = hwStats(), price = S.hw.price, max = Math.max(cost, price) * 1.1, loss = price < cost;
      return `<div class="be" aria-hidden="true"><div class="bar" style="width:${cost / max * 100}%"></div><div class="bar price${loss ? ' loss' : ''}" style="width:${price / max * 100}%"></div><div class="line" style="left:${cost / max * 100}%"></div></div>
        <p class="small">Cinza: custo ${fmt$(cost)} · ${loss ? 'vermelho' : 'verde'}: preço ${fmt$(price)} · linha: ponto de equilíbrio.<br>${loss ? `<b class="bad">Prejuízo de ${fmt$(cost - price)} por unidade.</b> Estratégia loss leader: mais estúdios licenciam jogos para o console.` : `Margem de ${fmt$(price - cost)} por unidade.`}</p>`;
    },
    hwproj: () => {
      const st = hwStats(), u = Math.round(consoleMarket() * share(st.power, S.hw.price, st.cost));
      return `Projeção: ≈ ${fmtN(u)} consoles por mês e ${fmtN(u * 12 / 3000 * (S.hw.price < st.cost ? 1.5 : 1))} estúdios interessados em licenciar no primeiro ano.`;
    },
  });

  VIEWS.hw = () => {
    const y = year();
    if (y < 1980) return '<p class="empty">O mercado de consoles abre em 1980. Até lá, foque em software.</p>';
    const h = S.hw, st = hwStats(), c = S.console, hue = clamp(220 - st.gen / Math.max(.5, st.cool) * 200, 0, 220);
    return `<div class="hw">
    <section class="blueprint"><h3 class="eyebrow">Projeto do console</h3>
      <label class="field">Nome<input id="hw-name" data-bind="hw.name" maxlength="24" value="${esc(h.name)}"></label>
      ${SLOTS.map(([k, n]) => `<label class="field">${n}<select id="hw-${k}" data-bind="hw.${k}" data-num data-rerender>${HW[k].map((p, i) => p[1] <= y ? `<option value="${i}" ${i === h[k] ? 'selected' : ''}>${p[0]} · ${fmt$(p[4])}${p[3] < 0 ? ` · resfria ${-p[3]}` : p[3] ? ` · calor ${p[3]}` : ''}</option>` : '').join('')}</select></label>`).join('')}
      <div class="console${st.heat > 0 ? ' hot' : ''}" style="--heatc: hsl(${hue} 90% 55%)" role="img" aria-label="Mapa de calor: ${st.heat > 0 ? 'superaquecimento' : 'temperatura sob controle'}">${esc(h.name)}</div>
      <p class="small">${st.heat > 0 ? `<b class="bad">Superaquecimento:</b> calor ${st.gen} contra refrigeração ${st.cool}. Risco de falha em massa depois do lançamento.` : `Calor ${st.gen} · refrigeração ${st.cool}: estável.`}</p>
    </section>
    <section><h3 class="eyebrow">Preço e ecossistema</h3>
      <p>Potência: <b>${Math.round(st.power / bestPower() * 100)}%</b> do estado da arte · custo por unidade: <b>${fmt$(st.cost)}</b></p>
      <label class="field"><span>Preço de venda <output data-live="hwprice"></output></span><input type="range" id="hw-price" min="20" max="999" step="5" value="${h.price}" data-bind="hw.price" data-num></label>
      <div data-live="hwbe" data-html></div>
      <p class="small" data-live="hwproj"></p>
      <button class="primary" id="hw-launch" data-act="hwlaunch" ${S.money < rd() ? 'disabled' : ''}>Lançar console · P&amp;D ${fmt$(rd())}</button>
      ${c ? `<div class="card current" style="margin-top:12px"><b>${esc(c.name)} nas lojas</b><span>${fmtN(c.base)} consoles vendidos · ${fmtN(c.last)} no último mês</span><span>${fmt$(c.price)} por unidade (custo ${fmt$(c.cost)}) · ${c.studios} estúdios licenciados</span>${c.defect ? '<span class="bad">Defeito térmico não corrigido</span>' : ''}</div>` : ''}
    </section></div>`;
  };
})();

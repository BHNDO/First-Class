// Cidade e imóveis: escolha da sede. (O mapa da cidade ainda é um espaço reservado.)
(() => {
  addTab('city', 'Cidade e imóveis', 'staff');

  ACT.move = i => {
    const o = OFFICES[i];
    if (S.money < o.cost || S.staff.length > o.desks || +i === S.office) return;
    cash(-o.cost, 'imoveis'); S.office = +i; reindex(true);
    toast(`Nova sede: ${o.n} (${o.zone}).`, 'good'); markDirty();
  };

  VIEWS.city = () => `<h3 class="eyebrow">Sede</h3>
    <div class="cards">${OFFICES.map((x, i) => `<div class="card${i === S.office ? ' current' : ''}"><b>${x.n}</b><span>${x.zone} · ${x.desks} mesas</span><span>Aluguel ${fmt$(x.rent)}/mês · prestígio ${'★'.repeat(x.prest) || 'nenhum'}</span>${i === S.office ? '<span class="pill">Sede atual</span>' : `<button id="move-${i}" data-act="move" data-a="${i}" ${S.money < x.cost || S.staff.length > x.desks ? 'disabled' : ''}>Mudar · ${fmt$(x.cost)}</button>`}</div>`).join('')}</div>
    <p class="small muted">Prestígio atrai candidatos mais talentosos e melhora a moral.</p>`;

  DRAW.city = () => {
    ctx.fillStyle = '#121725'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#8d96a9'; ctx.font = `${Math.round(14 * (devicePixelRatio || 1))}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('Mapa da cidade em construção', cv.width / 2, cv.height / 2);
  };
})();

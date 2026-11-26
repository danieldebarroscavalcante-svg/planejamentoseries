// Pequenos blocos de interface reaproveitados pelas telas.

import { configDaSerie, pessoaPendente, semAcento } from './nucleo/modelo.js';
import { diaMes } from './nucleo/datas.js';
import { ehIntroducao, ehProlongado } from './nucleo/regras.js';

/** Escapa texto vindo da planilha antes de colocar no HTML. */
export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const COR_PADRAO = '#6B7280';

export function corDaSerie(serie, config) {
  return configDaSerie(serie, config)?.cor ?? COR_PADRAO;
}

export function nomeCurtoDaSerie(serie, config) {
  return configDaSerie(serie, config)?.curto ?? serie;
}

export function rotuloEixo(serie, config) {
  return configDaSerie(serie, config)?.rotuloEixo || 'Cumprimento profético / Eixo de identidade';
}

export function chipSerie(d, ctx, { curto = true } = {}) {
  if (!d.serie) return '';
  const nome = curto ? nomeCurtoDaSerie(d.serie, ctx.config) : d.serie;
  const msg = d.posicao ? ` · ${d.posicao}/${d.total}` : '';
  return `<span class="chip" style="--cor:${esc(corDaSerie(d.serie, ctx.config))}">${esc(nome)}${msg}</span>`;
}

export function pessoa(nome) {
  return pessoaPendente(nome) ? '<span class="a-definir">A definir</span>' : esc(nome);
}

/** Selos do domingo: introdução, feriado, feriadão, datas comemorativas, retiro. */
export function selos(d, ctx) {
  const s = [];
  if (d.semMinistracao && !semAcento(d.status).startsWith('sem ministracao')) s.push('<span class="selo selo-retiro">Sem ministração</span>');
  if (!d.semMinistracao && d.serie && ehIntroducao(d) && d.posicao) s.push('<span class="selo selo-intro">Introdução</span>');
  if (d.feriado) {
    const prolongado = ehProlongado(d, ctx.base, ctx.config);
    s.push(`<span class="selo selo-feriado" title="${esc(d.feriado)}">${prolongado ? 'Feriadão' : 'Feriado'}</span>`);
  }
  for (const e of ctx.base.datasEspeciais ?? []) {
    if (e.data === d.data && semAcento(e.tipo).startsWith('data comemorativa')) s.push(`<span class="selo selo-data">${esc(e.descricao)}</span>`);
  }
  return s.join(' ');
}

export function statusBadge(status) {
  const cls = semAcento(status).replace(/[^a-z]+/g, '-');
  return status ? `<span class="status status-${cls}">${esc(status)}</span>` : '';
}

/** Linha de domingo usada em listas (Painel, Cronograma, Séries, Equipe). */
export function itemDomingo(d, ctx, { extra = '' } = {}) {
  const passado = d.data < ctx.hoje ? ' passado' : '';
  const corpo = d.semMinistracao
    ? `<div class="item-tema">${esc(d.tema || 'Sem ministração')}</div>`
    : `<div class="item-texto">${esc(d.texto)}</div>
       <div class="item-tema">${esc(d.tema)}</div>
       <div class="item-pessoas"><span>Preletor: ${pessoa(d.preletor)}</span><span>Saudação: ${pessoa(d.saudacao)}</span></div>`;
  return `<li><a class="item${passado}" href="#/domingo/${d.data}" style="--cor:${esc(corDaSerie(d.serie, ctx.config))}">
    <div class="item-data"><strong>${diaMes(d.data)}</strong><small>${d.data.slice(0, 4)}</small></div>
    <div class="item-corpo">
      <div class="item-topo">${chipSerie(d, ctx)} ${statusBadge(d.status)} ${selos(d, ctx)}</div>
      ${corpo}${extra}
    </div></a></li>`;
}

export function listaDomingos(lista, ctx, opcoes) {
  if (!lista.length) return '<p class="vazio">Nenhum domingo encontrado.</p>';
  return `<ul class="lista">${lista.map((d) => itemDomingo(d, ctx, opcoes)).join('')}</ul>`;
}

export function legendaSeries(ctx) {
  return `<div class="legenda">${(ctx.config.series ?? []).map((s) =>
    `<span class="chip" style="--cor:${esc(s.cor)}">${esc(s.curto)}</span>`).join('')}</div>`;
}

export function avisar(mensagem) {
  const t = document.getElementById('aviso-rapido');
  t.textContent = mensagem;
  t.hidden = false;
  clearTimeout(avisar.timer);
  avisar.timer = setTimeout(() => { t.hidden = true; }, 2500);
}

export async function copiar(texto) {
  try {
    await navigator.clipboard.writeText(texto);
  } catch {
    const area = Object.assign(document.createElement('textarea'), { value: texto });
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  avisar('Texto copiado! É só colar no WhatsApp.');
}


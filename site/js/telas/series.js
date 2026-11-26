import { pessoaPendente, semAcento, slug } from '../nucleo/modelo.js';
import { diaMes, formatarData } from '../nucleo/datas.js';
import { ehIntroducao, series } from '../nucleo/regras.js';
import { esc, pessoa, rotuloEixo, statusBadge } from '../ui.js';

export const titulo = 'Séries';

function mensagem(d, ctx) {
  const intro = !d.semMinistracao && ehIntroducao(d) && d.posicao;
  const passado = d.data < ctx.hoje ? ' passado' : '';
  return `<li class="msg${intro ? ' intro' : ''}${passado}">
    <a href="#/domingo/${d.data}">
      <span class="msg-num">${d.posicao ?? '★'}</span>
      <span class="msg-corpo">
        <span class="msg-topo"><strong>${diaMes(d.data)}</strong> · ${esc(d.texto)} ${intro ? '<span class="selo selo-intro">Introdução</span>' : ''} ${statusBadge(d.status)}</span>
        <span class="msg-tema">${esc(d.tema)}</span>
        ${d.eixo && d.eixo !== '—' ? `<span class="msg-eixo"><em>${esc(rotuloEixo(d.serie, ctx.config))}:</em> ${esc(d.eixo)}</span>` : ''}
        <span class="msg-pessoas">Preletor: ${pessoa(d.preletor)} · Saudação: ${pessoa(d.saudacao)}</span>
      </span>
    </a></li>`;
}

export function render(ctx) {
  const lista = series(ctx.base, ctx.config).filter((s) => s.domingos.some((d) => !d.semMinistracao));
  const indice = lista.map((s) => `<a class="chip" style="--cor:${esc(s.config?.cor ?? '#6B7280')}" href="#/series?s=${slug(s.nome)}">${esc(s.config?.curto ?? s.nome)}</a>`).join('');
  const blocos = lista.map((s) => {
    const msgs = s.domingos.filter((d) => !d.semMinistracao);
    const feitas = msgs.filter((d) => d.data < ctx.hoje || semAcento(d.status) === 'realizado').length;
    const comPreletor = msgs.filter((d) => !pessoaPendente(d.preletor)).length;
    return `<section class="cartao serie" id="serie-${slug(s.nome)}" style="--cor:${esc(s.config?.cor ?? '#6B7280')}">
      <h2>${esc(s.nome)}</h2>
      <p class="mudo">${formatarData(msgs[0].data)} a ${formatarData(msgs.at(-1).data)} · ${msgs.length} ${msgs.length === 1 ? 'mensagem' : 'mensagens'} · ${feitas} realizadas · ${comPreletor} com preletor</p>
      <ol class="mensagens">${msgs.map((d) => mensagem(d, ctx)).join('')}</ol>
    </section>`;
  }).join('');
  return `<h1>Séries ${esc(ctx.config.ano ?? '')}</h1><nav class="legenda" aria-label="Ir para a série">${indice}</nav>${blocos}`;
}

export function ligar(ctx, raiz) {
  const s = ctx.params.get('s');
  if (s) raiz.querySelector(`#serie-${CSS.escape(s)}`)?.scrollIntoView();
}

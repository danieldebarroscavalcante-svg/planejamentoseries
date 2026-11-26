import { slug } from '../nucleo/modelo.js';
import { dataPorExtenso, diaMes, formatarData } from '../nucleo/datas.js';
import { textoWhatsApp } from '../nucleo/formatos.js';
import { copiar, corDaSerie, esc, pessoa, rotuloEixo, selos, statusBadge } from '../ui.js';

export const titulo = 'Domingo';

const campo = (rotulo, valor) => `<div><dt>${esc(rotulo)}</dt><dd>${valor || '<span class="mudo">—</span>'}</dd></div>`;

export function render(ctx, [, data]) {
  const lista = ctx.base.domingos;
  const i = lista.findIndex((d) => d.data === data);
  if (i < 0) return `<section class="cartao"><h1>Domingo não encontrado</h1><p>Não há ${esc(formatarData(data) || data)} no cronograma.</p><p><a href="#/cronograma">Voltar ao cronograma</a></p></section>`;
  const d = lista[i];
  const anterior = lista[i - 1], proximo = lista[i + 1];
  const especiais = (ctx.base.datasEspeciais ?? []).filter((e) => e.data === d.data);
  const pend = ctx.pendencias.filter((p) => p.data === d.data);

  return `
    <nav class="voltar"><a href="#/cronograma">← Cronograma</a></nav>
    <article class="detalhe" style="--cor:${esc(corDaSerie(d.serie, ctx.config))}">
      <div class="detalhe-topo">
        <p class="rotulo">${d.numero ? `Ministração nº ${d.numero}` : 'Domingo'}</p>
        <h1>${dataPorExtenso(d.data)}</h1>
        <div class="item-topo">${statusBadge(d.status)} ${selos(d, ctx)}</div>
      </div>
      ${pend.length ? `<ul class="pendencias">${pend.map((p) => `<li class="pend pend-${p.nivel}">${esc(p.mensagem)}</li>`).join('')}</ul>` : ''}
      <dl class="campos">
        ${campo('Data', formatarData(d.data))}
        ${campo('Texto', esc(d.texto))}
        ${campo('Tema da mensagem', esc(d.tema))}
        ${campo('Preletor', d.semMinistracao ? '' : pessoa(d.preletor))}
        ${campo('Saudação', d.semMinistracao ? '' : pessoa(d.saudacao))}
        ${campo('Série', d.serie ? `<a href="#/series?s=${slug(d.serie)}">${esc(d.serie)}</a>` : '')}
        ${campo('Mensagem na série', esc(d.mensagem))}
        ${campo('Status', esc(d.status))}
        ${campo('Feriado / fim de semana prolongado', esc(d.feriado))}
        ${campo(rotuloEixo(d.serie, ctx.config), esc(d.eixo))}
        ${campo('Observações', esc(d.observacoes))}
        ${especiais.length ? campo('Datas especiais', especiais.map((e) => `${esc(e.descricao)}${e.prolongado ? ' <span class="selo selo-feriado">Feriadão</span>' : ''}`).join('<br>')) : ''}
      </dl>
      ${d.semMinistracao ? '' : `
      <section class="whatsapp">
        <h2>Lembrete para WhatsApp</h2>
        <pre id="texto-whatsapp">${esc(textoWhatsApp(d))}</pre>
        <div class="botoes">
          <button type="button" class="botao" data-acao="copiar">Copiar texto para WhatsApp</button>
          <a class="botao botao-secundario" href="https://wa.me/?text=${encodeURIComponent(textoWhatsApp(d))}" target="_blank" rel="noopener">Abrir no WhatsApp</a>
        </div>
      </section>`}
    </article>
    <nav class="anterior-proximo">
      ${anterior ? `<a href="#/domingo/${anterior.data}">← ${diaMes(anterior.data)}</a>` : '<span></span>'}
      ${proximo ? `<a href="#/domingo/${proximo.data}">${diaMes(proximo.data)} →</a>` : '<span></span>'}
    </nav>`;
}

export function ligar(ctx, raiz, [, data]) {
  const d = ctx.base.domingos.find((x) => x.data === data);
  raiz.querySelector('[data-acao="copiar"]')?.addEventListener('click', () => copiar(textoWhatsApp(d)));
}


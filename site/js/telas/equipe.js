import { slug } from '../nucleo/modelo.js';
import { diaMes } from '../nucleo/datas.js';
import { ehProlongado, pessoas } from '../nucleo/regras.js';
import { chipSerie, esc } from '../ui.js';

export const titulo = 'Equipe';

/** Endereços para assinar o .ics: Google Agenda, iPhone/Outlook (webcal) e download. */
function botoesAgenda(arquivo, rotulo) {
  const url = new URL(`agenda/${arquivo}`, location.href.split('#')[0]).href;
  const webcal = url.replace(/^https?:/, 'webcal:');
  const google = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`;
  return `<details class="agenda"><summary class="botao botao-secundario">📅 ${esc(rotulo)}</summary>
    <div class="agenda-opcoes">
      <a href="${esc(google)}" target="_blank" rel="noopener">Google Agenda (Android)</a>
      <a href="${esc(webcal)}">iPhone / Outlook (assinar)</a>
      <a href="${esc(url)}" download>Baixar arquivo .ics</a>
      <small class="mudo">Ao assinar, a agenda se atualiza sozinha quando a escala mudar.</small>
    </div></details>`;
}

function linhaDomingo(d, papel, ctx) {
  const passado = d.data < ctx.hoje ? ' passado' : '';
  const feriadao = ehProlongado(d, ctx.base, ctx.config) ? ' <span class="selo selo-feriado">Feriadão</span>' : '';
  return `<li class="${passado}"><a href="#/domingo/${d.data}"><strong>${diaMes(d.data)}</strong> · <span class="papel papel-${papel === 'Prega' ? 'prega' : 'saudacao'}">${papel}</span> ${chipSerie(d, ctx)}${feriadao}<br><span class="mudo">${esc(d.texto)} — ${esc(d.tema)}</span></a></li>`;
}

export function render(ctx) {
  const lista = pessoas(ctx.base);
  const temAgenda = ctx.agenda?.pessoas;
  const aviso = temAgenda ? '' : '<p class="mudo">Os botões de agenda aparecem depois da primeira publicação automática do site.</p>';
  const geral = temAgenda && ctx.agenda.geral ? `<div class="cartao">${botoesAgenda(ctx.agenda.geral, 'Agenda geral: todos os domingos')}</div>` : '';

  if (!lista.length) {
    return `<h1>Equipe</h1>${geral}<section class="cartao vazio">
      <p><strong>Ainda não há nomes na escala.</strong></p>
      <p>Preencha a aba <em>Equipe</em> e as colunas <em>Preletor</em> e <em>Saudação</em> do Cronograma na planilha do Google. Os nomes aparecem aqui automaticamente.</p></section>`;
  }

  const cartoes = lista.map((p) => {
    const todos = [...p.pregacoes.map((d) => ({ d, papel: 'Prega' })), ...p.saudacoes.map((d) => ({ d, papel: 'Saudação' }))]
      .sort((a, b) => a.d.data.localeCompare(b.d.data));
    const arquivo = temAgenda?.[p.nome];
    return `<section class="cartao pessoa" id="pessoa-${slug(p.nome)}">
      <div class="pessoa-topo">
        <div><h2>${esc(p.nome)}</h2>${p.funcao ? `<p class="mudo">${esc(p.funcao)}</p>` : ''}</div>
        <div class="contagens"><span><strong>${p.pregacoes.length}</strong> pregações</span><span><strong>${p.saudacoes.length}</strong> saudações</span></div>
      </div>
      ${todos.length ? `<ul class="lista-simples">${todos.map(({ d, papel }) => linhaDomingo(d, papel, ctx)).join('')}</ul>` : '<p class="mudo">Ainda sem domingos na escala.</p>'}
      ${arquivo && todos.length ? botoesAgenda(arquivo, 'Adicionar à agenda') : ''}
    </section>`;
  }).join('');
  return `<h1>Equipe ${esc(ctx.config.ano ?? '')}</h1>${aviso}${geral}${cartoes}`;
}

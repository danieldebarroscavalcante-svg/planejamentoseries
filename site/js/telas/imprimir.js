import { chaveMes, formatarData, nomeMes } from '../nucleo/datas.js';
import { pessoaPendente } from '../nucleo/modelo.js';
import { esc, nomeCurtoDaSerie } from '../ui.js';

export const titulo = 'Imprimir';

const nome = (v) => (pessoaPendente(v) ? 'A definir' : esc(v));

function linhas(ds, ctx) {
  return ds.map((d) => {
    const data = `${formatarData(d.data)}${d.feriado ? '<br><small>Feriado</small>' : ''}`;
    if (d.semMinistracao) return `<tr class="linha-retiro"><td>${data}</td><td colspan="5">${esc(d.tema || 'Sem ministração')}</td></tr>`;
    const serie = `${esc(nomeCurtoDaSerie(d.serie, ctx.config))}${d.posicao ? ` ${d.posicao}/${d.total}` : ''}`;
    return `<tr><td>${data}</td><td>${serie}</td><td>${esc(d.texto)}</td><td>${esc(d.tema)}</td><td>${nome(d.preletor)}</td><td>${nome(d.saudacao)}</td></tr>`;
  }).join('');
}

const cabecalho = '<thead><tr><th>Data</th><th>Série</th><th>Texto</th><th>Tema</th><th>Preletor</th><th>Saudação</th></tr></thead>';

export function render(ctx) {
  const meses = [...new Set(ctx.base.domingos.map((d) => chaveMes(d.data)))];
  const tipo = ctx.params.get('tipo') === 'anual' ? 'anual' : 'mensal';
  const padrao = meses.find((m) => m >= chaveMes(ctx.hoje)) ?? meses[0];
  const mes = meses.includes(ctx.params.get('mes')) ? ctx.params.get('mes') : padrao;
  const titulo = ctx.config.titulo ?? 'Ministrações';

  const controles = `<form class="cartao controles nao-imprimir" id="controles-impressao" onsubmit="return false">
    <label class="campo"><span>Escala</span><select name="tipo">
      <option value="mensal"${tipo === 'mensal' ? ' selected' : ''}>Mensal</option>
      <option value="anual"${tipo === 'anual' ? ' selected' : ''}>Anual</option></select></label>
    ${tipo === 'mensal' ? `<label class="campo"><span>Mês</span><select name="mes">${meses.map((m) => `<option value="${m}"${m === mes ? ' selected' : ''}>${nomeMes(m)}</option>`).join('')}</select></label>` : ''}
    <button type="button" class="botao" data-acao="imprimir">Imprimir / Salvar PDF</button>
    <p class="mudo">Dica: na janela de impressão, escolha “Salvar como PDF” para gerar o arquivo.</p>
  </form>`;

  let conteudo;
  if (tipo === 'mensal') {
    const ds = ctx.base.domingos.filter((d) => chaveMes(d.data) === mes);
    conteudo = `<h1>${esc(titulo)} — Escala de ${nomeMes(mes)}</h1><table class="tabela-impressao">${cabecalho}<tbody>${linhas(ds, ctx)}</tbody></table>`;
  } else {
    conteudo = `<h1>${esc(titulo)} — Escala anual</h1>` + meses.map((m) => {
      const ds = ctx.base.domingos.filter((d) => chaveMes(d.data) === m);
      return `<section class="mes-impressao"><h2>${nomeMes(m)}</h2><table class="tabela-impressao">${cabecalho}<tbody>${linhas(ds, ctx)}</tbody></table></section>`;
    }).join('');
  }
  return `${controles}<div class="folha">${conteudo}<p class="rodape-impressao">Impresso em ${formatarData(ctx.hoje)}. Sujeito a alterações — consulte a versão on-line.</p></div>`;
}

export function ligar(ctx, raiz) {
  const form = raiz.querySelector('#controles-impressao');
  form.addEventListener('change', () => {
    const p = new URLSearchParams(new FormData(form));
    location.hash = `#/imprimir?${p}`;
  });
  form.querySelector('[data-acao="imprimir"]').addEventListener('click', () => window.print());
}

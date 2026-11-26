import { pessoaPendente, semAcento, slug } from '../nucleo/modelo.js';
import { MESES, diasEntre, diaMes } from '../nucleo/datas.js';
import { comMensagem, quandoFalta, series } from '../nucleo/regras.js';
import { textoWhatsApp } from '../nucleo/formatos.js';
import { chipSerie, copiar, corDaSerie, esc, listaDomingos, pessoa, selos, statusBadge } from '../ui.js';

function quando(hoje, data) {
  const n = diasEntre(hoje, data);
  return n === 0 ? 'hoje' : n === 1 ? 'amanhã' : `em ${n} dias`;
}

function destaque(d, ctx) {
  if (!d) return `<section class="heroi"><p class="sobretitulo">Cronograma</p><h1 class="heroi-titulo">Ano encerrado.</h1><p class="heroi-tema">Não há mais domingos programados.</p></section>`;
  const [ano, mes, dia] = d.data.split('-');
  const corpo = d.semMinistracao
    ? `<p class="heroi-texto gradiente">${esc(d.tema || 'Sem ministração')}</p>${d.observacoes ? `<p class="heroi-tema">${esc(d.observacoes)}</p>` : ''}`
    : `<p class="heroi-texto gradiente">${esc(d.texto)}</p>
       <p class="heroi-tema">${esc(d.tema)}</p>
       <div class="item-topo">${chipSerie(d, ctx, { curto: false })} ${statusBadge(d.status)} ${selos(d, ctx)}</div>
       <dl class="destaque-pessoas">
         <div><dt>Preletor</dt><dd>${pessoa(d.preletor)}</dd></div>
         <div><dt>Saudação</dt><dd>${pessoa(d.saudacao)}</dd></div>
       </dl>`;
  return `<section class="heroi" style="--cor:${esc(corDaSerie(d.serie, ctx.config))}">
    <p class="sobretitulo">Próximo domingo · ${quando(ctx.hoje, d.data)}</p>
    <h1 class="heroi-titulo">${Number(dia)} de ${MESES[Number(mes) - 1]}<span class="heroi-ano">${ano}</span></h1>
    ${corpo}
    ${d.feriado ? `<p class="feriado-texto">${esc(d.feriado)}</p>` : ''}
    <div class="botoes">
      ${d.semMinistracao ? '' : '<button type="button" class="botao" data-acao="copiar">Copiar texto para WhatsApp</button>'}
      <a class="botao botao-secundario" href="#/domingo/${d.data}">Ver detalhes</a>
    </div>
  </section>`;
}

function contadores(ctx) {
  const futuros = comMensagem(ctx.base).filter((d) => d.data >= ctx.hoje);
  const n = {
    alertas: ctx.pendencias.filter((p) => p.nivel === 'alerta').length,
    erros: ctx.pendencias.filter((p) => p.nivel === 'erro').length,
    preletor: futuros.filter((d) => pessoaPendente(d.preletor)).length,
    saudacao: futuros.filter((d) => pessoaPendente(d.saudacao)).length,
    status: futuros.filter((d) => semAcento(d.status) === 'a definir').length,
  };
  const tile = (valor, rotulo, href, tom = '') =>
    `<a class="contador ${valor ? tom : 'zerado'}" href="${href}"><strong>${valor}</strong><span>${rotulo}</span></a>`;
  const dias = ctx.config.limites?.diasAlerta ?? 30;
  return `<h2 class="titulo-secao">Em números.</h2><section class="contadores" aria-label="Pendências">
    ${tile(n.alertas, `alertas nos próximos ${dias} dias`, '#/painel?ver=pendencias', 'tom-alerta')}
    ${tile(n.preletor, 'domingos sem preletor', '#/cronograma?pendentes=1', 'tom-alerta')}
    ${tile(n.saudacao, 'domingos sem saudação', '#/cronograma?pendentes=1', 'tom-alerta')}
    ${tile(n.status, 'com status “A definir”', '#/cronograma?status=A%20definir', 'tom-neutro')}
    ${n.erros ? tile(n.erros, 'erros na estrutura do ano', '#/painel?ver=pendencias', 'tom-erro') : ''}
  </section>`;
}

function listaPendencias(ctx) {
  const grupos = [
    ['erro', 'Erros na estrutura'],
    ['alerta', 'Alertas'],
    ['aviso', 'Avisos para conferir'],
  ];
  const blocos = grupos.map(([nivel, titulo]) => {
    const itens = ctx.pendencias.filter((p) => p.nivel === nivel);
    if (!itens.length) return '';
    const texto = (p) => esc(p.mensagem) + (p.dias !== undefined ? ` <strong>(${quandoFalta(p.dias)})</strong>` : '');
    const lis = itens.map((p) => `<li class="pend pend-${nivel}">${p.data ? `<a href="#/domingo/${p.data}">${texto(p)}</a>` : texto(p)}</li>`).join('');
    const aberto = nivel !== 'aviso' || ctx.params.get('ver') === 'pendencias' ? ' open' : '';
    return `<details class="cartao"${aberto}><summary><strong>${titulo}</strong> (${itens.length})</summary><ul class="pendencias">${lis}</ul></details>`;
  }).join('');
  return blocos || '<p class="cartao tudo-certo">✓ Nenhuma pendência. Escala em dia.</p>';
}

function progresso(ctx) {
  const linhas = series(ctx.base, ctx.config)
    .filter((s) => s.config?.mensagens)
    .map((s) => {
      const lista = s.domingos.filter((d) => !d.semMinistracao);
      const feitas = lista.filter((d) => d.data < ctx.hoje || semAcento(d.status) === 'realizado').length;
      const comPreletor = lista.filter((d) => !pessoaPendente(d.preletor)).length;
      const pct = lista.length ? Math.round((feitas / lista.length) * 100) : 0;
      const inicio = lista[0]?.data, fim = lista.at(-1)?.data;
      return `<li style="--cor:${esc(s.config.cor)}">
        <div class="progresso-topo"><a href="#/series?s=${slug(s.nome)}"><strong>${esc(s.nome)}</strong></a>
          <span class="mudo">${diaMes(inicio)}–${diaMes(fim)}</span></div>
        <div class="barra" role="progressbar" aria-valuenow="${feitas}" aria-valuemin="0" aria-valuemax="${lista.length}"><span style="width:${pct}%"></span></div>
        <div class="mudo">${feitas} de ${lista.length} realizadas · ${comPreletor} com preletor</div>
      </li>`;
    }).join('');
  return `<h2 class="titulo-secao">Séries.</h2><section class="cartao"><ul class="progresso">${linhas}</ul></section>`;
}

export function render(ctx) {
  const mostrar = ctx.prefs?.painel ?? {};
  const proximos = ctx.base.domingos.filter((d) => d.data >= ctx.hoje);
  const [primeiro, ...resto] = proximos;
  const blocoProximos = mostrar.proximos === false ? '' : `<div>
        <h2 class="titulo-secao">Próximos domingos.</h2>${listaDomingos(resto.slice(0, mostrar.quantidadeProximos ?? 4), ctx)}
        <p><a href="#/cronograma">Ver cronograma completo ›</a></p>
      </div>`;
  const direita = [
    mostrar.series === false ? '' : progresso(ctx),
    mostrar.pendencias === false ? '' : `<section id="pendencias"><h2 class="titulo-secao">Pendências.</h2>${listaPendencias(ctx)}</section>`,
  ].join('');
  const colunas = [blocoProximos, direita ? `<div>${direita}</div>` : ''].filter(Boolean);
  return `
    ${destaque(primeiro, ctx)}
    ${mostrar.numeros === false ? '' : contadores(ctx)}
    <div class="${colunas.length > 1 ? 'duas-colunas' : ''}">${colunas.join('')}</div>`;
}

export function ligar(ctx, raiz) {
  const proximo = ctx.base.domingos.find((d) => d.data >= ctx.hoje);
  raiz.querySelector('[data-acao="copiar"]')?.addEventListener('click', () => copiar(textoWhatsApp(proximo)));
  if (ctx.params.get('ver') === 'pendencias') raiz.querySelector('#pendencias')?.scrollIntoView();
}

export const titulo = 'Painel';

import { pessoaPendente, semAcento } from '../nucleo/modelo.js';
import { chaveMes, diaDaSemana, nomeMes, somarDias } from '../nucleo/datas.js';
import { domingoPendente, ehProlongado, pessoas, series } from '../nucleo/regras.js';
import { chipSerie, corDaSerie, esc, legendaSeries, listaDomingos, nomeCurtoDaSerie } from '../ui.js';

export const titulo = 'Cronograma';

const SEM_PRELETOR = '__sem__';

function filtrar(ctx, f) {
  const busca = semAcento(f.get('q'));
  return ctx.base.domingos.filter((d) => {
    if (f.get('serie') && d.serie !== f.get('serie')) return false;
    if (f.get('status') && d.status !== f.get('status')) return false;
    if (f.get('mes') && chaveMes(d.data) !== f.get('mes')) return false;
    if (f.get('preletor') === SEM_PRELETOR && (d.semMinistracao || !pessoaPendente(d.preletor))) return false;
    if (f.get('preletor') && f.get('preletor') !== SEM_PRELETOR && semAcento(d.preletor) !== semAcento(f.get('preletor'))) return false;
    if (f.get('pendentes') && !domingoPendente(d)) return false;
    if (busca) {
      const alvo = semAcento([d.texto, d.tema, d.preletor, d.saudacao, d.serie, d.observacoes, d.eixo, d.feriado].join(' '));
      if (!busca.split(/\s+/).every((t) => alvo.includes(t))) return false;
    }
    return true;
  });
}

const opcao = (valor, rotulo, atual) => `<option value="${esc(valor)}"${valor === atual ? ' selected' : ''}>${esc(rotulo)}</option>`;

function barraDeFiltros(ctx, f) {
  const meses = [...new Set(ctx.base.domingos.map((d) => chaveMes(d.data)))];
  const status = [...new Set([...(ctx.config.statusValidos ?? []), ...ctx.base.domingos.map((d) => d.status).filter(Boolean)])];
  const nomes = pessoas(ctx.base).filter((p) => p.pregacoes.length).map((p) => p.nome);
  const visao = f.get('visao') === 'calendario' ? 'calendario' : 'lista';
  return `<form class="filtros cartao" id="filtros" role="search" onsubmit="return false">
    <label class="campo campo-busca"><span>Buscar</span>
      <input type="search" name="q" value="${esc(f.get('q') ?? '')}" placeholder="Texto, tema, nome…" autocomplete="off"></label>
    <label class="campo"><span>Série</span><select name="serie">${opcao('', 'Todas', f.get('serie') ?? '')}
      ${series(ctx.base, ctx.config).map((s) => opcao(s.nome, nomeCurtoDaSerie(s.nome, ctx.config), f.get('serie'))).join('')}</select></label>
    <label class="campo"><span>Status</span><select name="status">${opcao('', 'Todos', f.get('status') ?? '')}
      ${status.map((s) => opcao(s, s, f.get('status'))).join('')}</select></label>
    <label class="campo"><span>Preletor</span><select name="preletor">${opcao('', 'Todos', f.get('preletor') ?? '')}
      ${opcao(SEM_PRELETOR, '(sem preletor)', f.get('preletor'))}
      ${nomes.map((n) => opcao(n, n, f.get('preletor'))).join('')}</select></label>
    <label class="campo"><span>Mês</span><select name="mes">${opcao('', 'Todos', f.get('mes') ?? '')}
      ${meses.map((m) => opcao(m, nomeMes(m), f.get('mes'))).join('')}</select></label>
    <div class="filtros-acoes">
      <label class="campo-check"><input type="checkbox" name="pendentes" value="1"${f.get('pendentes') ? ' checked' : ''}> Só pendências</label>
      <div class="alternar" role="group" aria-label="Visualização">
        <button type="button" data-visao="lista" aria-pressed="${visao === 'lista'}">Lista</button>
        <button type="button" data-visao="calendario" aria-pressed="${visao === 'calendario'}">Calendário</button>
      </div>
      <button type="button" class="link" data-acao="limpar">Limpar filtros</button>
    </div>
  </form>`;
}

function porMes(lista, ctx) {
  const grupos = new Map();
  for (const d of lista) grupos.set(chaveMes(d.data), [...(grupos.get(chaveMes(d.data)) ?? []), d]);
  if (!grupos.size) return '<p class="vazio cartao">Nenhum domingo com esses filtros.</p>';
  return [...grupos].map(([mes, ds]) => `<section class="mes"><h2 class="titulo-secao">${nomeMes(mes)}</h2>${listaDomingos(ds, ctx)}</section>`).join('');
}

function calendario(lista, ctx, f) {
  const meses = [...new Set(ctx.base.domingos.map((d) => chaveMes(d.data)))];
  if (!meses.length) return '';
  const padrao = meses.includes(chaveMes(ctx.hoje)) ? chaveMes(ctx.hoje) : meses[0];
  const mes = meses.includes(f.get('cal')) ? f.get('cal') : (f.get('mes') && meses.includes(f.get('mes')) ? f.get('mes') : padrao);
  const i = meses.indexOf(mes);
  const visiveis = new Set(lista.map((d) => d.data));
  const porData = new Map(ctx.base.domingos.map((d) => [d.data, d]));
  const especiais = new Map();
  for (const e of ctx.base.datasEspeciais ?? []) especiais.set(e.data, [...(especiais.get(e.data) ?? []), e]);

  const inicio = `${mes}-01`;
  let dia = somarDias(inicio, -diaDaSemana(inicio));
  const celulas = [];
  // Da semana que contém o dia 1 até o sábado da última semana do mês.
  while (!(chaveMes(dia) > mes && diaDaSemana(dia) === 0)) {
    const doMes = chaveMes(dia) === mes;
    const d = porData.get(dia);
    const n = Number(dia.slice(8));
    if (d && doMes) {
      const apagado = visiveis.has(dia) ? '' : ' apagado';
      const feriado = d.feriado ? `<span class="cal-feriado">${ehProlongado(d, ctx.base, ctx.config) ? 'Feriadão' : 'Feriado'}</span>` : '';
      const conteudo = d.semMinistracao ? `<span class="cal-tema">${esc(d.tema)}</span>`
        : `<span class="cal-texto">${esc(d.texto)}</span><span class="cal-pessoa">${pessoaPendente(d.preletor) ? '<span class="a-definir">A definir</span>' : esc(d.preletor)}</span>`;
      celulas.push(`<a class="cal-dia domingo${d.semMinistracao ? ' retiro' : ''}${apagado}" href="#/domingo/${dia}" style="--cor:${esc(corDaSerie(d.serie, ctx.config))}">
        <span class="cal-num">${n}</span>${chipSerie(d, ctx)}${conteudo}${feriado}</a>`);
    } else {
      const marca = doMes && especiais.has(dia) ? `<span class="cal-marca" title="${esc(especiais.get(dia).map((e) => e.descricao).join(' · '))}">•</span>` : '';
      celulas.push(`<div class="cal-dia${doMes ? '' : ' fora'}"><span class="cal-num">${doMes ? n : ''}</span>${marca}</div>`);
    }
    dia = somarDias(dia, 1);
  }
  const nav = (j, txt, rot) => (meses[j] ? `<button type="button" class="botao botao-secundario" data-cal="${meses[j]}" aria-label="${rot}">${txt}</button>` : '<span></span>');
  return `<section class="cartao calendario">
    <div class="cal-nav">${nav(i - 1, '‹', 'Mês anterior')}<h2>${nomeMes(mes)}</h2>${nav(i + 1, '›', 'Próximo mês')}</div>
    <div class="cal-grade" role="grid">
      ${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((s) => `<div class="cal-cab">${s}</div>`).join('')}
      ${celulas.join('')}
    </div>
    ${legendaSeries(ctx)}
  </section>`;
}

function resultados(ctx, f) {
  const lista = filtrar(ctx, f);
  const resumo = `<p class="mudo contagem">${lista.length} de ${ctx.base.domingos.length} domingos</p>`;
  return f.get('visao') === 'calendario' ? resumo + calendario(lista, ctx, f) : resumo + porMes(lista, ctx);
}

export function render(ctx) {
  return `<h1>Cronograma ${esc(ctx.config.ano ?? '')}</h1>${barraDeFiltros(ctx, ctx.params)}<div id="resultados">${resultados(ctx, ctx.params)}</div>`;
}

export function ligar(ctx, raiz) {
  const f = new URLSearchParams(ctx.params);
  const form = raiz.querySelector('#filtros');
  const alvo = raiz.querySelector('#resultados');

  const atualizar = () => {
    const q = f.toString();
    history.replaceState(null, '', `#/cronograma${q ? `?${q}` : ''}`);
    alvo.innerHTML = resultados(ctx, f);
  };
  const definir = (nome, valor) => (valor ? f.set(nome, valor) : f.delete(nome));

  let espera;
  form.addEventListener('input', (e) => {
    const el = e.target;
    if (!el.name) return;
    definir(el.name, el.type === 'checkbox' ? (el.checked ? '1' : '') : el.value);
    if (el.name === 'mes') f.delete('cal');
    clearTimeout(espera);
    espera = setTimeout(atualizar, el.type === 'search' ? 200 : 0);
  });
  form.addEventListener('click', (e) => {
    const visao = e.target.closest('[data-visao]')?.dataset.visao;
    if (visao) {
      definir('visao', visao === 'calendario' ? 'calendario' : '');
      form.querySelectorAll('[data-visao]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.visao === visao)));
      atualizar();
    }
    if (e.target.closest('[data-acao="limpar"]')) {
      const v = f.get('visao');
      [...f.keys()].forEach((k) => f.delete(k));
      if (v) f.set('visao', v);
      form.reset();
      form.querySelectorAll('input[type=search]').forEach((i) => { i.value = ''; });
      form.querySelectorAll('select').forEach((s) => { s.value = ''; });
      form.querySelectorAll('input[type=checkbox]').forEach((c) => { c.checked = false; });
      atualizar();
    }
  });
  alvo.addEventListener('click', (e) => {
    const cal = e.target.closest('[data-cal]')?.dataset.cal;
    if (cal) { f.set('cal', cal); atualizar(); }
  });
}

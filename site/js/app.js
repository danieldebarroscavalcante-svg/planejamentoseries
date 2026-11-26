// Carrega os dados (planilha publicada → ou cópia de segurança) e desenha a tela pedida no endereço.

import { montarBase } from './nucleo/modelo.js';
import { hojeEm, formatarData } from './nucleo/datas.js';
import { verificar } from './nucleo/regras.js';
import { esc } from './ui.js';
import { acompanharAparelho, aplicarAparencia, configComCores, preferencias } from './aparencia.js';
import * as painel from './telas/painel.js';
import * as cronograma from './telas/cronograma.js';
import * as domingo from './telas/domingo.js';
import * as seriesTela from './telas/series.js';
import * as equipe from './telas/equipe.js';
import * as imprimir from './telas/imprimir.js';
import * as aparencia from './telas/aparencia.js';

const TELAS = { painel, cronograma, domingo, series: seriesTela, equipe, imprimir, aparencia };
const TEMPO_LIMITE_MS = 8000;

const estado = { config: null, configOriginal: null, prefs: null, base: null, origem: '', atualizadoEm: '', agenda: null, hoje: '' };

/** Lê as preferências de aparência, aplica no documento e nas cores das séries. */
function atualizarAparencia() {
  estado.prefs = preferencias(estado.configOriginal);
  aplicarAparencia(estado.prefs);
  estado.config = configComCores(estado.configOriginal, estado.prefs);
}

async function buscar(url, tipo = 'json') {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TEMPO_LIMITE_MS);
  try {
    const r = await fetch(url, { cache: 'no-cache', signal: ctrl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return tipo === 'json' ? await r.json() : await r.text();
  } finally {
    clearTimeout(t);
  }
}

async function buscarPlanilha(fontes) {
  const [cronograma, equipe, datasEspeciais] = await Promise.all(
    [fontes.cronograma, fontes.equipe, fontes.datasEspeciais].map((u) => buscar(u, 'texto')));
  if (/^\s*</.test(cronograma)) throw new Error('O link do Cronograma não devolveu CSV.');
  return montarBase({ cronograma, equipe, datasEspeciais });
}

const mesmoConteudo = (a, b) => ['domingos', 'equipe', 'datasEspeciais']
  .every((k) => JSON.stringify(a[k]) === JSON.stringify(b[k]));

function definirHoje() {
  // ?hoje=2027-03-20 no endereço simula outra data (útil para testar).
  const simulado = new URLSearchParams(location.search).get('hoje');
  estado.hoje = /^\d{4}-\d{2}-\d{2}$/.test(simulado ?? '') ? simulado : hojeEm(estado.config.fuso);
}

function rota() {
  if (!location.hash.replace(/^#\/?/, '')) {
    // Sem endereço: abre a tela escolhida em Aparência → "Abrir o site em".
    const inicio = estado.prefs?.inicio ?? 'painel';
    if (inicio === 'calendario') return { nome: 'cronograma', partes: ['cronograma'], params: new URLSearchParams('visao=calendario') };
    return { nome: TELAS[inicio] ? inicio : 'painel', partes: [inicio], params: new URLSearchParams() };
  }
  const [caminho, consulta] = location.hash.replace(/^#\/?/, '').split('?');
  const partes = caminho.split('/').filter(Boolean);
  const nome = TELAS[partes[0]] ? partes[0] : 'painel';
  return { nome, partes, params: new URLSearchParams(consulta ?? '') };
}

function desenhar() {
  const raiz = document.getElementById('conteudo');
  if (!estado.base) return;
  const { nome, partes, params } = rota();
  const tela = TELAS[nome];
  const ctx = {
    ...estado,
    params,
    pendencias: verificar(estado.base, estado.config, estado.hoje),
    aoMudarAparencia: () => { atualizarAparencia(); desenhar(); },
  };
  raiz.innerHTML = tela.render(ctx, partes, params);
  tela.ligar?.(ctx, raiz, partes, params);
  if (!tela.semAnimacao && estado.prefs.animacoes) revelarAoRolar(raiz);
  else observador?.disconnect();
  document.title = `${tela.titulo} · ${estado.config.titulo ?? 'Ministrações'}`;
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const ativo = a.dataset.nav === nome || (nome === 'domingo' && a.dataset.nav === 'cronograma');
    if (ativo) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  desenharRodape();
}

// Entrada suave dos blocos quando aparecem na tela.
const observador = 'IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches
  ? new IntersectionObserver((itens) => itens.forEach((i) => {
    if (i.isIntersecting) { i.target.classList.add('visivel'); observador.unobserve(i.target); }
  }), { rootMargin: '0px 0px -8% 0px' })
  : null;

function revelarAoRolar(raiz) {
  if (!observador) return;
  observador.disconnect();
  raiz.querySelectorAll('.heroi > *, .titulo-secao, .cartao, .contador, .lista > li, .campos > div, .whatsapp').forEach((el) => {
    el.classList.add('revelar');
    observador.observe(el);
  });
}

function desenharRodape() {
  const quando = estado.atualizadoEm ? new Date(estado.atualizadoEm).toLocaleString('pt-BR', { timeZone: estado.config.fuso, dateStyle: 'short', timeStyle: 'short' }) : '';
  const texto = estado.origem === 'planilha'
    ? `Dados lidos agora da planilha (${quando}).`
    : `Dados da cópia de segurança${quando ? ` de ${quando}` : ''}.`;
  const simulado = new URLSearchParams(location.search).has('hoje') ? ` · Simulando a data ${formatarData(estado.hoje)}` : '';
  document.getElementById('fonte').textContent = texto + simulado;
}

function erro(mensagem) {
  document.getElementById('conteudo').innerHTML = `<section class="cartao"><h1>Não foi possível carregar a escala</h1><p>${esc(mensagem)}</p><p>Tente recarregar a página em alguns minutos.</p></section>`;
}

async function iniciar() {
  try {
    estado.configOriginal = await buscar('config.json');
  } catch (e) {
    return erro(`Arquivo de configuração indisponível (${e.message}).`);
  }
  atualizarAparencia();
  acompanharAparelho(() => estado.prefs);
  definirHoje();
  window.addEventListener('hashchange', () => { desenhar(); window.scrollTo(0, 0); });

  const [snapshot, agenda] = await Promise.all([
    buscar('dados/cronograma.json').catch(() => null),
    buscar('agenda/indice.json').catch(() => null),
  ]);
  estado.agenda = agenda;
  if (snapshot) {
    estado.base = { ...snapshot, avisosLeitura: [] };
    estado.origem = 'copia';
    estado.atualizadoEm = snapshot.geradoEm;
    desenhar();
  }

  // Em seguida tenta a planilha ao vivo; se conseguir, redesenha com os dados mais novos.
  const f = estado.config.fontes ?? {};
  if (f.cronograma && f.equipe && f.datasEspeciais) {
    try {
      const aoVivo = await buscarPlanilha(f);
      const igual = snapshot && mesmoConteudo(aoVivo, snapshot);
      estado.base = aoVivo;
      estado.origem = 'planilha';
      estado.atualizadoEm = new Date().toISOString();
      // Só redesenha a tela se algo mudou (evita apagar o que a pessoa está digitando).
      if (igual) desenharRodape(); else desenhar();
    } catch (e) {
      console.warn('Planilha indisponível, usando a cópia de segurança:', e);
      if (!snapshot) erro('A planilha e a cópia de segurança estão indisponíveis.');
    }
  } else if (!snapshot) {
    erro('Nenhuma fonte de dados configurada.');
  }
}

iniciar();

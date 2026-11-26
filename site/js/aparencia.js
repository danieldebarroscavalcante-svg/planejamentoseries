// Preferências de aparência: tema claro/escuro/misto, cores, fonte, tamanho, cantos, efeitos e Painel.
//
// Ordem de prioridade: padrão do código ← "aparencia" do config.json (padrão do site) ← escolhas da pessoa
// (salvas só neste aparelho, no navegador).

const CHAVE = 'aparencia';

export const ZONAS = [
  { id: 'topo', nome: 'Menu do topo' },
  { id: 'destaque', nome: 'Destaque do Painel' },
  { id: 'cartoes', nome: 'Cartões' },
  { id: 'rodape', nome: 'Rodapé' },
];

export const PADRAO = {
  tema: 'escuro', // escuro | claro | auto
  zonas: { topo: 'pagina', destaque: 'pagina', cartoes: 'pagina', rodape: 'pagina' }, // pagina | claro | escuro
  acento: '#0071E3',
  fonte: 'padrao', // padrao | inter | sistema | serifa
  tamanho: 1,
  cantos: 'arredondados', // arredondados | suaves | retos
  densidade: 'confortavel', // confortavel | compacta
  animacoes: true,
  degrade: true,
  vidro: true,
  inicio: 'painel', // painel | cronograma | calendario | series | equipe
  painel: { numeros: true, proximos: true, quantidadeProximos: 4, series: true, pendencias: true },
  coresSeries: {},
};

const todasZonas = (v) => Object.fromEntries(ZONAS.map((z) => [z.id, v]));

export const PREDEFINICOES = [
  { id: 'escuro', nome: 'Escuro', descricao: 'Tudo escuro, estilo Pro', valores: { tema: 'escuro', zonas: todasZonas('pagina') } },
  { id: 'claro', nome: 'Claro', descricao: 'Tudo claro', valores: { tema: 'claro', zonas: todasZonas('pagina') } },
  { id: 'misto', nome: 'Misto', descricao: 'Página clara, topo e destaque escuros', valores: { tema: 'claro', zonas: { topo: 'escuro', destaque: 'escuro', cartoes: 'pagina', rodape: 'escuro' } } },
  { id: 'misto-invertido', nome: 'Misto invertido', descricao: 'Página escura, cartões claros', valores: { tema: 'escuro', zonas: { topo: 'pagina', destaque: 'pagina', cartoes: 'claro', rodape: 'pagina' } } },
  { id: 'auto', nome: 'Automático', descricao: 'Segue o modo claro/escuro do aparelho', valores: { tema: 'auto', zonas: todasZonas('pagina') } },
];

export const ACENTOS = [
  ['#0071E3', 'Azul'], ['#3A3A3C', 'Grafite'], ['#248A3D', 'Verde'], ['#8944AB', 'Roxo'],
  ['#C93400', 'Laranja'], ['#8A3B5C', 'Vinho'], ['#A0782C', 'Dourado'],
];

const ehObjeto = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Junta objetos em profundidade (o da direita vence). */
export function mesclar(...objs) {
  const r = {};
  for (const o of objs) {
    if (!ehObjeto(o)) continue;
    for (const [k, v] of Object.entries(o)) r[k] = ehObjeto(v) ? mesclar(r[k], v) : v;
  }
  return r;
}

export function lerEscolhas() {
  try { return JSON.parse(localStorage.getItem(CHAVE) ?? '{}') ?? {}; } catch { return {}; }
}

export function gravarEscolhas(escolhas) {
  try { localStorage.setItem(CHAVE, JSON.stringify(escolhas)); } catch { /* navegador sem armazenamento */ }
}

export function apagarEscolhas() {
  try { localStorage.removeItem(CHAVE); } catch { /* idem */ }
}

export function preferencias(config) {
  return mesclar(PADRAO, config?.aparencia, lerEscolhas());
}

const escuroDoAparelho = () => matchMedia('(prefers-color-scheme: dark)').matches;

/** Texto preto ou branco sobre a cor de destaque, o que der mais contraste. */
function textoSobre(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!m) return '#fff';
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(m[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return (1.05 / (lum + 0.05)) >= ((lum + 0.05) / 0.05) ? '#fff' : '#000';
}

let fonteCarregada = false;
function carregarInter() {
  if (fonteCarregada) return;
  fonteCarregada = true;
  const link = Object.assign(document.createElement('link'), {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
  });
  document.head.append(link);
}

/** Aplica as preferências no documento (atributos no <html> + variáveis de cor e tamanho). */
export function aplicarAparencia(p) {
  const html = document.documentElement;
  const d = html.dataset;
  d.tema = p.tema === 'auto' ? (escuroDoAparelho() ? 'escuro' : 'claro') : p.tema;
  for (const z of ZONAS) {
    const v = p.zonas?.[z.id];
    if (v === 'claro' || v === 'escuro') d[`z${z.id[0].toUpperCase()}${z.id.slice(1)}`] = v;
    else delete d[`z${z.id[0].toUpperCase()}${z.id.slice(1)}`];
  }
  d.fonte = p.fonte;
  d.cantos = p.cantos;
  d.densidade = p.densidade;
  d.animacoes = p.animacoes ? 'on' : 'off';
  d.degrade = p.degrade ? 'on' : 'off';
  d.vidro = p.vidro ? 'on' : 'off';
  html.style.setProperty('--acento', p.acento);
  html.style.setProperty('--acento-texto', textoSobre(p.acento));
  html.style.setProperty('--escala', String(p.tamanho || 1));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', d.tema === 'escuro' ? '#000000' : '#F5F5F7');
  if (p.fonte === 'padrao' || p.fonte === 'inter') carregarInter();
}

/** Reaplica quando o aparelho troca entre claro e escuro (modo Automático). */
export function acompanharAparelho(obterPrefs) {
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    const p = obterPrefs();
    if (p.tema === 'auto') aplicarAparencia(p);
  });
}

/** Aplica as cores de série escolhidas pela pessoa sobre as do config.json. */
export function configComCores(config, p) {
  return {
    ...config,
    series: (config.series ?? []).map((s) => ({ ...s, cor: p.coresSeries?.[s.prefixo] || s.cor })),
  };
}

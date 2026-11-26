// Transforma os CSVs das abas (Cronograma, Equipe, Datas especiais) na base de dados
// usada pelo site e pela automação. Não depende de navegador nem de Node.

import { lerCsv } from './csv.js';

// Cabeçalhos aceitos para cada campo (comparação sem acento e sem maiúsculas;
// basta o cabeçalho COMEÇAR com um destes textos).
const COLUNAS = {
  cronograma: {
    numero: ['nº', 'n.º', 'no', 'numero'],
    data: ['data'],
    feriado: ['feriado'],
    texto: ['texto'],
    tema: ['tema'],
    preletor: ['preletor'],
    saudacao: ['saudacao'],
    serie: ['serie'],
    mensagem: ['mensagem'],
    status: ['status'],
    eixo: ['cumprimento', 'eixo'],
    observacoes: ['observ'],
  },
  equipe: { nome: ['nome'], funcao: ['funcao'] },
  datas: { data: ['data'], tipo: ['tipo'], descricao: ['descricao'], prolongado: ['fim de semana', 'prolongado'] },
};

const OBRIGATORIAS = {
  cronograma: ['data', 'texto', 'tema', 'preletor', 'saudacao', 'serie', 'mensagem', 'status'],
  equipe: ['nome'],
  datas: ['data', 'descricao'],
};

export function semAcento(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

const limpar = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** Campo de pessoa vazio para fins de pendência ("", "—", "A definir"). */
export function pessoaPendente(nome) {
  const n = semAcento(nome);
  return n === '' || n === '—' || n === '-' || n === 'a definir';
}

// ---------- Proteção de privacidade ----------
// Mesmo que alguém digite um telefone ou e-mail por engano numa aba publicada,
// ele é trocado por "[contato removido]" antes de aparecer no site ou no snapshot.
const RE_EMAIL = /[^\s@,;()<>]+@[^\s@,;()<>]+\.[a-z]{2,}/gi;
const RE_TELEFONE = /(?:\+?55[\s.-]?)?\(?\b\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}\b/g;
export const CONTATO_REMOVIDO = '[contato removido]';

// Fixo sem DDD ("3456-7890"), sem confundir com intervalo de anos ("2027-2028").
const RE_FIXO = /\b(?!(?:19|20)\d{2}-(?:19|20)\d{2}\b)[2-9]\d{3,4}-\d{4}\b/g;

export function mascararContatos(texto) {
  return String(texto ?? '')
    .replace(RE_EMAIL, CONTATO_REMOVIDO)
    .replace(RE_TELEFONE, CONTATO_REMOVIDO)
    .replace(RE_FIXO, CONTATO_REMOVIDO);
}

// ---------- Conversões ----------

/** "10/01/2027", "10/1/2027", "2027-01-10" → "2027-01-10". Retorna "" se inválida. */
export function lerData(valor) {
  const s = limpar(valor);
  let d, m, a;
  let r = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (r) [, d, m, a] = r;
  else if ((r = s.match(/(\d{4})-(\d{2})-(\d{2})/))) [, a, m, d] = r;
  else return '';
  const iso = `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const t = new Date(`${iso}T12:00:00Z`);
  return t.toISOString().slice(0, 10) === iso ? iso : '';
}

/** "5 de 26" → {posicao: 5, total: 26}; "Especial" → {especial: true}. */
export function lerMensagem(valor) {
  const s = semAcento(valor);
  const r = s.match(/^(\d+)\s*(?:de|\/)\s*(\d+)$/);
  if (r) return { posicao: Number(r[1]), total: Number(r[2]) };
  if (s.startsWith('especial')) return { especial: true };
  return {};
}

export function lerSimNao(valor) {
  return ['sim', 's', 'x', 'true', '1'].includes(semAcento(valor));
}

// ---------- Leitura das abas ----------

function mapearColunas(cabecalho, tipo, avisos) {
  const normal = cabecalho.map(semAcento);
  const mapa = {};
  for (const [campo, nomes] of Object.entries(COLUNAS[tipo])) {
    const alvo = nomes.map(semAcento);
    let i = normal.findIndex((c) => alvo.includes(c));
    if (i < 0) i = normal.findIndex((c, j) => !Object.values(mapa).includes(j) && alvo.some((n) => c.startsWith(n)));
    if (i >= 0) mapa[campo] = i;
  }
  for (const campo of OBRIGATORIAS[tipo]) {
    if (!(campo in mapa)) avisos.push({ aba: tipo, tipo: 'coluna-ausente', mensagem: `Aba ${tipo}: coluna "${campo}" não encontrada no cabeçalho.` });
  }
  return mapa;
}

function lerAba(csv, tipo, avisos) {
  const linhas = typeof csv === 'string' ? lerCsv(csv) : csv ?? [];
  if (!linhas.length) return [];
  const mapa = mapearColunas(linhas[0], tipo, avisos);
  return linhas.slice(1).map((valores, i) => {
    const obj = { linha: i + 2 };
    for (const [campo, idx] of Object.entries(mapa)) {
      const bruto = limpar(valores[idx]);
      const seguro = mascararContatos(bruto);
      if (seguro !== bruto) {
        avisos.push({ aba: tipo, tipo: 'contato-removido', linha: i + 2,
          mensagem: `Aba ${tipo}, linha ${i + 2}: parecia haver telefone ou e-mail na coluna "${campo}" e ele foi ocultado.` });
      }
      obj[campo] = seguro;
    }
    return obj;
  });
}

export function lerCronograma(csv, avisos = []) {
  return lerAba(csv, 'cronograma', avisos)
    .filter((l) => l.data || l.tema || l.texto)
    .map((l) => {
      const data = lerData(l.data);
      if (!data) avisos.push({ aba: 'cronograma', tipo: 'data-invalida', linha: l.linha, mensagem: `Cronograma, linha ${l.linha}: data "${l.data}" não reconhecida.` });
      const numero = /^\d+$/.test(l.numero ?? '') ? Number(l.numero) : null;
      const status = l.status ?? '';
      const semMinistracao = semAcento(status) === 'sem ministracao';
      return {
        id: data,
        linha: l.linha,
        numero,
        data,
        feriado: l.feriado ?? '',
        texto: l.texto ?? '',
        tema: l.tema ?? '',
        preletor: l.preletor ?? '',
        saudacao: l.saudacao ?? '',
        serie: l.serie ?? '',
        mensagem: l.mensagem ?? '',
        ...lerMensagem(l.mensagem),
        status,
        eixo: l.eixo ?? '',
        observacoes: l.observacoes ?? '',
        semMinistracao,
      };
    })
    .sort((a, b) => (a.data || '9999').localeCompare(b.data || '9999'));
}

export function lerEquipe(csv, avisos = []) {
  return lerAba(csv, 'equipe', avisos)
    .filter((l) => l.nome)
    .map(({ nome, funcao = '' }) => ({ nome, funcao }));
}

export function lerDatasEspeciais(csv, avisos = []) {
  return lerAba(csv, 'datas', avisos)
    .map((l) => ({ data: lerData(l.data), tipo: l.tipo ?? '', descricao: l.descricao ?? '', prolongado: lerSimNao(l.prolongado) }))
    .filter((d) => d.data);
}

/** Monta a base completa a partir dos três CSVs. */
export function montarBase({ cronograma, equipe, datasEspeciais }) {
  const avisos = [];
  return {
    domingos: lerCronograma(cronograma, avisos),
    equipe: lerEquipe(equipe, avisos),
    datasEspeciais: lerDatasEspeciais(datasEspeciais, avisos),
    avisosLeitura: avisos,
  };
}

/** Encontra a configuração (cor, rótulos) da série pelo início do nome. */
export function configDaSerie(nomeSerie, config) {
  const n = semAcento(nomeSerie);
  return (config?.series ?? []).find((s) => n.startsWith(semAcento(s.prefixo))) ?? null;
}

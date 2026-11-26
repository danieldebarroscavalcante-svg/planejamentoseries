// Gera arquivos de agenda (.ics, padrão iCalendar) — um por pessoa e um geral.
// Só entram nomes, textos e temas: nunca telefone ou e-mail.

import { pessoaPendente, slug } from './modelo.js';
import { formatarData } from './datas.js';
import { pessoas } from './regras.js';

const PRODID = '-//planejamentoseries//Ministracoes//PT-BR';

/** Escapa texto conforme o padrão iCalendar. */
export function escaparIcs(texto) {
  return String(texto ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Quebra linhas com mais de 75 bytes (exigência do padrão). */
export function dobrarLinha(linha) {
  const bytes = new TextEncoder().encode(linha);
  if (bytes.length <= 75) return linha;
  const partes = [];
  let atual = '';
  let tamanho = 0;
  for (const ch of linha) {
    const t = new TextEncoder().encode(ch).length;
    const limite = partes.length ? 74 : 75; // linhas de continuação começam com espaço
    if (tamanho + t > limite) { partes.push(atual); atual = ''; tamanho = 0; }
    atual += ch;
    tamanho += t;
  }
  partes.push(atual);
  return partes.join('\r\n ');
}

const compacta = (iso) => iso.replace(/-/g, '');
const carimbo = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

function horario(config) {
  const h = config?.agenda?.horario ?? '';
  const m = /^(\d{1,2}):(\d{2})$/.exec(h);
  if (!m) return null;
  return { hora: m[1].padStart(2, '0'), minuto: m[2], duracao: Number(config.agenda.duracaoMinutos) || 120 };
}

function datasDoEvento(data, config) {
  const h = horario(config);
  if (!h) {
    const fim = new Date(`${data}T12:00:00Z`);
    fim.setUTCDate(fim.getUTCDate() + 1);
    return [`DTSTART;VALUE=DATE:${compacta(data)}`, `DTEND;VALUE=DATE:${compacta(fim.toISOString().slice(0, 10))}`];
  }
  const inicio = `${compacta(data)}T${h.hora}${h.minuto}00`;
  const total = Number(h.hora) * 60 + Number(h.minuto) + h.duracao;
  const fim = `${compacta(data)}T${String(Math.floor(total / 60) % 24).padStart(2, '0')}${String(total % 60).padStart(2, '0')}00`;
  const fuso = config.fuso ?? 'America/Sao_Paulo';
  return [`DTSTART;TZID=${fuso}:${inicio}`, `DTEND;TZID=${fuso}:${fim}`];
}

function descricao(d) {
  return [
    `Data: ${formatarData(d.data)}`,
    `Texto: ${d.texto || 'A definir'}`,
    `Tema: ${d.tema || 'A definir'}`,
    `Preletor: ${pessoaPendente(d.preletor) ? 'A definir' : d.preletor}`,
    `Saudação: ${pessoaPendente(d.saudacao) ? 'A definir' : d.saudacao}`,
    d.serie ? `Série: ${d.serie}${d.posicao ? ` (mensagem ${d.posicao} de ${d.total})` : ''}` : '',
  ].filter(Boolean).join('\n');
}

function evento({ uid, resumo, d, config, agora, url }) {
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${carimbo(agora)}`,
    ...datasDoEvento(d.data, config),
    `SUMMARY:${escaparIcs(resumo)}`,
    `DESCRIPTION:${escaparIcs(descricao(d))}`,
    ...(url ? [`URL:${url}#/domingo/${d.data}`] : []),
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ];
}

function calendario(nome, eventos, config) {
  const fuso = config.fuso ?? 'America/Sao_Paulo';
  const linhas = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:${PRODID}`, 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    `X-WR-CALNAME:${escaparIcs(nome)}`, `X-WR-TIMEZONE:${fuso}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H', 'X-PUBLISHED-TTL:PT12H',
    ...(horario(config) && fuso === 'America/Sao_Paulo'
      ? ['BEGIN:VTIMEZONE', 'TZID:America/Sao_Paulo', 'BEGIN:STANDARD', 'DTSTART:19700101T000000',
        'TZOFFSETFROM:-0300', 'TZOFFSETTO:-0300', 'TZNAME:-03', 'END:STANDARD', 'END:VTIMEZONE']
      : []),
    ...eventos.flat(),
    'END:VCALENDAR',
  ];
  return linhas.map(dobrarLinha).join('\r\n') + '\r\n';
}

/**
 * Gera todas as agendas.
 * @returns {{ arquivos: Record<string,string>, indice: {geral: string, pessoas: Record<string,string>} }}
 */
export function gerarAgendas(base, config, { agora = new Date(), url = '' } = {}) {
  const titulo = config.titulo ?? 'Ministrações';
  const arquivos = {};
  const indice = { geral: 'todos.ics', pessoas: {} };

  const geral = base.domingos.filter((d) => !d.semMinistracao && d.data).map((d) => evento({
    uid: `${d.data}-ministracao@planejamentoseries`,
    resumo: `${titulo}: ${d.texto || 'Texto a definir'} — ${pessoaPendente(d.preletor) ? 'preletor a definir' : d.preletor}`,
    d, config, agora, url,
  }));
  arquivos['todos.ics'] = calendario(titulo, geral, config);

  const usados = new Set(['todos']);
  for (const p of pessoas(base)) {
    if (!p.pregacoes.length && !p.saudacoes.length) continue;
    let nomeArquivo = slug(p.nome);
    for (let i = 2; usados.has(nomeArquivo); i++) nomeArquivo = `${slug(p.nome)}-${i}`;
    usados.add(nomeArquivo);
    const eventos = [
      ...p.pregacoes.map((d) => evento({ uid: `${d.data}-prega-${nomeArquivo}@planejamentoseries`, resumo: `Pregar: ${d.texto || 'texto a definir'}`, d, config, agora, url })),
      ...p.saudacoes.map((d) => evento({ uid: `${d.data}-saudacao-${nomeArquivo}@planejamentoseries`, resumo: 'Saudação no culto', d, config, agora, url })),
    ];
    arquivos[`${nomeArquivo}.ics`] = calendario(`${titulo} — ${p.nome}`, eventos, config);
    indice.pessoas[p.nome] = `${nomeArquivo}.ics`;
  }
  return { arquivos, indice };
}

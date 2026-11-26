// Datas sempre como texto "aaaa-mm-dd" (sem horário), no fuso de São Paulo.

export const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
  'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** Data de hoje em São Paulo. Aceita uma data fixa (para testes). */
export function hojeEm(fuso = 'America/Sao_Paulo', agora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
}

const utc = (iso) => new Date(`${iso}T12:00:00Z`);

export function somarDias(iso, dias) {
  const d = utc(iso);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function diasEntre(de, ate) {
  return Math.round((utc(ate) - utc(de)) / 86400000);
}

/** 0 = domingo … 6 = sábado */
export function diaDaSemana(iso) {
  return utc(iso).getUTCDay();
}

/** "2027-01-10" → "10/01/2027" */
export function formatarData(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

/** "2027-01-10" → "10/01" */
export function diaMes(iso) {
  return formatarData(iso).slice(0, 5);
}

/** "2027-01-10" → "2027-01" */
export const chaveMes = (iso) => iso.slice(0, 7);

/** "2027-01" → "janeiro de 2027" */
export function nomeMes(chave) {
  const [a, m] = chave.split('-');
  return `${MESES[Number(m) - 1]} de ${a}`;
}

/** "10 de janeiro de 2027" */
export function dataPorExtenso(iso) {
  const [a, m, d] = iso.split('-');
  return `${Number(d)} de ${MESES[Number(m) - 1]} de ${a}`;
}

/** Domingo de Páscoa (calendário gregoriano). pascoa(2027) → "2027-03-28" */
export function pascoa(ano) {
  const a = ano % 19, b = Math.floor(ano / 100), c = ano % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Todos os domingos de um ano, em ordem. */
export function domingosDoAno(ano) {
  let d = `${ano}-01-01`;
  d = somarDias(d, (7 - diaDaSemana(d)) % 7);
  const lista = [];
  for (; d.startsWith(String(ano)); d = somarDias(d, 7)) lista.push(d);
  return lista;
}

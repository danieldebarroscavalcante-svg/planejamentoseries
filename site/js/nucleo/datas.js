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

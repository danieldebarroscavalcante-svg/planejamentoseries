// Textos prontos (WhatsApp) a partir de um domingo.

import { pessoaPendente } from './modelo.js';
import { formatarData } from './datas.js';

const ouADefinir = (v) => (pessoaPendente(v) ? 'A definir' : v);

export function textoWhatsApp(d) {
  if (d.semMinistracao) {
    return `*Domingo, ${formatarData(d.data)}*\n${d.tema || 'Sem ministração neste domingo.'}`;
  }
  const serie = d.serie ? `${d.serie}${d.posicao ? ` (mensagem ${d.posicao} de ${d.total})` : ''}` : '';
  return [
    `*Ministração de domingo — ${formatarData(d.data)}*`,
    '',
    `📖 *Texto:* ${ouADefinir(d.texto)}`,
    `💬 *Tema:* ${ouADefinir(d.tema)}`,
    `🎤 *Preletor:* ${ouADefinir(d.preletor)}`,
    `🤝 *Saudação:* ${ouADefinir(d.saudacao)}`,
    ...(serie ? [`📚 *Série:* ${serie}`] : []),
  ].join('\n');
}

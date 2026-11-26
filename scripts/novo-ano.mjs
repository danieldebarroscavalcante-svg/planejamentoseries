// Prepara os arquivos para um novo ano (ex.: 2028), sem inventar conteúdo:
//   - "Cronograma 2028.csv": uma linha por domingo do ano, só com a data e Status "A definir"
//   - "config-2028-sugestao.json": o config.json atual com ano, título e datas do novo ano
//   - "LEIA-ME.txt": os próximos passos
//
// Uso: node scripts/novo-ano.mjs 2028   (ou pela aba Actions → "Preparar novo ano")

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { domingosDoAno, formatarData, pascoa } from '../site/js/nucleo/datas.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const CABECALHO = ['Nº', 'Data', 'Feriado / fim de semana prolongado', 'Texto', 'Tema da mensagem', 'Preletor',
  'Saudação', 'Série', 'Mensagem na série', 'Status', 'Cumprimento profético / Eixo de identidade', 'Observações'];

export function cronogramaEmBranco(ano) {
  const linhas = [CABECALHO, ...domingosDoAno(ano).map((d) => ['', formatarData(d), '', '', '', '', '', '', '', 'A definir', '', ''])];
  return linhas.map((l) => l.map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(',')).join('\n') + '\n';
}

export function configSugerido(config, ano) {
  const domingos = domingosDoAno(ano);
  return {
    ...config,
    ano,
    titulo: `Ministrações ${ano}`,
    fontes: { cronograma: '', equipe: '', datasEspeciais: '' },
    estrutura: {
      primeiroDomingo: domingos[0],
      ultimoDomingo: domingos.at(-1),
      domingosComMensagem: domingos.length,
      datasFixas: [],
      _lembrete: `O ano tem ${domingos.length} domingos. Ajuste primeiroDomingo/ultimoDomingo ao período das ministrações, `
        + 'desconte os domingos sem ministração em domingosComMensagem e cadastre em datasFixas o Retiro e os especiais. '
        + `Domingo de Páscoa em ${ano}: ${formatarData(pascoa(ano))}.`,
    },
    series: (config.series ?? []).map((s) => ({ ...s, mensagens: 0 })),
    _lembreteSeries: 'Troque as séries pelas do novo ano: prefixo (início do nome na coluna Série), curto, cor, mensagens e rotuloEixo.',
  };
}

async function main() {
  const ano = Number(process.argv[2]);
  if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) {
    console.error('Uso: node scripts/novo-ano.mjs 2028');
    process.exit(1);
  }
  const config = JSON.parse(await readFile(path.join(RAIZ, 'config.json'), 'utf8'));
  const destino = path.join(RAIZ, 'novo-ano');
  await mkdir(destino, { recursive: true });
  await writeFile(path.join(destino, `Cronograma ${ano}.csv`), cronogramaEmBranco(ano));
  await writeFile(path.join(destino, `config-${ano}-sugestao.json`), JSON.stringify(configSugerido(config, ano), null, 2) + '\n');
  await writeFile(path.join(destino, 'LEIA-ME.txt'), [
    `Arquivos para ${ano}`,
    '',
    `1. "Cronograma ${ano}.csv": todos os domingos de ${ano}, só com a data. Importe na planilha nova`,
    '   (Arquivo → Importar → Substituir a página atual, estando na aba Cronograma).',
    `2. "config-${ano}-sugestao.json": cole no lugar do config.json do repositório e ajuste`,
    '   as séries e a estrutura (veja os itens "_lembrete").',
    `3. Domingo de Páscoa em ${ano}: ${formatarData(pascoa(ano))}.`,
    '',
    'Passo a passo completo no README, seção "Reaproveitar em um novo ano".',
    '',
  ].join('\n'));
  console.log(`Arquivos de ${ano} gerados em novo-ano/: ${domingosDoAno(ano).length} domingos; Páscoa em ${formatarData(pascoa(ano))}.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();

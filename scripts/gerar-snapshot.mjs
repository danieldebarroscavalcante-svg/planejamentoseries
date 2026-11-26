// Gera dados/cronograma.json (cópia de segurança) a partir das abas publicadas.
//
//   node scripts/gerar-snapshot.mjs           → usa os links do config.json
//                                               (ou dados/csv/ se ainda não houver links)
//   node scripts/gerar-snapshot.mjs --local   → força o uso de dados/csv/

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { montarBase } from '../site/js/nucleo/modelo.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARQUIVOS_LOCAIS = { cronograma: 'Cronograma.csv', equipe: 'Equipe.csv', datasEspeciais: 'Datas especiais.csv' };

export async function baixarCsv(url) {
  const resp = await fetch(url, { redirect: 'follow' });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ao baixar ${url}`);
  const texto = await resp.text();
  if (/^\s*<(!doctype|html)/i.test(texto)) throw new Error(`O link não devolveu CSV (veio uma página HTML): ${url}`);
  return texto;
}

export async function lerFontes(config, { local = false } = {}) {
  const fontes = config.fontes ?? {};
  const usarLinks = !local && Object.keys(ARQUIVOS_LOCAIS).every((aba) => fontes[aba]);
  const csvs = {};
  for (const [aba, arquivo] of Object.entries(ARQUIVOS_LOCAIS)) {
    csvs[aba] = usarLinks
      ? await baixarCsv(fontes[aba])
      : await readFile(path.join(RAIZ, 'dados', 'csv', arquivo), 'utf8');
  }
  return { csvs, origem: usarLinks ? 'google-sheets' : 'dados/csv' };
}

/** Grava o JSON só se o conteúdo mudou (ignora a data de geração), para não poluir o histórico. */
export async function gravarSnapshot(base, origem, destino = path.join(RAIZ, 'dados', 'cronograma.json')) {
  const { avisosLeitura, ...dados } = base;
  const novo = { versao: 1, origem, ...dados };
  try {
    const antigo = JSON.parse(await readFile(destino, 'utf8'));
    delete antigo.geradoEm;
    if (JSON.stringify(antigo) === JSON.stringify(novo)) return false;
  } catch { /* não existe ainda */ }
  await writeFile(destino, JSON.stringify({ geradoEm: new Date().toISOString(), ...novo }, null, 2) + '\n');
  return true;
}

async function main() {
  const config = JSON.parse(await readFile(path.join(RAIZ, 'config.json'), 'utf8'));
  const { csvs, origem } = await lerFontes(config, { local: process.argv.includes('--local') });
  const base = montarBase(csvs);
  for (const a of base.avisosLeitura) console.warn('Aviso:', a.mensagem);
  const mudou = await gravarSnapshot(base, origem);
  const comMensagem = base.domingos.filter((d) => !d.semMinistracao).length;
  console.log(`Origem: ${origem}`);
  console.log(`Domingos: ${base.domingos.length} (${comMensagem} com mensagem) · Equipe: ${base.equipe.length} · Datas especiais: ${base.datasEspeciais.length}`);
  console.log(mudou ? 'dados/cronograma.json atualizado.' : 'dados/cronograma.json já estava em dia.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}

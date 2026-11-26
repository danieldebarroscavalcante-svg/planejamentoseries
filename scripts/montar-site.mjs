// Monta a pasta _site/ (o que vai para o GitHub Pages): site/ + config.json + dados/cronograma.json.
// Na Fase 4 a automação também coloca aqui os arquivos de agenda (.ics).

import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DESTINO = path.join(RAIZ, '_site');

export async function montarSite() {
  await rm(DESTINO, { recursive: true, force: true });
  await cp(path.join(RAIZ, 'site'), DESTINO, { recursive: true });
  await cp(path.join(RAIZ, 'config.json'), path.join(DESTINO, 'config.json'));
  await mkdir(path.join(DESTINO, 'dados'), { recursive: true });
  await cp(path.join(RAIZ, 'dados', 'cronograma.json'), path.join(DESTINO, 'dados', 'cronograma.json'));
  return DESTINO;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  montarSite().then((d) => console.log(`Site montado em ${path.relative(RAIZ, d)}/`));
}

// Rotina diária (GitHub Actions): baixa a planilha, confere, guarda a cópia de segurança,
// gera as agendas .ics, monta o site e atualiza a Issue de pendências.
//
// Variáveis de ambiente (a Action preenche sozinha):
//   GITHUB_TOKEN, GITHUB_REPOSITORY  → para a Issue (sem elas, a Issue é pulada)
//   SITE_URL                         → endereço do site, para links na Issue e na agenda
//   GITHUB_STEP_SUMMARY              → resumo exibido na página da execução

import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { montarBase } from '../site/js/nucleo/modelo.js';
import { hojeEm } from '../site/js/nucleo/datas.js';
import { pendenciasAtuais, verificar } from '../site/js/nucleo/regras.js';
import { gerarAgendas } from '../site/js/nucleo/agenda.js';
import { gravarSnapshot, lerFontes } from './gerar-snapshot.mjs';
import { montarSite } from './montar-site.mjs';
import { montarCorpo, precisaDeIssue, sincronizarIssue } from './issue.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT = path.join(RAIZ, 'dados', 'cronograma.json');

async function obterBase(config) {
  try {
    const { csvs, origem } = await lerFontes(config);
    return { base: montarBase(csvs), origem, observacao: '' };
  } catch (e) {
    // Google fora do ar ou link quebrado: segue com a última cópia de segurança.
    console.warn(`Não foi possível ler a planilha (${e.message}). Usando a cópia de segurança.`);
    const snap = JSON.parse(await readFile(SNAPSHOT, 'utf8'));
    return {
      base: { domingos: snap.domingos, equipe: snap.equipe, datasEspeciais: snap.datasEspeciais, avisosLeitura: [] },
      origem: 'copia',
      observacao: `A planilha não pôde ser lida hoje (${e.message}). As informações abaixo vêm da última cópia de segurança.`,
    };
  }
}

async function main() {
  const config = JSON.parse(await readFile(path.join(RAIZ, 'config.json'), 'utf8'));
  const hoje = process.env.HOJE || hojeEm(config.fuso);
  const site = process.env.SITE_URL || '';

  const { base, origem, observacao } = await obterBase(config);
  for (const a of base.avisosLeitura) console.warn('Aviso de leitura:', a.mensagem);

  const mudou = origem === 'copia' ? false : await gravarSnapshot(base, origem);
  const pendencias = pendenciasAtuais(verificar(base, config, hoje), hoje);

  // Site + agendas
  const destino = await montarSite();
  const { arquivos, indice } = gerarAgendas(base, config, { url: site });
  await mkdir(path.join(destino, 'agenda'), { recursive: true });
  for (const [nome, conteudo] of Object.entries(arquivos)) await writeFile(path.join(destino, 'agenda', nome), conteudo);
  await writeFile(path.join(destino, 'agenda', 'indice.json'), JSON.stringify(indice, null, 2));
  await writeFile(path.join(destino, '.nojekyll'), '');

  // Issue
  let issue = { acao: 'pulada (sem GITHUB_TOKEN)' };
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
    issue = await sincronizarIssue(pendencias, { site, hoje, origem, observacao }, {
      token: process.env.GITHUB_TOKEN, repositorio: process.env.GITHUB_REPOSITORY,
    });
  } else if (process.argv.includes('--mostrar-issue')) {
    console.log(montarCorpo(pendencias, { site, hoje, origem, observacao }));
  }

  const n = (nivel) => pendencias.filter((p) => p.nivel === nivel).length;
  const resumo = [
    '## Atualização da escala',
    `- Data de referência: ${hoje}`,
    `- Origem dos dados: ${origem === 'google-sheets' ? 'planilha do Google' : origem === 'copia' ? '**cópia de segurança (planilha indisponível)**' : origem}`,
    `- Cópia de segurança: ${mudou ? 'atualizada' : 'sem mudanças'}`,
    `- Domingos: ${base.domingos.length} · Agendas geradas: ${Object.keys(arquivos).length}`,
    `- Pendências: ${n('erro')} erros, ${n('alerta')} alertas, ${n('aviso')} avisos`,
    `- Issue: ${issue.acao}${issue.numero ? ` (#${issue.numero})` : ''}`,
  ].join('\n');
  console.log(resumo);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, resumo + '\n');
  if (precisaDeIssue(pendencias)) console.log('Há pendências: veja a Issue.');
}

main().catch((e) => { console.error(e); process.exit(1); });

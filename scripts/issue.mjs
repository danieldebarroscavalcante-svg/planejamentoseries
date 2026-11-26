// Abre, atualiza ou fecha a Issue de pendências no GitHub.
//
// - Abre quando há erros ou alertas (o GitHub manda e-mail para quem acompanha o repositório).
// - Quando a lista muda, atualiza o texto e comenta o que entrou e o que saiu (novo e-mail).
// - Quando a lista não muda, não mexe (sem e-mails repetidos todo dia).
// - Quando não sobra erro nem alerta, comenta e fecha.

import { formatarData } from '../site/js/nucleo/datas.js';

export const ETIQUETA = 'pendencias';
export const TITULO = 'Pendências da escala de ministrações';

const ORIGENS = { 'google-sheets': 'da planilha do Google', copia: 'da cópia de segurança', 'dados/csv': 'dos arquivos CSV do repositório (dados/csv)' };

const SECOES = [
  ['erro', '🔴 Erros na estrutura do ano'],
  ['alerta', '🟠 Alertas: próximos domingos sem preletor ou saudação'],
  ['aviso', '⚪ Avisos para conferir'],
];

/** Uma linha de lista (estável: o mesmo problema sempre gera o mesmo texto). */
export function linhaDaPendencia(p, site) {
  const link = p.data && site ? ` — [abrir](${site}#/domingo/${p.data})` : '';
  return `- ${p.mensagem}${link}`;
}

export const precisaDeIssue = (pendencias) => pendencias.some((p) => p.nivel === 'erro' || p.nivel === 'alerta');

export function montarCorpo(pendencias, { site = '', hoje, origem, observacao = '' } = {}) {
  const partes = [
    `Lista gerada automaticamente em **${formatarData(hoje)}** a partir ${ORIGENS[origem] ?? 'dos arquivos do repositório'}.`,
  ];
  if (observacao) partes.push(`> ⚠️ ${observacao}`);
  for (const [nivel, titulo] of SECOES) {
    const itens = pendencias.filter((p) => p.nivel === nivel);
    if (!itens.length) continue;
    partes.push(`### ${titulo} (${itens.length})`, itens.map((p) => linhaDaPendencia(p, site)).join('\n'));
  }
  partes.push(
    '---',
    `${site ? `[Abrir o Painel](${site}#/painel?ver=pendencias) · ` : ''}Para resolver, corrija a planilha do Google. Esta Issue é atualizada todo dia e **fecha sozinha** quando não houver mais erros nem alertas.`,
  );
  return partes.join('\n\n') + '\n';
}

/** Linhas de pendência ("- ...") contidas num corpo de Issue. */
export function itensDoCorpo(corpo) {
  return new Set(String(corpo ?? '').split('\n').filter((l) => l.startsWith('- ')));
}

/** Decide o que fazer, sem tocar no GitHub (facilita testar). */
export function decidir({ aberta, corpoNovo, temPendencias }) {
  if (!temPendencias) return aberta ? { acao: 'fechar' } : { acao: 'nada' };
  if (!aberta) return { acao: 'abrir' };
  const antes = itensDoCorpo(aberta.body);
  const depois = itensDoCorpo(corpoNovo);
  const novas = [...depois].filter((l) => !antes.has(l));
  const resolvidas = [...antes].filter((l) => !depois.has(l));
  if (!novas.length && !resolvidas.length) return { acao: 'nada' };
  return { acao: 'atualizar', novas, resolvidas };
}

export function comentarioDeMudanca({ novas, resolvidas }) {
  const partes = ['A lista de pendências mudou.'];
  if (novas.length) partes.push(`**Novas (${novas.length}):**\n${novas.join('\n')}`);
  if (resolvidas.length) partes.push(`**Resolvidas (${resolvidas.length}):**\n${resolvidas.join('\n')}`);
  return partes.join('\n\n');
}

// ---------------------------------------------------------------------------
// Comunicação com o GitHub (usa o GITHUB_TOKEN que a Action fornece de graça)

function cliente({ token, repositorio }) {
  return async (metodo, caminho, corpo) => {
    const r = await fetch(`https://api.github.com/repos/${repositorio}${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'ministracoes-automacao',
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    if (!r.ok && !(metodo === 'POST' && caminho === '/labels' && r.status === 422)) {
      throw new Error(`GitHub ${metodo} ${caminho}: HTTP ${r.status} ${await r.text()}`);
    }
    return r.status === 204 ? null : r.json();
  };
}

export async function sincronizarIssue(pendencias, opcoes, { token, repositorio }) {
  const api = cliente({ token, repositorio });
  const abertas = await api('GET', `/issues?state=open&labels=${ETIQUETA}&per_page=10`);
  const aberta = (abertas ?? []).find((i) => !i.pull_request) ?? null;
  const corpoNovo = montarCorpo(pendencias, opcoes);
  const decisao = decidir({ aberta, corpoNovo, temPendencias: precisaDeIssue(pendencias) });

  if (decisao.acao === 'abrir') {
    await api('POST', '/labels', { name: ETIQUETA, color: 'FF9F0A', description: 'Pendências da escala (automático)' });
    const nova = await api('POST', '/issues', { title: TITULO, body: corpoNovo, labels: [ETIQUETA] });
    return { ...decisao, numero: nova.number };
  }
  if (decisao.acao === 'atualizar') {
    await api('PATCH', `/issues/${aberta.number}`, { body: corpoNovo });
    await api('POST', `/issues/${aberta.number}/comments`, { body: comentarioDeMudanca(decisao) });
  }
  if (decisao.acao === 'fechar') {
    await api('POST', `/issues/${aberta.number}/comments`, { body: '✅ Não há mais erros nem alertas na escala. Fechando automaticamente.' });
    await api('PATCH', `/issues/${aberta.number}`, { state: 'closed', state_reason: 'completed' });
  }
  return { ...decisao, numero: aberta?.number };
}

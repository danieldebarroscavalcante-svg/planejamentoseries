import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dobrarLinha, escaparIcs, gerarAgendas } from '../site/js/nucleo/agenda.js';
import { decidir, itensDoCorpo, montarCorpo, precisaDeIssue } from '../scripts/issue.mjs';
import { verificar } from '../site/js/nucleo/regras.js';
import { base, CONFIG } from './ajuda.mjs';

// ---------- Agenda (.ics) ----------

test('escape do iCalendar', () => {
  assert.equal(escaparIcs('a, b; c\nd'), 'a\\, b\\; c\\nd');
});

test('linhas longas são quebradas em até 75 bytes', () => {
  const linha = `DESCRIPTION:${'Introdução — ção '.repeat(20)}`;
  for (const parte of dobrarLinha(linha).split('\r\n')) assert.ok(new TextEncoder().encode(parte).length <= 75);
  assert.equal(dobrarLinha(linha).replace(/\r\n /g, ''), linha);
});

test('agenda geral e uma agenda por pessoa', () => {
  const b = base((pl) => {
    pl.definir('10/01/2027', 'preletor', 'Pessoa A');
    pl.definir('17/01/2027', 'saudacao', 'Pessoa A');
    pl.definir('17/01/2027', 'preletor', 'Pessoa B');
  });
  const { arquivos, indice } = gerarAgendas(b, CONFIG, { agora: new Date('2026-11-26T00:00:00Z') });
  assert.deepEqual(Object.keys(arquivos).sort(), ['pessoa-a.ics', 'pessoa-b.ics', 'todos.ics']);
  assert.deepEqual(indice.pessoas, { 'Pessoa A': 'pessoa-a.ics', 'Pessoa B': 'pessoa-b.ics' });
  const a = arquivos['pessoa-a.ics'];
  assert.equal((a.match(/BEGIN:VEVENT/g) ?? []).length, 2);
  assert.match(a, /DTSTART;VALUE=DATE:20270110/);
  assert.match(a, /SUMMARY:Saudação no culto/);
  assert.equal((arquivos['todos.ics'].match(/BEGIN:VEVENT/g) ?? []).length, 49);
  assert.ok(!/@(?!planejamentoseries)/.test(Object.values(arquivos).join('')), 'nenhum e-mail nos arquivos');
});

test('horário opcional do culto', () => {
  const b = base((pl) => pl.definir('10/01/2027', 'preletor', 'Pessoa A'));
  const config = { ...CONFIG, agenda: { horario: '18:30', duracaoMinutos: 90 } };
  const { arquivos } = gerarAgendas(b, config);
  assert.match(arquivos['pessoa-a.ics'], /DTSTART;TZID=America\/Sao_Paulo:20270110T183000/);
  assert.match(arquivos['pessoa-a.ics'], /DTEND;TZID=America\/Sao_Paulo:20270110T200000/);
});

// ---------- Issue de pendências ----------

const pend = (hoje, mudar) => verificar(base(mudar), CONFIG, hoje);

test('sem erros nem alertas não abre Issue', () => {
  const p = pend('2026-11-26');
  assert.equal(precisaDeIssue(p), false);
  assert.deepEqual(decidir({ aberta: null, corpoNovo: montarCorpo(p, { hoje: '2026-11-26' }), temPendencias: false }), { acao: 'nada' });
});

test('abre Issue quando há alertas', () => {
  const p = pend('2027-01-01');
  assert.equal(decidir({ aberta: null, corpoNovo: '', temPendencias: precisaDeIssue(p) }).acao, 'abrir');
});

test('mesma lista em outro dia: não mexe (sem e-mail repetido)', () => {
  const p = pend('2027-01-01');
  const ontem = montarCorpo(p, { hoje: '2027-01-01', site: 'https://x/' });
  const hoje = montarCorpo(p, { hoje: '2027-01-02', site: 'https://x/' });
  assert.deepEqual(decidir({ aberta: { body: ontem }, corpoNovo: hoje, temPendencias: true }), { acao: 'nada' });
});

test('lista mudou: atualiza e informa o que entrou e o que saiu', () => {
  const antes = montarCorpo(pend('2027-01-01'), { hoje: '2027-01-01' });
  const depois = montarCorpo(pend('2027-01-12'), { hoje: '2027-01-12' }); // 10/01 saiu, 07/02 entrou
  const d = decidir({ aberta: { body: antes }, corpoNovo: depois, temPendencias: true });
  assert.equal(d.acao, 'atualizar');
  assert.ok(d.novas.some((l) => l.includes('07/02/2027')));
  assert.ok(d.resolvidas.some((l) => l.includes('10/01/2027')));
});

test('tudo resolvido: fecha a Issue', () => {
  assert.equal(decidir({ aberta: { body: '- x' }, corpoNovo: '', temPendencias: false }).acao, 'fechar');
});

test('corpo da Issue lista só nomes e datas', () => {
  const corpo = montarCorpo(pend('2027-01-01'), { hoje: '2027-01-01', origem: 'google-sheets' });
  assert.match(corpo, /planilha do Google/);
  assert.equal(itensDoCorpo(corpo).size, 8);
});

// ---------- Conversa com o GitHub (simulada) ----------
import { sincronizarIssue } from '../scripts/issue.mjs';

function githubFalso(abertas) {
  const chamadas = [];
  globalThis.fetch = async (url, op) => {
    const caminho = url.replace('https://api.github.com/repos/dono/repo', '');
    chamadas.push(`${op.method} ${caminho.split('?')[0]}`);
    const corpo = op.method === 'GET' ? abertas : { number: 7 };
    return { ok: true, status: 200, json: async () => corpo, text: async () => '' };
  };
  return chamadas;
}

test('GitHub: abre a Issue com a etiqueta', async () => {
  const chamadas = githubFalso([]);
  const r = await sincronizarIssue(pend('2027-01-01'), { hoje: '2027-01-01' }, { token: 't', repositorio: 'dono/repo' });
  assert.equal(r.acao, 'abrir');
  assert.deepEqual(chamadas, ['GET /issues', 'POST /labels', 'POST /issues']);
});

test('GitHub: atualiza e comenta quando muda; fecha quando resolve', async () => {
  const antiga = { number: 3, body: montarCorpo(pend('2027-01-01'), { hoje: '2027-01-01' }) };
  let chamadas = githubFalso([antiga]);
  await sincronizarIssue(pend('2027-01-12'), { hoje: '2027-01-12' }, { token: 't', repositorio: 'dono/repo' });
  assert.deepEqual(chamadas, ['GET /issues', 'PATCH /issues/3', 'POST /issues/3/comments']);
  chamadas = githubFalso([antiga]);
  await sincronizarIssue([], { hoje: '2027-01-12' }, { token: 't', repositorio: 'dono/repo' });
  assert.deepEqual(chamadas, ['GET /issues', 'POST /issues/3/comments', 'PATCH /issues/3']);
});

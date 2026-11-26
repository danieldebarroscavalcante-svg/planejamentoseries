import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pendenciasAtuais, verificar } from '../site/js/nucleo/regras.js';
import { base, codigos, CONFIG } from './ajuda.mjs';

const ANTES_DO_ANO = '2026-11-26';

test('a planilha real de 2027 passa em todas as conferências de estrutura', () => {
  const p = verificar(base(), CONFIG, ANTES_DO_ANO);
  assert.deepEqual(p, []);
});

test('49 domingos com mensagem, Retiro em 28/02 e Páscoa em 28/03', () => {
  const b = base();
  assert.equal(b.domingos.filter((d) => !d.semMinistracao).length, 49);
  assert.equal(b.domingos.find((d) => d.data === '2027-02-28').semMinistracao, true);
  assert.match(b.domingos.find((d) => d.data === '2027-03-28').serie, /Páscoa/);
});

// ---------- Próximos 30 dias ----------

test('alerta para domingo sem preletor ou sem saudação nos próximos 30 dias', () => {
  const p = verificar(base(), CONFIG, '2027-01-01');
  assert.equal(codigos(p, 'alerta').filter((c) => c === 'sem-preletor').length, 4); // 10, 17, 24 e 31/01
  assert.equal(codigos(p, 'alerta').filter((c) => c === 'sem-saudacao').length, 4);
  assert.ok(p.every((x) => x.data <= '2027-01-31'));
});

test('domingo com preletor e saudação não gera alerta', () => {
  const b = base((pl) => { pl.definir('10/01/2027', 'preletor', 'Pessoa A'); pl.definir('10/01/2027', 'saudacao', 'Pessoa B'); });
  const p = verificar(b, CONFIG, '2027-01-01');
  assert.ok(!p.some((x) => x.data === '2027-01-10'));
});

test('"A definir" e "—" contam como sem preletor', () => {
  const b = base((pl) => { pl.definir('10/01/2027', 'preletor', 'A definir'); pl.definir('10/01/2027', 'saudacao', '—'); });
  const p = verificar(b, CONFIG, '2027-01-01').filter((x) => x.data === '2027-01-10');
  assert.deepEqual(codigos(p).sort(), ['sem-preletor', 'sem-saudacao']);
});

test('o Retiro não gera alerta de preletor', () => {
  const p = verificar(base(), CONFIG, '2027-02-27');
  assert.ok(!p.some((x) => x.data === '2027-02-28'));
});

test('telefone digitado por engano é ocultado e o domingo fica sem saudação', () => {
  const b = base((pl) => pl.definir('10/01/2027', 'saudacao', '(11) 98765-4321'));
  assert.equal(b.domingos[0].saudacao, '[contato removido]');
  const p = verificar(b, CONFIG, '2027-01-01');
  assert.ok(codigos(p, 'erro').includes('contato-removido'));
  assert.ok(p.some((x) => x.codigo === 'sem-saudacao' && x.data === '2027-01-10'));
});

// ---------- Datas ----------

test('data duplicada', () => {
  const b = base((pl) => pl.definir('17/01/2027', 'data', '10/01/2027'));
  assert.ok(codigos(verificar(b, CONFIG, ANTES_DO_ANO), 'erro').includes('data-duplicada'));
});

test('data que não é domingo', () => {
  const b = base((pl) => pl.definir('17/01/2027', 'data', '18/01/2027'));
  const c = codigos(verificar(b, CONFIG, ANTES_DO_ANO), 'erro');
  assert.ok(c.includes('nao-e-domingo'));
  assert.ok(c.includes('domingo-faltando')); // 17/01 sumiu
});

test('domingo apagado da planilha', () => {
  const b = base((pl) => pl.remover('14/03/2027'));
  const c = codigos(verificar(b, CONFIG, ANTES_DO_ANO), 'erro');
  assert.ok(c.includes('domingo-faltando'));
  assert.ok(c.includes('total-de-domingos'));
  assert.ok(c.includes('contagem-da-serie'));
});

// ---------- Estrutura ----------

test('Retiro fora de 28/02 é erro', () => {
  const b = base((pl) => { pl.definir('28/02/2027', 'serie', 'Mateus — Para se cumprir...'); });
  assert.ok(codigos(verificar(b, CONFIG, ANTES_DO_ANO), 'erro').includes('data-fixa'));
});

test('Páscoa fora de 28/03 é erro', () => {
  const b = base((pl) => pl.definir('28/03/2027', 'serie', 'Mateus — Para se cumprir...'));
  const p = verificar(b, CONFIG, ANTES_DO_ANO);
  assert.ok(p.some((x) => x.codigo === 'data-fixa' && x.data === '2027-03-28'));
});

test('sequência quebrada: "Mensagem 5 de 26" antes da 4', () => {
  const b = base((pl) => { pl.definir('31/01/2027', 'mensagem', '5 de 26'); pl.definir('07/02/2027', 'mensagem', '4 de 26'); });
  const p = verificar(b, CONFIG, ANTES_DO_ANO).filter((x) => x.codigo === 'sequencia-quebrada');
  assert.equal(p.length, 2);
  assert.match(p[0].mensagem, /Mensagem 5 de 26/);
  assert.match(p[1].mensagem, /vem depois da mensagem 5/);
});

test('"X de Y" com total errado', () => {
  const b = base((pl) => pl.definir('31/01/2027', 'mensagem', '4 de 25'));
  assert.ok(codigos(verificar(b, CONFIG, ANTES_DO_ANO), 'erro').includes('total-na-serie'));
});

test('"Mensagem na série" vazia', () => {
  const b = base((pl) => pl.definir('31/01/2027', 'mensagem', ''));
  assert.ok(codigos(verificar(b, CONFIG, ANTES_DO_ANO), 'erro').includes('mensagem-na-serie'));
});

test('série com contagem errada', () => {
  const b = base((pl) => pl.definir('18/07/2027', 'serie', 'Efésios — Quem você pensa que é?'));
  const p = verificar(b, CONFIG, ANTES_DO_ANO).filter((x) => x.codigo === 'contagem-da-serie');
  assert.equal(p.length, 2); // Mateus com 25 e Efésios com 12
});

test('série sem introdução no primeiro domingo', () => {
  const b = base((pl) => {
    pl.definir('25/07/2027', 'mensagem', '2 de 11');
    pl.definir('25/07/2027', 'tema', 'Escolhidos, adotados, selados');
    pl.definir('01/08/2027', 'mensagem', '1 de 11');
  });
  const c = codigos(verificar(b, CONFIG, ANTES_DO_ANO));
  assert.ok(c.includes('sem-introducao'));
  assert.ok(c.includes('sequencia-quebrada'));
});

test('status fora da lista', () => {
  const b = base((pl) => pl.definir('10/01/2027', 'status', 'Talvez'));
  assert.ok(codigos(verificar(b, CONFIG, ANTES_DO_ANO), 'aviso').includes('status-invalido'));
});

test('Nº fora da ordem gera aviso', () => {
  const b = base((pl) => pl.definir('10/01/2027', 'numero', '7'));
  assert.ok(codigos(verificar(b, CONFIG, ANTES_DO_ANO), 'aviso').includes('numeracao'));
});

test('série que não está no config.json', () => {
  const b = base((pl) => pl.definir('10/10/2027', 'serie', 'Neemias — Reconstruir'));
  assert.ok(codigos(verificar(b, CONFIG, ANTES_DO_ANO), 'aviso').includes('serie-desconhecida'));
});

test('série do AT renomeada mantendo o prefixo continua reconhecida', () => {
  const b = base((pl) => {
    for (const l of pl.linhas) if (l[7] === 'Antigo Testamento — a definir') l[7] = 'Antigo Testamento — Neemias';
  });
  assert.deepEqual(verificar(b, CONFIG, ANTES_DO_ANO), []);
});

// ---------- Pessoas ----------

test('mesma pessoa em domingos seguidos', () => {
  const b = base((pl) => { pl.definir('10/01/2027', 'preletor', 'Pessoa A'); pl.definir('17/01/2027', 'preletor', 'pessoa a'); });
  assert.ok(codigos(verificar(b, CONFIG, ANTES_DO_ANO), 'aviso').includes('domingos-seguidos'));
});

test('Retiro no meio não conta como domingos seguidos', () => {
  const b = base((pl) => { pl.definir('21/02/2027', 'preletor', 'Pessoa A'); pl.definir('07/03/2027', 'preletor', 'Pessoa A'); });
  assert.ok(!codigos(verificar(b, CONFIG, ANTES_DO_ANO)).includes('domingos-seguidos'));
});

test('acima do limite mensal (config: 2 pregações por mês)', () => {
  const b = base((pl) => ['03/10/2027', '17/10/2027', '31/10/2027'].forEach((d) => {
    if (d !== '03/10/2027') pl.definir(d, 'preletor', 'Pessoa B');
  }));
  assert.ok(!codigos(verificar(b, CONFIG, ANTES_DO_ANO)).includes('limite-mensal'));
  const b3 = base((pl) => ['10/10/2027', '24/10/2027', '31/10/2027'].forEach((d) => pl.definir(d, 'saudacao', 'Pessoa C')));
  assert.ok(codigos(verificar(b3, CONFIG, ANTES_DO_ANO), 'aviso').includes('limite-mensal'));
});

test('limite mensal configurável', () => {
  const b = base((pl) => ['10/10/2027', '24/10/2027'].forEach((d) => pl.definir(d, 'preletor', 'Pessoa B')));
  const config = { ...CONFIG, limites: { ...CONFIG.limites, pregacoesPorMes: 1 } };
  assert.ok(codigos(verificar(b, config, ANTES_DO_ANO), 'aviso').includes('limite-mensal'));
});

test('pessoa escalada em fim de semana prolongado (Carnaval) é sinalizada', () => {
  const b = base((pl) => pl.definir('07/02/2027', 'preletor', 'Pessoa A'));
  assert.ok(codigos(verificar(b, CONFIG, ANTES_DO_ANO), 'aviso').includes('feriadao'));
});

test('feriado no meio da semana (Tiradentes) não é fim de semana prolongado', () => {
  const b = base((pl) => pl.definir('18/04/2027', 'preletor', 'Pessoa A'));
  assert.ok(!codigos(verificar(b, CONFIG, ANTES_DO_ANO)).includes('feriadao'));
});

test('avisos de pessoas em datas passadas somem; erros ficam', () => {
  const b = base((pl) => {
    pl.definir('07/02/2027', 'preletor', 'Pessoa A');
    pl.definir('17/01/2027', 'data', '10/01/2027');
  });
  const todas = verificar(b, CONFIG, '2027-03-01');
  const atuais = pendenciasAtuais(todas, '2027-03-01');
  assert.ok(codigos(todas).includes('feriadao'));
  assert.ok(!codigos(atuais).includes('feriadao'));
  assert.ok(codigos(atuais).includes('data-duplicada'));
});

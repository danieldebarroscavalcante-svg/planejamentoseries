import { test } from 'node:test';
import assert from 'node:assert/strict';
import { domingosDoAno, pascoa } from '../site/js/nucleo/datas.js';
import { cronogramaEmBranco, configSugerido } from '../scripts/novo-ano.mjs';
import { lerCsv } from '../site/js/nucleo/csv.js';
import { montarBase } from '../site/js/nucleo/modelo.js';
import { CONFIG } from './ajuda.mjs';

test('data da Páscoa', () => {
  assert.equal(pascoa(2024), '2024-03-31');
  assert.equal(pascoa(2025), '2025-04-20');
  assert.equal(pascoa(2027), '2027-03-28');
  assert.equal(pascoa(2028), '2028-04-16');
});

test('domingos do ano', () => {
  const d27 = domingosDoAno(2027);
  assert.equal(d27.length, 52);
  assert.equal(d27[0], '2027-01-03');
  assert.equal(d27.at(-1), '2027-12-26');
  assert.equal(domingosDoAno(2028)[0], '2028-01-02');
  assert.ok(domingosDoAno(2027).includes('2027-01-10') && domingosDoAno(2027).includes('2027-12-19'));
});

test('cronograma em branco do novo ano: só datas e "A definir"', () => {
  const csv = cronogramaEmBranco(2028);
  const linhas = lerCsv(csv);
  assert.equal(linhas.length - 1, domingosDoAno(2028).length);
  const b = montarBase({ cronograma: csv, equipe: 'Nome', datasEspeciais: 'Data,Descrição' });
  assert.deepEqual(b.avisosLeitura, []);
  assert.ok(b.domingos.every((d) => d.status === 'A definir' && !d.texto && !d.preletor));
});

test('sugestão de config para o novo ano', () => {
  const c = configSugerido(CONFIG, 2028);
  assert.equal(c.ano, 2028);
  assert.equal(c.titulo, 'Ministrações 2028');
  assert.equal(c.estrutura.primeiroDomingo, '2028-01-02');
  assert.match(c.estrutura._lembrete, /16\/04\/2028/);
  assert.deepEqual(c.fontes, { cronograma: '', equipe: '', datasEspeciais: '' });
  assert.equal(c.limites.pregacoesPorMes, CONFIG.limites.pregacoesPorMes);
});

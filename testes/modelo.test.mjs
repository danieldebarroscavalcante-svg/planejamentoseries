import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerCsv } from '../site/js/nucleo/csv.js';
import { lerData, lerMensagem, mascararContatos, montarBase, pessoaPendente, slug } from '../site/js/nucleo/modelo.js';
import { textoWhatsApp } from '../site/js/nucleo/formatos.js';
import { base } from './ajuda.mjs';

test('CSV com aspas, vírgulas e quebras de linha', () => {
  const l = lerCsv('a,b\r\n"x, y","linha 1\nlinha 2"\n"com ""aspas""",\n');
  assert.deepEqual(l, [['a', 'b'], ['x, y', 'linha 1\nlinha 2'], ['com "aspas"', '']]);
});

test('datas em dd/mm/aaaa, d/m/aaaa e aaaa-mm-dd', () => {
  assert.equal(lerData('10/01/2027'), '2027-01-10');
  assert.equal(lerData('7/2/2027'), '2027-02-07');
  assert.equal(lerData('2027-03-28'), '2027-03-28');
  assert.equal(lerData('31/02/2027'), '');
  assert.equal(lerData('amanhã'), '');
});

test('"Mensagem na série"', () => {
  assert.deepEqual(lerMensagem('5 de 26'), { posicao: 5, total: 26 });
  assert.deepEqual(lerMensagem('5/26'), { posicao: 5, total: 26 });
  assert.deepEqual(lerMensagem('Especial'), { especial: true });
  assert.deepEqual(lerMensagem(''), {});
});

test('telefones e e-mails são ocultados; referências bíblicas e datas não', () => {
  for (const t of ['(11) 98765-4321', '+55 11 98765 4321', '11987654321', '3456-7890', 'fulano@exemplo.com']) {
    assert.equal(mascararContatos(t), '[contato removido]', t);
  }
  for (const t of ['Gn 12:3; 22:18; 2Sm 7:12-16', 'Mt 26:36-75', 'Is 35:5-6; 61:1', '07/02/2027', '2027-01-10', 'anos 2027-2028']) {
    assert.equal(mascararContatos(t), t, t);
  }
});

test('nenhum texto da planilha real é confundido com contato', () => {
  const b = base();
  assert.deepEqual(b.avisosLeitura, []);
});

test('pessoa pendente', () => {
  for (const v of ['', ' ', 'A definir', 'a definir', '—', '-', '[contato removido]']) assert.ok(pessoaPendente(v), v);
  assert.ok(!pessoaPendente('Pessoa A'));
});

test('nome de arquivo da agenda', () => {
  assert.equal(slug('Pr. João da Silva'), 'pr-joao-da-silva');
  assert.equal(slug('  '), 'sem-nome');
});

test('cabeçalhos com pequenas diferenças continuam sendo reconhecidos', () => {
  const b = montarBase({ cronograma: 'nº,DATA,texto,Tema,Preletor,Saudacao,Série,Mensagem na serie,Status\n1,10/01/2027,Mt 1,Tema,,,Mateus,1 de 1,Planejado', equipe: 'Nome\nPessoa A', datasEspeciais: 'Data,Descrição\n' });
  assert.equal(b.domingos[0].texto, 'Mt 1');
  assert.equal(b.equipe[0].nome, 'Pessoa A');
  assert.deepEqual(b.avisosLeitura, []);
});

test('coluna obrigatória faltando gera aviso', () => {
  const b = montarBase({ cronograma: 'Data,Texto\n10/01/2027,Mt 1', equipe: 'Nome', datasEspeciais: 'Data,Descrição' });
  assert.ok(b.avisosLeitura.some((a) => a.tipo === 'coluna-ausente'));
});

test('texto para WhatsApp', () => {
  const d = base().domingos[0];
  const t = textoWhatsApp({ ...d, preletor: 'Pessoa A' });
  assert.match(t, /10\/01\/2027/);
  assert.match(t, /Mt 1:1-17/);
  assert.match(t, /Preletor:\* Pessoa A/);
  assert.match(t, /Saudação:\* A definir/);
  assert.match(t, /mensagem 1 de 26/);
});

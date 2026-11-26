// Monta bases de teste a partir dos CSVs reais do repositório, com alterações pontuais.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { lerCsv } from '../site/js/nucleo/csv.js';
import { montarBase } from '../site/js/nucleo/modelo.js';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ler = (nome) => readFileSync(path.join(RAIZ, 'dados', 'csv', nome), 'utf8');

export const CONFIG = JSON.parse(readFileSync(path.join(RAIZ, 'config.json'), 'utf8'));

const COLUNA = { numero: 0, data: 1, feriado: 2, texto: 3, tema: 4, preletor: 5, saudacao: 6, serie: 7, mensagem: 8, status: 9 };

/** Cria uma base; `mudar(planilha)` recebe ajudantes para editar as linhas. */
export function base(mudar) {
  const linhas = lerCsv(ler('Cronograma.csv'));
  const p = {
    linhas,
    /** Linha pela data dd/mm/aaaa */
    linha: (data) => {
      const l = linhas.find((x) => x[COLUNA.data] === data);
      if (!l) throw new Error(`Data ${data} não está na planilha de teste`);
      return l;
    },
    definir(data, campo, valor) { p.linha(data)[COLUNA[campo]] = valor; },
    remover(data) { linhas.splice(linhas.indexOf(p.linha(data)), 1); },
  };
  mudar?.(p);
  return montarBase({ cronograma: linhas, equipe: ler('Equipe.csv'), datasEspeciais: ler('Datas especiais.csv') });
}

export const codigos = (pendencias, nivel) => pendencias.filter((x) => !nivel || x.nivel === nivel).map((x) => x.codigo);

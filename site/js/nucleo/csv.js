// Leitor de CSV (padrão RFC 4180: aspas, vírgulas e quebras de linha dentro de campos).
// Usado igualmente pelo site (navegador) e pela automação (Node).

export function lerCsv(texto) {
  const s = String(texto ?? '').replace(/^﻿/, '');
  const linhas = [];
  let linha = [];
  let campo = '';
  let entreAspas = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (entreAspas) {
      if (c === '"') {
        if (s[i + 1] === '"') { campo += '"'; i++; }
        else entreAspas = false;
      } else campo += c;
    } else if (c === '"') entreAspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo !== '' || linha.length) { linha.push(campo); linhas.push(linha); }
  return linhas.filter((l) => l.some((v) => v.trim() !== ''));
}

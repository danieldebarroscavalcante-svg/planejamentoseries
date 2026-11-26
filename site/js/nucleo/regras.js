// Regras de conferência da escala. Usadas pelo Painel do site e pela Issue automática.
//
// Cada pendência: { nivel, codigo, mensagem, data? }
//   nivel "erro"   → estrutura do ano errada (contagem, sequência, data duplicada…)
//   nivel "alerta" → falta algo nos próximos dias (preletor/saudação)
//   nivel "aviso"  → vale conferir (domingos seguidos, limite mensal, feriadão…)

import { configDaSerie, pessoaPendente, semAcento } from './modelo.js';
import { chaveMes, diaDaSemana, diaMes, diasEntre, formatarData, nomeMes, somarDias } from './datas.js';

export const NIVEIS = ['erro', 'alerta', 'aviso'];

export const comMensagem = (base) => base.domingos.filter((d) => !d.semMinistracao);

export function ehIntroducao(d) {
  return d.posicao === 1 || semAcento(d.tema).startsWith('introducao');
}

/** Domingo com algo por definir (pessoa, texto, tema ou status). */
export function domingoPendente(d) {
  if (d.semMinistracao) return false;
  return pessoaPendente(d.preletor) || pessoaPendente(d.saudacao)
    || semAcento(d.status) === 'a definir'
    || pessoaPendente(d.texto) || pessoaPendente(d.tema);
}

/** O domingo cai num fim de semana prolongado? Usa a aba Datas especiais;
 *  se a data não estiver lá, procura palavras-chave na coluna Feriado. */
export function ehProlongado(d, base, config) {
  const especiais = (base.datasEspeciais ?? []).filter((e) => e.data === d.data);
  if (especiais.length) return especiais.some((e) => e.prolongado);
  const palavras = config?.palavrasProlongado ?? ['prolongado', 'emenda', 'fim de semana com feriado'];
  const f = semAcento(d.feriado);
  return !!f && palavras.some((p) => f.includes(semAcento(p)));
}

/** Todas as pessoas (aba Equipe + nomes que aparecem no Cronograma), com seus domingos. */
export function pessoas(base) {
  const mapa = new Map();
  const obter = (nome) => {
    const chave = semAcento(nome);
    if (!mapa.has(chave)) mapa.set(chave, { nome, funcao: '', pregacoes: [], saudacoes: [] });
    return mapa.get(chave);
  };
  for (const p of base.equipe ?? []) obter(p.nome).funcao = p.funcao;
  for (const d of base.domingos) {
    if (d.semMinistracao) continue;
    if (!pessoaPendente(d.preletor)) obter(d.preletor).pregacoes.push(d);
    if (!pessoaPendente(d.saudacao)) obter(d.saudacao).saudacoes.push(d);
  }
  return [...mapa.values()].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

/** Agrupa os domingos por série, na ordem em que as séries começam. */
export function series(base, config) {
  const mapa = new Map();
  for (const d of base.domingos) {
    if (!d.serie) continue;
    if (!mapa.has(d.serie)) mapa.set(d.serie, { nome: d.serie, config: configDaSerie(d.serie, config), domingos: [] });
    mapa.get(d.serie).domingos.push(d);
  }
  return [...mapa.values()];
}

// ---------------------------------------------------------------------------

// Avisos sobre pessoas (domingos seguidos, limite mensal, feriadão) só importam enquanto a data não passou.
const AVISOS_DE_PESSOAS = new Set(['domingos-seguidos', 'limite-mensal', 'feriadao']);

/** Remove avisos de pessoas cujas datas já passaram. Erros e alertas ficam sempre. */
export function pendenciasAtuais(lista, hoje) {
  return lista.filter((x) => !(AVISOS_DE_PESSOAS.has(x.codigo) && x.data && x.data < hoje));
}

/** "hoje", "amanhã", "em 9 dias" */
export function quandoFalta(dias) {
  return dias === 0 ? 'hoje' : dias === 1 ? 'amanhã' : `em ${dias} dias`;
}

export function verificar(base, config, hoje) {
  const p = [];
  const add = (nivel, codigo, mensagem, data, extra = {}) => p.push({ nivel, codigo, mensagem, ...(data ? { data } : {}), ...extra });
  const lim = config?.limites ?? {};
  const domingos = base.domingos.filter((d) => d.data);
  const mensagens = domingos.filter((d) => !d.semMinistracao);

  for (const a of base.avisosLeitura ?? []) add('erro', a.tipo, a.mensagem);

  // ---- Próximos dias: preletor e saudação ----
  const limite = somarDias(hoje, lim.diasAlerta ?? 30);
  for (const d of mensagens) {
    if (d.data < hoje || d.data > limite) continue;
    const dias = diasEntre(hoje, d.data);
    if (pessoaPendente(d.preletor)) add('alerta', 'sem-preletor', `${formatarData(d.data)}: sem preletor definido.`, d.data, { dias });
    if (pessoaPendente(d.saudacao)) add('alerta', 'sem-saudacao', `${formatarData(d.data)}: sem saudação definida.`, d.data, { dias });
  }

  // ---- Datas ----
  const vistas = new Map();
  for (const d of domingos) {
    if (vistas.has(d.data)) add('erro', 'data-duplicada', `A data ${formatarData(d.data)} aparece mais de uma vez (linhas ${vistas.get(d.data)} e ${d.linha}).`, d.data);
    else vistas.set(d.data, d.linha);
    if (diaDaSemana(d.data) !== 0) add('erro', 'nao-e-domingo', `${formatarData(d.data)} (linha ${d.linha}) não é domingo.`, d.data);
  }
  const est = config?.estrutura ?? {};
  if (est.primeiroDomingo && est.ultimoDomingo) {
    for (const d of domingos) {
      if (d.data < est.primeiroDomingo || d.data > est.ultimoDomingo) add('aviso', 'fora-do-periodo', `${formatarData(d.data)} está fora do período ${formatarData(est.primeiroDomingo)}–${formatarData(est.ultimoDomingo)}.`, d.data);
    }
    for (let dia = est.primeiroDomingo; dia <= est.ultimoDomingo; dia = somarDias(dia, 7)) {
      if (!vistas.has(dia)) add('erro', 'domingo-faltando', `O domingo ${formatarData(dia)} não está no Cronograma.`, dia);
    }
  }

  // ---- Estrutura do ano ----
  if (est.domingosComMensagem && mensagens.length !== est.domingosComMensagem) {
    add('erro', 'total-de-domingos', `Há ${mensagens.length} domingos com mensagem; o esperado são ${est.domingosComMensagem}.`);
  }
  for (const fixa of est.datasFixas ?? []) {
    const d = domingos.find((x) => x.data === fixa.data);
    if (!d || !semAcento(d.serie).startsWith(semAcento(fixa.serie))) {
      add('erro', 'data-fixa', `${fixa.descricao ?? fixa.serie} deveria estar em ${formatarData(fixa.data)}${d ? `, mas lá está "${d.serie || d.tema}"` : ''}.`, fixa.data);
    }
  }

  const validos = (config?.statusValidos ?? []).map(semAcento);
  for (const d of domingos) {
    if (validos.length && !validos.includes(semAcento(d.status))) add('aviso', 'status-invalido', `${formatarData(d.data)}: status "${d.status || '(vazio)'}" não é um dos valores da lista.`, d.data);
  }

  // Nº corrido (1, 2, 3…) na ordem das datas.
  mensagens.forEach((d, i) => {
    if (d.numero !== i + 1) add('aviso', 'numeracao', `${formatarData(d.data)}: Nº ${d.numero ?? '(vazio)'}, mas pela ordem das datas deveria ser ${i + 1}.`, d.data);
  });

  // ---- Séries ----
  for (const s of series(base, config)) {
    const cfg = s.config;
    if (!cfg) { add('aviso', 'serie-desconhecida', `A série "${s.nome}" não está cadastrada no config.json (fica sem cor e sem conferência de contagem).`); continue; }
    if (!cfg.mensagens) continue; // Retiro
    const lista = s.domingos.filter((d) => !d.semMinistracao);
    if (lista.length !== cfg.mensagens) add('erro', 'contagem-da-serie', `Série "${s.nome}": ${lista.length} domingos, mas o esperado são ${cfg.mensagens}.`);
    if (cfg.mensagens === 1 && lista.length === 1 && (lista[0].especial || lista[0].posicao)) continue;

    lista.forEach((d, i) => {
      if (!d.posicao) { add('erro', 'mensagem-na-serie', `${formatarData(d.data)}: "Mensagem na série" deveria ser "X de ${lista.length}", mas está "${d.mensagem || '(vazio)'}".`, d.data); return; }
      if (d.total !== lista.length) add('erro', 'total-na-serie', `${formatarData(d.data)}: "${d.mensagem}" — a série "${s.nome}" tem ${lista.length} domingos.`, d.data);
      if (d.posicao !== i + 1) {
        const ant = lista[i - 1];
        const detalhe = ant?.posicao > d.posicao ? ` (vem depois da mensagem ${ant.posicao}, em ${diaMes(ant.data)})` : '';
        add('erro', 'sequencia-quebrada', `Série "${s.nome}": em ${formatarData(d.data)} está "Mensagem ${d.posicao} de ${d.total}", mas pela ordem das datas deveria ser a ${i + 1}${detalhe}.`, d.data);
      }
    });
    if (lista[0] && !ehIntroducao(lista[0])) add('aviso', 'sem-introducao', `Série "${s.nome}": o primeiro domingo (${formatarData(lista[0].data)}) não está marcado como introdução.`, lista[0].data);
  }

  // ---- Pessoas ----
  const papeis = [
    { campo: 'preletor', nome: 'prega', limite: lim.pregacoesPorMes },
    { campo: 'saudacao', nome: 'faz a saudação', limite: lim.saudacoesPorMes },
  ];
  for (const { campo, nome, limite: max } of papeis) {
    const porMes = new Map();
    let anterior = null;
    for (const d of mensagens) {
      const pessoa = d[campo];
      if (pessoaPendente(pessoa)) { anterior = d; continue; }
      if (lim.avisarDomingosSeguidos !== false && anterior && diasEntre(anterior.data, d.data) === 7
          && semAcento(anterior[campo]) === semAcento(pessoa)) {
        add('aviso', 'domingos-seguidos', `${pessoa} ${nome} em domingos seguidos: ${diaMes(anterior.data)} e ${diaMes(d.data)}.`, d.data);
      }
      const chave = `${semAcento(pessoa)}|${chaveMes(d.data)}`;
      porMes.set(chave, [...(porMes.get(chave) ?? []), d]);
      if (ehProlongado(d, base, config)) add('aviso', 'feriadao', `${pessoa} ${nome} em ${formatarData(d.data)}, fim de semana prolongado (${d.feriado || 'ver Datas especiais'}).`, d.data);
      anterior = d;
    }
    if (max) {
      for (const lista of porMes.values()) {
        if (lista.length > max) add('aviso', 'limite-mensal', `${lista[0][campo]} ${nome} ${lista.length} vezes em ${nomeMes(chaveMes(lista[0].data))} (limite: ${max}).`, lista.at(-1).data);
      }
    }
  }

  const ordem = (x) => NIVEIS.indexOf(x.nivel);
  return p.sort((a, b) => ordem(a) - ordem(b) || (a.data ?? '').localeCompare(b.data ?? ''));
}

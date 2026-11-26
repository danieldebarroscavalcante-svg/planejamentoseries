import {
  ACENTOS, PADRAO, PREDEFINICOES, ZONAS, apagarEscolhas, gravarEscolhas, lerEscolhas, mesclar,
} from '../aparencia.js';
import { copiar, esc } from '../ui.js';

export const titulo = 'Aparência';
export const semAnimacao = true;

// Cores das miniaturas das predefinições.
const ESC = { fundo: '#000', cartao: '#2A2A2D', topo: '#1D1D1F' };
const CLA = { fundo: '#F5F5F7', cartao: '#FFFFFF', topo: '#E8E8ED' };

function miniatura(v) {
  const pagina = v.tema === 'claro' ? CLA : ESC;
  const zona = (z) => (v.zonas?.[z] === 'claro' ? CLA : v.zonas?.[z] === 'escuro' ? ESC : pagina);
  if (v.tema === 'auto') {
    return `<span class="miniatura" style="background:linear-gradient(135deg,${CLA.fundo} 50%,${ESC.fundo} 50%)"><i></i><i></i><i></i></span>`;
  }
  return `<span class="miniatura" style="background:${pagina.fundo}">
    <i style="background:${zona('topo').topo}"></i>
    <i style="background:${zona('destaque').fundo};box-shadow:inset 0 0 0 1px rgb(128 128 128 / .25)"></i>
    <i><b style="background:${zona('cartoes').cartao}"></b><b style="background:${zona('cartoes').cartao}"></b></i></span>`;
}

const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function segmentado(nome, opcoes, atual) {
  return `<div class="alternar" role="group">${opcoes.map(([valor, rotulo]) =>
    `<button type="button" data-campo="${nome}" data-valor="${esc(valor)}" aria-pressed="${String(valor) === String(atual)}">${esc(rotulo)}</button>`).join('')}</div>`;
}

function interruptor(nome, ligado, rotulo) {
  return `<label class="interruptor"><input type="checkbox" data-campo="${nome}" ${ligado ? 'checked' : ''} aria-label="${esc(rotulo)}"><span></span></label>`;
}

const linha = (rotulo, ajuda, controle) =>
  `<div class="ap-linha"><div class="ap-rotulo">${rotulo}${ajuda ? `<small>${ajuda}</small>` : ''}</div>${controle}</div>`;

function previa(ctx) {
  const d = ctx.base.domingos.find((x) => x.data >= ctx.hoje && !x.semMinistracao) ?? ctx.base.domingos.find((x) => !x.semMinistracao);
  if (!d) return '';
  const cor = ctx.config.series.find((s) => d.serie.startsWith(s.prefixo))?.cor ?? '#6B7280';
  return `<div class="previa" aria-label="Prévia">
    <div class="heroi" style="--cor:${esc(cor)}">
      <p class="sobretitulo">Prévia · próximo domingo</p>
      <p class="heroi-titulo">${esc(d.data.split('-').reverse().slice(0, 2).join('/'))}</p>
      <p class="heroi-texto gradiente">${esc(d.texto)}</p>
      <p class="heroi-tema">${esc(d.tema)}</p>
      <div class="botoes" style="margin-top:0"><span class="botao">Botão</span><span class="botao botao-secundario">Outro</span></div>
    </div>
    <div class="previa-corpo">
      <div class="contadores" style="margin:0"><div class="contador"><strong>12</strong><span>exemplo de número</span></div><div class="contador tom-alerta"><strong>3</strong><span>exemplo de alerta</span></div></div>
    </div>
  </div>`;
}

export function render(ctx) {
  const p = ctx.prefs;
  const escolhas = lerEscolhas();
  const atual = { tema: p.tema, zonas: p.zonas };
  const predefs = PREDEFINICOES.map((x) => `<button type="button" class="predef" data-predef="${x.id}" aria-pressed="${igual(mesclar(PADRAO.zonas, x.valores.zonas), atual.zonas) && x.valores.tema === atual.tema}">
      ${miniatura(x.valores)}<strong>${esc(x.nome)}</strong><small>${esc(x.descricao)}</small></button>`).join('');

  const zonas = ZONAS.map((z) => linha(esc(z.nome), '', segmentado(`zonas.${z.id}`, [['pagina', 'Igual à página'], ['claro', 'Claro'], ['escuro', 'Escuro']], p.zonas[z.id]))).join('');

  const acentoPronto = ACENTOS.some(([c]) => c.toLowerCase() === p.acento.toLowerCase());
  const acentos = ACENTOS.map(([c, nome]) => `<button type="button" class="cor" style="background:${c}" data-campo="acento" data-valor="${c}" aria-pressed="${c.toLowerCase() === p.acento.toLowerCase()}" aria-label="${nome}" title="${nome}"></button>`).join('')
    + `<input type="color" class="cor-livre" data-campo="acento" value="${esc(p.acento)}" aria-label="Escolher outra cor" title="Outra cor${acentoPronto ? '' : ' (em uso)'}">`;

  const original = ctx.configOriginal.series ?? [];
  const coresSeries = original.filter((s) => s.mensagens || s.prefixo).map((s) => {
    const cor = p.coresSeries?.[s.prefixo] || s.cor;
    const mudou = p.coresSeries?.[s.prefixo] && p.coresSeries[s.prefixo] !== s.cor;
    return linha(esc(s.curto), mudou ? `Padrão do site: ${esc(s.cor)}` : '',
      `<span class="serie-cor"><span class="chip" style="--cor:${esc(cor)}">${esc(s.curto)}</span>
        <input type="color" class="cor-livre" data-serie="${esc(s.prefixo)}" value="${esc(cor)}" aria-label="Cor da série ${esc(s.curto)}">
        ${mudou ? `<button type="button" class="link" data-serie-padrao="${esc(s.prefixo)}">Voltar ao padrão</button>` : ''}</span>`);
  }).join('');

  const qtd = [2, 3, 4, 5, 6, 8].map((n) => [n, String(n)]);
  return `
    <h1>Aparência</h1>
    ${previa(ctx)}

    <section class="cartao ap-secao">
      <h2>Estilo rápido</h2>
      <p class="mudo">Escolha um ponto de partida. Depois ajuste cada detalhe abaixo.</p>
      <div class="predefinicoes">${predefs}</div>
    </section>

    <section class="cartao ap-secao">
      <h2>Claro e escuro</h2>
      <p class="mudo">Defina o fundo da página e, se quiser, deixe partes do site com o fundo oposto para misturar claro e escuro.</p>
      ${linha('Fundo da página', 'Automático segue o modo claro/escuro do celular ou computador.', segmentado('tema', [['escuro', 'Escuro'], ['claro', 'Claro'], ['auto', 'Automático']], p.tema))}
      ${zonas}
    </section>

    <section class="cartao ap-secao">
      <h2>Cores</h2>
      <p class="mudo">A cor de destaque é usada em botões e links. As cores das séries aparecem nos selos, no calendário e nas barras de progresso.</p>
      ${linha('Cor de destaque', '', `<div class="cores">${acentos}</div>`)}
      ${coresSeries}
    </section>

    <section class="cartao ap-secao">
      <h2>Texto</h2>
      ${linha('Tamanho do texto', '', segmentado('tamanho', [[0.9, 'Pequeno'], [1, 'Normal'], [1.12, 'Grande'], [1.25, 'Muito grande']], p.tamanho))}
      ${linha('Fonte', 'A "Padrão" usa a fonte do iPhone/Mac e a Inter nos demais aparelhos. "Do aparelho" não baixa nada da internet.',
        `<label class="campo" style="min-width:220px"><select data-campo="fonte">
          ${[['padrao', 'Padrão'], ['inter', 'Inter'], ['sistema', 'Do aparelho'], ['serifa', 'Clássica (com serifa)']].map(([v, r]) => `<option value="${v}"${p.fonte === v ? ' selected' : ''}>${r}</option>`).join('')}
        </select></label>`)}
    </section>

    <section class="cartao ap-secao">
      <h2>Formas e efeitos</h2>
      ${linha('Cantos', '', segmentado('cantos', [['arredondados', 'Arredondados'], ['suaves', 'Suaves'], ['retos', 'Retos']], p.cantos))}
      ${linha('Espaçamento', '', segmentado('densidade', [['confortavel', 'Confortável'], ['compacta', 'Compacto']], p.densidade))}
      ${linha('Animações ao rolar', 'Blocos surgem suavemente.', interruptor('animacoes', p.animacoes, 'Animações'))}
      ${linha('Títulos em degradê', '', interruptor('degrade', p.degrade, 'Títulos em degradê'))}
      ${linha('Menu translúcido', 'Efeito de vidro desfocado no topo.', interruptor('vidro', p.vidro, 'Menu translúcido'))}
    </section>

    <section class="cartao ap-secao">
      <h2>Painel e início</h2>
      ${linha('Abrir o site em', '', `<label class="campo" style="min-width:220px"><select data-campo="inicio">
        ${[['painel', 'Painel'], ['cronograma', 'Cronograma (lista)'], ['calendario', 'Cronograma (calendário)'], ['series', 'Séries'], ['equipe', 'Equipe']].map(([v, r]) => `<option value="${v}"${p.inicio === v ? ' selected' : ''}>${r}</option>`).join('')}
      </select></label>`)}
      ${linha('Mostrar “Em números”', '', interruptor('painel.numeros', p.painel.numeros, 'Mostrar Em números'))}
      ${linha('Mostrar “Próximos domingos”', '', interruptor('painel.proximos', p.painel.proximos, 'Mostrar Próximos domingos'))}
      ${linha('Quantos próximos domingos', '', segmentado('painel.quantidadeProximos', qtd, p.painel.quantidadeProximos))}
      ${linha('Mostrar “Séries”', '', interruptor('painel.series', p.painel.series, 'Mostrar Séries'))}
      ${linha('Mostrar “Pendências”', '', interruptor('painel.pendencias', p.painel.pendencias, 'Mostrar Pendências'))}
    </section>

    <section class="cartao ap-secao">
      <h2>Salvar e compartilhar</h2>
      <p class="mudo">Suas escolhas ficam salvas só neste aparelho${Object.keys(escolhas).length ? '' : ' (por enquanto você está usando o padrão do site)'}.
        Para que virem o padrão de todos, use “Copiar como padrão do site” e cole no arquivo <code>config.json</code>, no item <code>"aparencia"</code> (o README explica).</p>
      <div class="ap-acoes">
        <button type="button" class="botao" data-acao="copiar-config">Copiar como padrão do site</button>
        <button type="button" class="botao botao-secundario" data-acao="restaurar">Restaurar padrão</button>
      </div>
    </section>`;
}

function definir(obj, caminho, valor) {
  const partes = caminho.split('.');
  let alvo = obj;
  for (const p of partes.slice(0, -1)) alvo = alvo[p] = { ...(alvo[p] ?? {}) };
  alvo[partes.at(-1)] = valor;
}

function converter(campo, valor) {
  if (campo === 'tamanho') return Number(valor);
  if (campo === 'painel.quantidadeProximos') return Number(valor);
  return valor;
}

export function ligar(ctx, raiz) {
  const mudar = (fn) => {
    const escolhas = lerEscolhas();
    fn(escolhas);
    gravarEscolhas(escolhas);
    ctx.aoMudarAparencia();
  };

  raiz.addEventListener('click', (e) => {
    const alvo = e.target.closest('button');
    if (!alvo) return;
    if (alvo.dataset.predef) {
      const x = PREDEFINICOES.find((p) => p.id === alvo.dataset.predef);
      mudar((es) => { es.tema = x.valores.tema; es.zonas = { ...x.valores.zonas }; });
    } else if (alvo.dataset.campo) {
      mudar((es) => definir(es, alvo.dataset.campo, converter(alvo.dataset.campo, alvo.dataset.valor)));
    } else if (alvo.dataset.seriePadrao) {
      mudar((es) => { if (es.coresSeries) delete es.coresSeries[alvo.dataset.seriePadrao]; });
    } else if (alvo.dataset.acao === 'restaurar') {
      apagarEscolhas();
      ctx.aoMudarAparencia();
    } else if (alvo.dataset.acao === 'copiar-config') {
      const { coresSeries, ...resto } = ctx.prefs;
      const json = JSON.stringify({ aparencia: { ...resto, ...(Object.keys(coresSeries ?? {}).length ? { coresSeries } : {}) } }, null, 2);
      copiar(json, 'Configuração copiada. Cole no config.json.');
    }
  });

  raiz.addEventListener('change', (e) => {
    const el = e.target;
    if (el.dataset.serie) {
      mudar((es) => { es.coresSeries = { ...(es.coresSeries ?? {}), [el.dataset.serie]: el.value.toUpperCase() }; });
    } else if (el.dataset.campo) {
      const valor = el.type === 'checkbox' ? el.checked : el.type === 'color' ? el.value.toUpperCase() : el.value;
      mudar((es) => definir(es, el.dataset.campo, converter(el.dataset.campo, valor)));
    }
  });
}

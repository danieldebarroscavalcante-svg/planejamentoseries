# Ministrações 2027

Sistema gratuito para planejar e acompanhar as ministrações de domingo da igreja.

**Site:** https://danieldebarroscavalcante-svg.github.io/planejamentoseries/

A liderança edita uma **planilha do Google** e o **site** mostra a escala. Uma **rotina automática** do GitHub confere tudo todo dia, avisa as pendências por e-mail e mantém agendas que podem ser adicionadas ao celular. Custo: zero.

## Sumário

1. [Como funciona](#1-como-funciona)
2. [O que é público e o que é privado](#2-o-que-é-público-e-o-que-é-privado)
3. [Como editar a escala](#3-como-editar-a-escala)
4. [Como remanejar](#4-como-remanejar)
5. [Como cadastrar o livro do Antigo Testamento](#5-como-cadastrar-o-livro-do-antigo-testamento)
6. [Pendências, alertas e e-mails](#6-pendências-alertas-e-e-mails)
7. [Agenda no celular](#7-agenda-no-celular)
8. [Aparência do site](#8-aparência-do-site)
9. [Reaproveitar em um novo ano (2028)](#9-reaproveitar-em-um-novo-ano-2028)
10. [O arquivo config.json](#10-o-arquivo-configjson)
11. [Como editar um arquivo no GitHub](#11-como-editar-um-arquivo-no-github)
12. [Problemas comuns](#12-problemas-comuns)
13. [Para quem mexe no código](#13-para-quem-mexe-no-código)

Guias de instalação (feitos uma vez só): [preparar a planilha](docs/roteiro-google-sheets.md) · [colocar o site no ar](docs/publicacao.md)

---

## 1. Como funciona

```
 Planilha do Google  ──(publicada como CSV)──►  Site (GitHub Pages)
   (a liderança edita)                          lê a planilha toda vez que alguém abre
          │
          └──► Rotina diária do GitHub (06:17, horário de Brasília)
                 • confere as regras
                 • abre/atualiza a Issue de pendências (e-mail)
                 • gera as agendas .ics
                 • guarda a cópia de segurança dados/cronograma.json
                 • republica o site
```

- **Mudou a planilha?** O site mostra a mudança na próxima vez que for aberto. O Google pode levar até 5 minutos para atualizar o que publica.
- **Agendas e Issue** mudam na rotina diária. Para atualizar na hora, abra **Actions → Publicar o site → Run workflow → Run workflow**.
- **Google fora do ar?** O site e a rotina usam a **cópia de segurança** e avisam no rodapé do site.

## 2. O que é público e o que é privado

| Onde | Quem vê | O que pode ter |
|---|---|---|
| Site, CSVs publicados, agendas `.ics`, Issues, repositório | **Qualquer pessoa com o link** | Datas, textos, temas, **nomes** de preletor e saudação |
| Aba **Contatos** da planilha (não publicada) | Só quem edita a planilha | Telefone, e-mail |
| Edição da planilha | Só quem foi convidado como Editor | — |

**Regras de ouro:**
- Nunca escreva telefone ou e-mail fora da aba **Contatos**.
- Ao publicar a planilha, desmarque **"Documento inteiro"** e publique só Cronograma, Equipe e Datas especiais.
- Se alguém digitar um contato por engano numa aba pública, o site troca por "[contato removido]" e a Issue avisa. Mesmo assim, corrija a planilha: essa proteção é uma rede de segurança, não uma garantia.

## 3. Como editar a escala

Tudo é feito na **planilha do Google**, pelo navegador ou pelo app Planilhas no celular.

### Aba Cronograma (uma linha por domingo)

| Coluna | Como preencher |
|---|---|
| **Nº** | Número corrido das ministrações (1, 2, 3…). Deixe vazio no Retiro e em domingos sem ministração. |
| **Data** | dd/mm/aaaa. Sempre um domingo. |
| **Feriado / fim de semana prolongado** | Texto livre, ex.: "Carnaval (seg 08/02 e ter 09/02) — feriado prolongado". Aparece como selo no site. |
| **Texto** | Ex.: "Mt 5:17-48". Use "A definir" enquanto não souber. |
| **Tema da mensagem** | Na introdução de uma série, comece com "Introdução —". |
| **Preletor** / **Saudação** | **Só o nome**, escrito sempre do mesmo jeito ("Pr. João" e "João" seriam duas pessoas). Vazio ou "A definir" = pendente. |
| **Série** | Escolha no menu. O começo do nome identifica a cor e as regras da série (veja o [config.json](#10-o-arquivo-configjson)). |
| **Mensagem na série** | "X de Y", ex.: "5 de 26". Na Páscoa, "Especial". |
| **Status** | A definir · Planejado · Confirmado · Realizado · Remanejado · Sem ministração. |
| **Cumprimento profético / Eixo de identidade** | Texto livre. O site usa o rótulo certo para cada série. |
| **Observações** | Texto livre. |

**Fluxo sugerido de status:** *A definir* → *Planejado* (texto e tema definidos) → *Confirmado* (preletor confirmou) → *Realizado* (depois do domingo). Use **Remanejado** no domingo que recebeu uma mensagem trocada de data.

### Aba Equipe
Nome e função de cada pessoa, sem contatos. As pessoas também aparecem no site só por estarem no Cronograma; a aba Equipe serve para registrar a função e listar quem ainda não foi escalado.

### Aba Datas especiais
Feriados e datas comemorativas. A coluna **"Fim de semana prolongado"** (Sim/Não) define quem recebe o aviso de "escalado no feriadão".

## 4. Como remanejar

Cada linha da planilha é um domingo fixo. **Remanejar é mudar o conteúdo de linha, nunca as datas.**

**Trocar quem prega (ou faz a saudação):** troque os nomes nas linhas. Pronto.

**Trocar duas mensagens de lugar:** troque Texto, Tema, Mensagem na série e Cumprimento/Eixo entre as duas linhas e marque Status "Remanejado".

**Adiar uma mensagem (para abrir espaço para um domingo especial, por exemplo):**
Como a série seguinte já começa logo depois, adiar uma mensagem significa que **uma mensagem da série sai** (ou é juntada com outra). Decida qual antes de começar. O caso mais comum é juntar as duas últimas.
1. Se a mensagem que sai é a **última** da série, copie o texto e o tema dela para as Observações da penúltima, para não perder.
2. Selecione da coluna **Texto (D)** até **Observações (L)**, do domingo que vai ser adiado até o **penúltimo** domingo da série.
3. Recorte (Ctrl+X; no celular, segure e escolha *Recortar*), clique na célula **Texto** do domingo seguinte e cole (Ctrl+V). Tudo desce uma linha e a série continua terminando no mesmo domingo.
   Se no meio do caminho houver o Retiro ou outro domingo especial, faça em duas partes, pulando essa linha.
4. Preencha a linha que ficou vazia com o que vai acontecer nesse domingo. Para um especial, use uma Série que comece com "Especial", ex.: "Especial — Dia das Missões".
5. Confira **Preletor** e **Saudação**, que desceram junto. Ajuste se as pessoas estavam ligadas à data, e não à mensagem.
6. A série ficou com uma mensagem a menos. Troque o "Y" de "X de Y" em todas as linhas da série (ex.: "de 26" → "de 25") e diminua `mensagens` dessa série no `config.json`.

Errou? **Ctrl+Z** desfaz. Para voltar a uma versão antiga: **Arquivo → Histórico de versões**.

**Domingo sem ministração novo (ex.: evento especial):** Status "Sem ministração", Nº vazio, e diminua `domingosComMensagem` no `config.json` (veja a [seção 11](#11-como-editar-um-arquivo-no-github)).

**O sistema confere sozinho.** Depois de remanejar, abra o Painel do site e veja as **Pendências**. Ele aponta:
- sequência quebrada (ex.: "Mensagem 5 de 26" antes da 4);
- total errado em "X de Y";
- série com quantidade de domingos diferente da esperada;
- domingo faltando ou com data repetida;
- data que não é domingo;
- Retiro ou Páscoa fora do lugar;
- Nº fora de ordem.

Ajuste até a lista zerar.

## 5. Como cadastrar o livro do Antigo Testamento

**Caminho simples (sem mexer em nada no GitHub):**
1. Na aba **Cronograma**, nas 11 linhas de 10/10 a 19/12, troque a Série "Antigo Testamento — a definir" por um nome que **comece com "Antigo Testamento"**, ex.: `Antigo Testamento — Neemias: reconstruir`. Dica: **Editar → Localizar e substituir**.
2. Na aba **Dropdown options**, troque o mesmo texto, para o menu mostrar o nome novo.
3. Preencha **Texto**, **Tema** (o de 10/10 deve começar com "Introdução —") e **Cumprimento/Eixo**.
4. Mude o **Status** de "A definir" para "Planejado".

O site mantém a cor da série e as conferências continuam funcionando.

**Caminho completo (nome curto e rótulo próprio no site):** além dos passos acima, edite no `config.json` o item da série com `"prefixo": "Antigo Testamento"`:
```json
{ "prefixo": "Neemias", "curto": "Neemias", "cor": "#8A6A2F", "mensagens": 11, "rotuloEixo": "Eixo temático" }
```
Nesse caso, o nome da série na planilha deve **começar com "Neemias"**. O `prefixo` é sempre o começo do nome da série na planilha.

## 6. Pendências, alertas e e-mails

| Tipo | Exemplos | Onde aparece |
|---|---|---|
| 🔴 **Erro** | data duplicada, série com contagem errada, sequência quebrada, Retiro/Páscoa fora do lugar, contato digitado numa aba pública | Painel + Issue |
| 🟠 **Alerta** | domingo dos próximos 30 dias sem preletor ou sem saudação | Painel + Issue |
| ⚪ **Aviso** | mesma pessoa em domingos seguidos, acima do limite mensal, escalada em feriadão, status fora da lista, Nº fora de ordem | Painel + Issue (sem abrir Issue sozinho) |

**A Issue "Pendências da escala de ministrações":**
- **abre** quando surge um erro ou alerta, e o GitHub manda um e-mail;
- quando a lista muda, é **atualizada** com um comentário dizendo o que entrou e o que foi resolvido (novo e-mail);
- se nada mudou, a rotina não mexe, para não mandar e-mail repetido todo dia;
- **fecha sozinha** quando não sobra erro nem alerta.

Para mais pessoas receberem os e-mails, cada uma cria uma conta gratuita no GitHub, abre o repositório e clica em **Watch → All Activity**.

Limites (30 dias, 2 pregações por mês, 2 saudações por mês, domingos seguidos) ficam no [config.json](#10-o-arquivo-configjson).

## 7. Agenda no celular

Na tela **Equipe**, cada pessoa tem o botão **📅 Adicionar à agenda**, e há também a **Agenda geral** com todos os domingos.
- **Android / Google Agenda:** "Google Agenda". A agenda é assinada e se atualiza sozinha.
- **iPhone / Outlook:** "iPhone / Outlook (assinar)". Também se atualiza sozinha.
- **Baixar arquivo .ics:** importa uma vez; não se atualiza.

Os eventos são de **dia inteiro**. Para marcar com horário, coloque no `config.json`:
```json
"agenda": { "horario": "18:00", "duracaoMinutos": 120 }
```
O Google Agenda pode levar algumas horas para buscar atualizações das agendas assinadas.

## 8. Aparência do site

Toque no botão **◐** no topo do site. Dá para escolher:
- **Fundo:** escuro, claro, automático (segue o celular) ou **misto**, com topo, destaque, cartões e rodapé claros ou escuros, cada um separadamente;
- **Cores:** cor de destaque e cor de cada série;
- **Texto e formas:** fonte, tamanho do texto, cantos e espaçamento;
- **Efeitos:** animações, títulos em degradê e menu translúcido;
- **Painel:** quais seções aparecem, quantos próximos domingos e qual tela abre primeiro.

As escolhas ficam salvas **só no aparelho** de quem escolheu. Para tornar uma combinação o **padrão de todos**:
1. Na tela Aparência, toque em **"Copiar como padrão do site"**.
2. Abra o `config.json` no GitHub ([seção 11](#11-como-editar-um-arquivo-no-github)).
3. Troque o bloco `"aparencia": { ... }` pelo que foi copiado. Cuidado com as vírgulas.

## 9. Reaproveitar em um novo ano (2028)

O mesmo site e o mesmo repositório servem para todos os anos. Em dezembro:

**1. Gerar o cronograma em branco**
1. No GitHub, aba **Actions** → **Preparar novo ano** → **Run workflow** → digite `2028` → **Run workflow**.
2. Quando ficar verde, abra a execução e baixe **arquivos-novo-ano** no fim da página. Ele traz:
   - `Cronograma 2028.csv`: todos os domingos de 2028, só com a data;
   - `config-2028-sugestao.json`: o config.json pronto para ajustar;
   - `LEIA-ME.txt`: lembrete dos passos, com a data da Páscoa.

**2. Planilha de 2028**
1. Na planilha de 2027: **Arquivo → Fazer uma cópia** e dê o nome "Cronograma de Ministrações 2028".
2. Na cópia, abra a aba **Cronograma**, clique em **Arquivo → Importar → Fazer upload**, escolha `Cronograma 2028.csv` e marque **"Substituir página atual"**.
3. Apague os domingos fora do período, marque Retiro e especiais e preencha séries, textos e temas.
4. Atualize **Dropdown options** (séries do ano) e **Datas especiais** (feriados do ano).
5. Publique de novo as 3 abas (Passo 6 do [roteiro](docs/roteiro-google-sheets.md)). **Os links mudam:** a planilha é nova.

**3. config.json de 2028**
1. Abra o `config-2028-sugestao.json` baixado e ajuste:
   - em `fontes`, os 3 links novos;
   - em `estrutura`, primeiro e último domingo, quantos domingos têm mensagem e as datas fixas (Retiro, Páscoa…);
   - em `series`, as séries do ano.
2. Apague as linhas `_lembrete` e `_lembreteSeries`.
3. Cole o resultado no `config.json` do repositório ([seção 11](#11-como-editar-um-arquivo-no-github)).

**4. Guardar 2027 (opcional):** antes do passo 3, faça uma cópia de `dados/cronograma.json` como `dados/arquivo/cronograma-2027.json`, para ter o histórico.

Depois disso, a rotina diária volta a conferir tudo, agora para 2028.

## 10. O arquivo config.json

| Item | Para que serve |
|---|---|
| `ano`, `titulo` | Ano e nome mostrados no site e nas agendas |
| `fuso` | Fuso horário (America/Sao_Paulo) |
| `fontes.cronograma`, `fontes.equipe`, `fontes.datasEspeciais` | Links CSV publicados das 3 abas. Vazio = usa os arquivos de `dados/csv/` |
| `limites.diasAlerta` | Quantos dias à frente procurar domingo sem preletor/saudação (30) |
| `limites.pregacoesPorMes`, `limites.saudacoesPorMes` | Limite mensal por pessoa |
| `limites.avisarDomingosSeguidos` | `true`/`false` |
| `palavrasProlongado` | Palavras da coluna Feriado que indicam feriadão, usadas quando a data não está em Datas especiais |
| `statusValidos` | Valores aceitos na coluna Status |
| `estrutura.primeiroDomingo`, `ultimoDomingo` | Período do ano (aaaa-mm-dd) |
| `estrutura.domingosComMensagem` | Total esperado (49 em 2027) |
| `estrutura.datasFixas` | Datas obrigatórias: `data`, início do nome da `serie`, `descricao` |
| `series[]` | Uma por série: `prefixo` (começo do nome na planilha), `curto` (nome curto), `cor`, `mensagens` (quantidade esperada; `0` = não conferir, usado no Retiro e nos Especiais), `rotuloEixo` (rótulo da coluna K) |
| `aparencia` | Aparência padrão para todos (gerada pela tela Aparência) |
| `agenda` (opcional) | `horario` e `duracaoMinutos` dos eventos |

## 11. Como editar um arquivo no GitHub

1. Abra https://github.com/danieldebarroscavalcante-svg/planejamentoseries e clique no arquivo (ex.: `config.json`).
2. Clique no **lápis ✏️** (Edit this file), no canto direito.
3. Faça a alteração. Mantenha aspas, vírgulas e chaves: o formato é rígido.
4. Clique em **Commit changes…** e de novo em **Commit changes**.
5. A rotina roda sozinha e o site é republicado em 1 a 2 minutos. Se ela ficar vermelha na aba **Actions**, provavelmente faltou uma vírgula ou aspas. Use o histórico do arquivo (**History**) para ver o que mudou.

## 12. Problemas comuns

| Sintoma | O que fazer |
|---|---|
| Rodapé do site diz **"cópia de segurança"** | O site não conseguiu ler a planilha. Confira se as abas continuam publicadas e se os links do `config.json` estão certos. |
| Mudei a planilha e o site não mudou | Espere 5 minutos (cache do Google) e recarregue a página. |
| Agenda do celular desatualizada | Agendas assinadas atualizam em algumas horas. Para forçar, rode **Actions → Publicar o site → Run workflow**. |
| Não chegou e-mail da Issue | Confira em https://github.com/settings/notifications se **Watching → Email** está marcado. |
| Execução vermelha em **Actions** | Clique nela, veja o passo com ✖ e leia a mensagem. "Testar as regras" vermelho significa que alguém mexeu no código. |
| Aba **Actions** diz que a rotina foi pausada | O GitHub pausa rotinas após 60 dias sem atividade no repositório. Clique em **Enable workflow**. |
| Pessoa aparece duas vezes na Equipe | O nome está escrito de dois jeitos na planilha. Padronize. |

## 13. Para quem mexe no código

Site estático em HTML, CSS e JavaScript puros, sem etapa de compilação. A automação roda em Node.js 22+ e não usa dependências externas.

```
site/                 o site (index.html, css/, js/)
  js/nucleo/          regras e lógica compartilhadas entre o site e a automação
    modelo.js         lê os CSVs, reconhece colunas e oculta contatos
    regras.js         conferências (erros, alertas, avisos)
    agenda.js         gera os .ics
  js/telas/           uma tela por arquivo
  js/aparencia.js     preferências de aparência
scripts/
  automacao.mjs       rotina diária (snapshot, conferência, agendas, site, Issue)
  issue.mjs           abre/atualiza/fecha a Issue
  gerar-snapshot.mjs  gera dados/cronograma.json
  montar-site.mjs     monta a pasta _site/
  novo-ano.mjs        arquivos de partida de um novo ano
  xlsx_para_csv.py    conversão inicial do .xlsx (usada uma vez)
dados/
  cronograma.json     cópia de segurança (atualizada pela rotina)
  csv/                dados de 2027 no formato das abas (fonte usada sem links)
testes/               testes automáticos (npm test)
.github/workflows/    publicar.yml (diária) e novo-ano.yml
```

Comandos:
```bash
npm test
```
```bash
npm run automacao
```
```bash
cd _site && python3 -m http.server 8000
```
- `npm test` roda os testes.
- `npm run automacao` roda a rotina e mostra o texto da Issue (sem publicar nada).
- O terceiro comando abre o site em http://localhost:8000.
- No endereço do site, `?hoje=2027-03-20` simula outra data, ex.: `http://localhost:8000/?hoje=2027-03-20#/painel`.

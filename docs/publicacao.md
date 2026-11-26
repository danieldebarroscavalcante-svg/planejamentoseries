# Colocar o site no ar (uma vez só)

Tempo: 5 minutos. Tudo pelo navegador, em https://github.com/danieldebarroscavalcante-svg/planejamentoseries

## 1. Ligar o GitHub Pages

1. No repositório, clique em **Settings** (ícone de engrenagem, no alto).
2. No menu da esquerda, clique em **Pages**.
3. Em **Build and deployment**, no campo **Source**, escolha **GitHub Actions**.
4. Pronto. Não precisa clicar em mais nada nesta tela.

## 2. Levar o trabalho para o ramo principal (`main`)

O sistema foi construído num ramo de trabalho separado. Para publicar, ele precisa entrar no `main`:

1. Abra: https://github.com/danieldebarroscavalcante-svg/planejamentoseries/compare/main...claude/upbeat-ritchie-d99uq0
2. Clique no botão verde **Create pull request**. Na tela seguinte, clique de novo em **Create pull request**.
3. Espere uns segundos e clique em **Merge pull request** e depois em **Confirm merge**.

## 3. Acompanhar a primeira publicação

1. Clique na aba **Actions** do repositório.
2. Aparece uma execução chamada **Publicar o site**, com uma bolinha amarela, que significa "rodando".
3. Em 1 a 3 minutos ela fica com um ✔ verde. O site estará em:

   **https://danieldebarroscavalcante-svg.github.io/planejamentoseries/**

Se ficar com um ✖ vermelho, clique nela para ver o passo que falhou e me mande um print.

## 4. Receber as pendências por e-mail

- Quem é dono do repositório já "acompanha" (Watch) o repositório e recebe e-mail quando a Issue de pendências é aberta ou atualizada.
- Confira em https://github.com/settings/notifications: em **Watching**, a opção **Email** deve estar marcada.
- Outras pessoas da liderança podem criar uma conta gratuita no GitHub, abrir o repositório e clicar em **Watch → All Activity** para receber os mesmos e-mails.

## Como funciona depois

- **Todo dia, às 06:17 (horário de Brasília)**, e também a cada alteração no repositório, a rotina:
  - baixa a planilha;
  - confere as regras;
  - atualiza a cópia de segurança;
  - gera as agendas `.ics`;
  - republica o site;
  - abre, atualiza ou fecha a Issue **"Pendências da escala de ministrações"**.
- O **site lê a planilha na hora**, toda vez que alguém abre. As agendas e a Issue mudam na rodada diária. Para forçar uma rodada: **Actions → Publicar o site → Run workflow → Run workflow**.
- **Atenção:** o GitHub pausa rotinas agendadas de repositórios sem nenhuma atividade por 60 dias. Se isso acontecer, aparece um aviso na aba Actions com o botão **Enable workflow**. A própria rotina faz uma alteração sempre que a escala muda, o que normalmente evita a pausa.

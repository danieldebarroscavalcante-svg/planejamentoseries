# Roteiro: preparar e publicar a planilha no Google Sheets

Tempo estimado: 20 minutos. Você só precisa do navegador (de preferência no computador).

> **Antes de começar: o que fica público e o que não fica**
>
> | Aba | Publicada? | O que pode ter |
> |---|---|---|
> | Cronograma | ✅ Sim | Datas, textos, temas, **nomes** de preletor e saudação |
> | Equipe | ✅ Sim | **Só nome** e função. Nunca telefone ou e-mail |
> | Datas especiais | ✅ Sim | Feriados e datas comemorativas |
> | Contatos | ❌ **Nunca** | Telefone, e-mail |
> | Resumo, Dropdown options | ❌ Não | Ficam só para uso interno |
>
> Qualquer pessoa com o link de uma aba publicada consegue lê-la. Por isso, telefone e e-mail ficam **somente** na aba Contatos.
> O site também tem uma proteção extra que esconde automaticamente qualquer coisa que pareça telefone ou e-mail. Mas ela é uma rede de segurança, não uma garantia.

---

## Passo 1: Escolher a planilha

**Caminho A: usar a planilha que já existe no Google (recomendado)**

1. Abra a planilha "Cronograma de Ministrações 2027" no Google Planilhas.
2. Olhe ao lado do nome, no topo. Se aparecer uma etiqueta **.XLSX**, siga o Caminho B. Se não aparecer, siga para o Passo 2.

**Caminho B: criar uma planilha nova a partir do arquivo**

1. Acesse **drive.google.com**.
2. Clique em **+ Novo → Upload de arquivo** e escolha o `cronograma-2027.xlsx`.
3. Quando terminar o envio, dê dois cliques no arquivo.
4. No topo, clique em **Arquivo → Salvar como Planilhas Google**. Uma cópia "de verdade" do Google se abre numa nova aba.
5. Use essa cópia daqui em diante. O arquivo `.xlsx` pode ser apagado do Drive.

## Passo 2: Conferir idioma e fuso horário

1. Clique em **Arquivo → Configurações**.
2. Em **Localidade**, escolha **Brasil**.
3. Em **Fuso horário**, escolha **(GMT-03:00) São Paulo** ou **Horário de Brasília**.
4. Clique em **Salvar configurações**.

Isso garante que as datas saiam como dd/mm/aaaa.

## Passo 3: Criar a aba "Datas especiais"

O arquivo `Datas especiais.csv` foi montado **só com o que já estava na sua planilha**: a coluna de feriados, as datas comemorativas citadas nas Observações e o Retiro.

1. Baixe o arquivo `Datas especiais.csv`, que vou te enviar aqui na conversa. Ele também está no GitHub, na pasta `dados/csv`.
2. Na planilha, clique em **Arquivo → Importar**.
3. Clique na aba **Fazer upload** e arraste o arquivo `Datas especiais.csv`.
4. Na janela que aparece, configure:
   - **Local de importação:** *Inserir nova(s) página(s)*
   - **Tipo de separador:** *Detectar automaticamente*
   - **Converter texto em números, datas e fórmulas:** marcado
5. Clique em **Importar dados**.
6. Uma aba nova aparece embaixo. Clique nela com o botão direito, escolha **Renomear** e digite exatamente: `Datas especiais`

A coluna **"Fim de semana prolongado"** (Sim ou Não) é o que o site usa para avisar quando alguém está escalado num feriadão. Pode ajustar à vontade.

## Passo 4: Criar a aba "Contatos" (privada)

1. Clique no **+** no canto inferior esquerdo. Uma aba nova é criada.
2. Clique nela com o botão direito, escolha **Renomear** e digite: `Contatos`
3. Na linha 1, escreva os títulos:
   - A1 `Nome`
   - B1 `Telefone`
   - C1 `E-mail`
   - D1 `Observações`
4. Preencha quando quiser. **Esta aba nunca será publicada.**

## Passo 5: Preencher a aba Equipe

1. Na coluna **Nome**, escreva o nome de cada pessoa **exatamente como vai aparecer** nas colunas Preletor e Saudação do Cronograma. Por exemplo, "Pr. João" e "João" seriam vistos como duas pessoas diferentes.
2. Na coluna **Função / observações**, escreva só a função, como "Pastor" ou "Presbítero". **Nunca escreva contatos aqui.**
3. As colunas Pregações e Saudações continuam calculando sozinhas.

## Passo 6: Publicar as 3 abas como CSV

1. Clique em **Arquivo → Compartilhar → Publicar na Web**.
2. **Primeiro, e o mais importante:** clique em **Conteúdo publicado e configurações** para abrir essa parte da janela.
   - Na caixa que mostra **"Documento inteiro"**, clique e **desmarque "Documento inteiro"**.
   - Marque **somente**: ☑ Cronograma, ☑ Equipe e ☑ Datas especiais.
   - Confira que **Contatos, Resumo e Dropdown options estão desmarcadas**.
   - Deixe marcada a opção **"Republicar automaticamente quando houver alterações"**.
3. Agora, na parte de cima da janela (aba **Link**):
   - Na primeira caixa, escolha **Cronograma**.
   - Na segunda caixa, escolha **Valores separados por vírgula (.csv)**.
   - Clique em **Publicar** e confirme com **OK**.
   - Copie o link que aparece. Ele começa com `https://docs.google.com/spreadsheets/d/e/...` e termina com `output=csv`.
4. Sem fechar a janela, troque a primeira caixa para **Equipe**. O link muda; copie-o.
5. Troque para **Datas especiais** e copie o terceiro link.

## Passo 7: Testar a privacidade (2 minutos, não pule)

1. Abra uma **janela anônima** do navegador (Ctrl+Shift+N) e cole cada um dos 3 links. Deve aparecer, ou ser baixado, um texto com os dados da aba.
2. Agora teste que os Contatos **não** vazam:
   - Na planilha, clique na aba **Contatos**.
   - Olhe o endereço no topo do navegador. Ele termina com algo como `#gid=123456789`. Anote esse número.
   - Pegue o link do Cronograma e troque o número depois de `gid=` pelo número da aba Contatos.
   - Abra na janela anônima. **Tem que dar erro.** Se aparecerem os contatos, volte ao Passo 6, item 2.

## Passo 8: Compartilhamento para edição

O botão verde **Compartilhar**, no canto superior direito, controla **quem edita**. Isso é independente da publicação.

1. Em **Acesso geral**, deixe **Restrito**.
2. Adicione o e-mail de cada pessoa da liderança como **Editor**.

## Passo 9: Me envie os 3 links

Cole os 3 links aqui na conversa, dizendo qual é de qual aba. Eles não são segredo, porque já são públicos. Eu coloco os links no `config.json` e o site passa a ler da planilha.

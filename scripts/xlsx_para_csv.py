"""Converte a planilha .xlsx nos CSVs no formato das abas do Google Sheets.

Uso (uma vez, para montar a base inicial):
    pip install openpyxl
    python3 scripts/xlsx_para_csv.py dados/cronograma-2027.xlsx dados/csv

Gera, na pasta de saída:
    Cronograma.csv       – cópia fiel da aba Cronograma (datas em dd/mm/aaaa)
    Equipe.csv           – nomes e funções da aba Equipe (sem contatos)
    Datas especiais.csv  – montada SOMENTE a partir da própria planilha:
                           coluna "Feriado / fim de semana prolongado",
                           datas comemorativas citadas em "Observações"
                           e o domingo de Retiro.

Nenhum dado é inventado: o que não está na planilha não aparece aqui.
"""

import csv
import datetime as dt
import os
import sys

import openpyxl

# Palavras que, no texto do feriado, indicam fim de semana prolongado.
# (Tiradentes "no meio da semana" fica de fora de propósito.)
PALAVRAS_PROLONGADO = ("prolongado", "emenda", "fim de semana com feriado")

# Datas comemorativas procuradas na coluna Observações.
COMEMORATIVAS = ("Dia das Mães", "Dia dos Pais", "Pentecostes", "Dia da Reforma", "Advento", "Natal")

CABECALHO_DATAS = ["Data", "Tipo", "Descrição", "Fim de semana prolongado"]


def texto(valor):
    if valor is None:
        return ""
    if isinstance(valor, (dt.datetime, dt.date)):
        return valor.strftime("%d/%m/%Y")
    if isinstance(valor, float) and valor.is_integer():
        return str(int(valor))
    return str(valor).strip()


def linhas_da_aba(ws):
    linhas = []
    for linha in ws.iter_rows(values_only=True):
        valores = [texto(v) for v in linha]
        if any(valores):
            linhas.append(valores)
    return linhas


def gravar(caminho, linhas):
    with open(caminho, "w", newline="", encoding="utf-8") as f:
        csv.writer(f, lineterminator="\n").writerows(linhas)
    print(f"  {caminho} ({len(linhas) - 1} linhas de dados)")


def datas_especiais(cronograma):
    cab = [c.lower() for c in cronograma[0]]
    i_data = cab.index("data")
    i_feriado = next(i for i, c in enumerate(cab) if c.startswith("feriado"))
    i_serie = cab.index("série")
    i_obs = next(i for i, c in enumerate(cab) if c.startswith("observ"))

    saida = [CABECALHO_DATAS]
    for linha in cronograma[1:]:
        data, feriado, serie, obs = linha[i_data], linha[i_feriado], linha[i_serie], linha[i_obs]
        if serie.lower() == "retiro":
            saida.append([data, "Retiro", obs or "Retiro", "Não"])
        if feriado:
            prolongado = any(p in feriado.lower() for p in PALAVRAS_PROLONGADO)
            saida.append([data, "Feriado", feriado, "Sim" if prolongado else "Não"])
        for trecho in (t.strip() for t in obs.split("·")):
            if any(c.lower() in trecho.lower() for c in COMEMORATIVAS):
                saida.append([data, "Data comemorativa", trecho, "Não"])
    return saida


def main(origem, destino):
    wb = openpyxl.load_workbook(origem, data_only=False)
    os.makedirs(destino, exist_ok=True)
    print(f"Lendo {origem}")

    cronograma = linhas_da_aba(wb["Cronograma"])
    gravar(os.path.join(destino, "Cronograma.csv"), cronograma)

    # Equipe: só Nome e Função. As colunas de contagem são fórmulas da planilha
    # (o site recalcula), e contatos NUNCA entram aqui.
    equipe = [["Nome", "Pregações", "Saudações", "Função / observações"]]
    if "Equipe" in wb.sheetnames:
        for linha in linhas_da_aba(wb["Equipe"])[1:]:
            if linha[0]:
                equipe.append([linha[0], "", "", linha[3] if len(linha) > 3 else ""])
    gravar(os.path.join(destino, "Equipe.csv"), equipe)

    gravar(os.path.join(destino, "Datas especiais.csv"), datas_especiais(cronograma))


if __name__ == "__main__":
    if len(sys.argv) != 3:
        sys.exit("Uso: python3 scripts/xlsx_para_csv.py <planilha.xlsx> <pasta-de-saida>")
    main(sys.argv[1], sys.argv[2])

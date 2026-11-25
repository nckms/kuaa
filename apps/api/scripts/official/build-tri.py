"""Gera prisma/official/tri.json a partir dos ITENS_PROVA_<ano>.csv dos microdados do ENEM (INEP).

Uso: python3 scripts/official/build-tri.py <pasta com os ITENS_PROVA_*.csv>

Para cada ano e área, acha o caderno (CO_PROVA) cuja sequência de gabaritos casa com a do banco
(enem.json, numeração do caderno azul) e grava, por questão do banco:
  - params: [a, b, c, área] da TRI (modelo de 3 parâmetros do INEP);
  - keyFixes: questões em que o gabarito da transcrição difere do gabarito oficial do INEP;
  - annulled: questões anuladas pelo INEP (gabarito X).
Os arquivos do INEP não vão para o Git (são públicos e grandes); só o resultado.
"""
import csv, collections, glob, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ENEM = os.path.join(HERE, '..', '..', 'prisma', 'official', 'enem.json')
OUT = os.path.join(HERE, '..', '..', 'prisma', 'official', 'tri.json')
LANG = {'0': 'ingles', '1': 'espanhol'}
# nota = a + b * theta (EAP, priori N(0,1), D = 1). Ajustado com 3 mil participantes reais do ENEM 2023:
# diferença média de 0,1 a 1,8 ponto para a nota oficial; quem não acerta nenhuma recebe 0.
SCALE = {'CN': [501.14, 113.11], 'CH': [501.49, 112.31], 'LC': [499.98, 108.09], 'MT': [500.02, 129.65]}

def num(v):
    return float(v.replace(',', '.'))

def mappings(items):
    for off in (0, 45, 90, 135, -45, -90, -135):
        yield lambda i, off=off: (int(i['CO_POSICAO']) + off, LANG.get(i.get('TP_LINGUA', ''), ''))
    if max(int(i['CO_POSICAO']) for i in items) == 50:  # 2017: LC 1-5 inglês, 6-10 espanhol, depois comuns
        def lc50(i):
            p = int(i['CO_POSICAO']); l = LANG.get(i.get('TP_LINGUA', ''), '')
            return (p, l) if p <= 5 else (p - 5, l) if p <= 10 else (p - 5, '')
        yield lc50

def main(folder):
    qs = json.load(open(ENEM, encoding='utf-8'))['questions']
    ours = collections.defaultdict(dict)
    for q in qs:
        letter = next(o['id'] for o in q['options'] if o.get('isCorrect'))
        ours[int(q['year'])][(int(q['number']), q.get('language') or '')] = (letter, q['id'])
    params, fixes, annulled, report = {}, {}, [], []
    for f in sorted(glob.glob(os.path.join(folder, '*.csv'))):
        m = re.search(r'itens_prova_(\d{4})', os.path.basename(f), re.I)
        if not m: continue
        y = int(m.group(1))
        provas = collections.defaultdict(list)
        for i in csv.DictReader(open(f, encoding='latin-1'), delimiter=';'):
            provas[i['CO_PROVA']].append(i)
        best = {}
        for p, items in provas.items():
            area = items[0]['SG_AREA']
            for fn in mappings(items):
                hit = tot = 0
                for i in items:
                    k = fn(i)
                    if k in ours[y] and i['TX_GABARITO'] != 'X':
                        tot += 1; hit += ours[y][k][0] == i['TX_GABARITO']
                if tot >= 30 and (area not in best or (hit / tot, tot) > best[area][0]):
                    best[area] = ((hit / tot, tot), fn, items)
        for area, ((rate, tot), fn, items) in best.items():
            report.append(f'{y} {area}: {rate:.3f} de {tot}')
            for i in items:
                k = fn(i)
                if k not in ours[y]: continue
                letter, qid = ours[y][k]
                if i['TX_GABARITO'] == 'X':
                    annulled.append(qid); continue
                # Item abandonado na calibração continua válido para o aluno; só não entra no cálculo da nota.
                if i.get('IN_ITEM_ABAN') == '1' or not i['NU_PARAM_A']: continue
                params[qid] = [num(i['NU_PARAM_A']), num(i['NU_PARAM_B']), num(i['NU_PARAM_C']), area]
                if letter != i['TX_GABARITO']: fixes[qid] = i['TX_GABARITO']
    json.dump({'source': 'Microdados do ENEM (INEP), ITENS_PROVA 2009–2023', 'scale': SCALE, 'params': params,
               'keyFixes': fixes, 'annulled': sorted(set(annulled))}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('\n'.join(report))
    print(f'{len(params)} itens com parâmetros, {len(fixes)} gabaritos corrigidos, {len(set(annulled))} anuladas')

if __name__ == '__main__':
    main(sys.argv[1])

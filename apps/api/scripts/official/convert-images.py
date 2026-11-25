"""Converte as imagens das questões do ENEM (base enem.dev) para WebP leve.

Uso: python3 scripts/official/convert-images.py <repo enem-api> <saída apps/web/public/question-media/enem>
Só questões com exatamente uma imagem e alternativas em texto (o formato que o app exibe).
Requer Pillow. Largura máxima 900 px, qualidade 72 (≈12 KB por imagem).
"""
import glob, json, os, re, sys
from PIL import Image

repo, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
count = 0
for f in glob.glob(os.path.join(repo, 'public/*/questions/*/details.json')):
    q = json.load(open(f))
    if any(a.get('file') for a in q['alternatives']):
        continue
    refs = set(re.findall(r'!\[[^\]]*\]\(([^)]+)\)', q.get('context') or '')) | set(q.get('files') or [])
    if len(refs) != 1:
        continue
    m = re.match(r'https://enem\.dev/(\d{4}/questions/[^/]+/.+)$', refs.pop())
    if not m or not os.path.exists(os.path.join(repo, 'public', m.group(1))):
        continue
    lang = {'ingles': 'ing', 'espanhol': 'esp'}.get(q.get('language') or '', '')
    qid = f"cofenem{q['year']}q{int(q['index']):03d}{lang}"
    im = Image.open(os.path.join(repo, 'public', m.group(1)))
    if im.mode in ('P', 'LA', 'RGBA'):
        im = im.convert('RGBA'); bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[-1]); im = bg
    else:
        im = im.convert('RGB')
    if im.width > 900:
        im = im.resize((900, round(im.height * 900 / im.width)), Image.LANCZOS)
    im.save(os.path.join(out, f'{qid}.webp'), 'WEBP', quality=72, method=6)
    count += 1
print(count, 'imagens')

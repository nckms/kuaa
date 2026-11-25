"""Converte as figuras das questões do ENEM (base enem.dev) para WebP leve.

Uso: python3 scripts/official/convert-images.py <repo enem-api> <saída apps/web/public/question-media/enem>

Cada questão vira UMA figura (o app mostra uma por questão):
- uma figura no enunciado: convertida como está;
- várias figuras: empilhadas na ordem em que aparecem;
- alternativas em imagem: painéis "A)", "B)"... abaixo das figuras do enunciado.
Requer Pillow e a fonte DejaVu Sans Bold. Largura máxima 900 px, qualidade 72.
"""
import glob, json, os, re, sys
from PIL import Image, ImageDraw, ImageFont

repo, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 30)
WIDTH, GAP = 900, 24


def load(url):
    m = re.match(r'https://enem\.dev/(\d{4}/questions/[^/]+/.+)$', url)
    path = m and os.path.join(repo, 'public', m.group(1))
    if not path or not os.path.exists(path):
        return None
    im = Image.open(path)
    if im.mode in ('P', 'LA', 'RGBA'):
        im = im.convert('RGBA'); bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[-1]); im = bg
    else:
        im = im.convert('RGB')
    if im.width > WIDTH:
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
    return im


def label(im, letter):
    """Painel de alternativa: letra à esquerda, imagem à direita."""
    pad = 70
    panel = Image.new('RGB', (min(WIDTH, im.width + pad), im.height if im.height > 44 else 44), (255, 255, 255))
    if im.width + pad > WIDTH:
        im = im.resize((WIDTH - pad, round(im.height * (WIDTH - pad) / im.width)), Image.LANCZOS)
        panel = Image.new('RGB', (WIDTH, max(im.height, 44)), (255, 255, 255))
    panel.paste(im, (pad, 0))
    ImageDraw.Draw(panel).text((8, max(0, panel.height // 2 - 18)), f'{letter})', fill=(20, 20, 20), font=FONT)
    return panel


def stack(images):
    width = max(i.width for i in images)
    height = sum(i.height for i in images) + GAP * (len(images) - 1)
    canvas = Image.new('RGB', (width, height), (255, 255, 255))
    y = 0
    for i in images:
        canvas.paste(i, (0, y)); y += i.height + GAP
    return canvas


count = 0
for f in glob.glob(os.path.join(repo, 'public/*/questions/*/details.json')):
    q = json.load(open(f))
    refs = list(dict.fromkeys(re.findall(r'!\[[^\]]*\]\(([^)]+)\)', q.get('context') or '') + (q.get('files') or [])))
    alt_files = [(a['letter'], a['file']) for a in q['alternatives'] if a.get('file')]
    if not refs and not alt_files:
        continue
    figures = [load(u) for u in refs]
    alternatives = [(letter, load(u)) for letter, u in alt_files]
    if any(i is None for i in figures) or any(i is None for _, i in alternatives):
        continue  # figura ausente na base: questão fica de fora
    parts = figures + [label(i, letter) for letter, i in alternatives]
    image = parts[0] if len(parts) == 1 else stack(parts)
    lang = {'ingles': 'ing', 'espanhol': 'esp'}.get(q.get('language') or '', '')
    qid = f"cofenem{q['year']}q{int(q['index']):03d}{lang}"
    image.save(os.path.join(out, f'{qid}.webp'), 'WEBP', quality=72, method=6)
    count += 1
print(count, 'figuras')

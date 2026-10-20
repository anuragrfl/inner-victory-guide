import math, io, os, sys
import cairosvg
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from content import DEVIS, VICES, NIDHIS, SIDDHIS

HERE = os.path.dirname(os.path.abspath(__file__))
FD = os.path.join(HERE, "..", "fonts") + "/"
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out")
os.makedirs(OUT, exist_ok=True)

W, H = 1080, 1350
GOLD = "#E9C878"
GOLD_RGB = (233, 200, 120)

def F(name, size): return ImageFont.truetype(FD + name + ".ttf", size)
SERIF_B = lambda s: F("cormorant-garamond-latin-700-normal", s)
SERIF_SB = lambda s: F("cormorant-garamond-latin-600-normal", s)
SERIF_I = lambda s: F("cormorant-garamond-latin-500-italic", s)
SANS = lambda s: F("inter-latin-400-normal", s)
SANS_M = lambda s: F("inter-latin-500-normal", s)
SANS_SB = lambda s: F("inter-latin-600-normal", s)
DEV = lambda s: F("noto-serif-devanagari-devanagari-700-normal", s)

def hex2rgb(h): h = h.lstrip("#"); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

# ---------- background ----------
def background(top, bottom, glow):
    t, b = hex2rgb(top), hex2rgb(bottom)
    col = Image.new("RGB", (1, H))
    for y in range(H):
        k = y / (H - 1)
        col.putpixel((0, y), tuple(int(t[i] + (b[i] - t[i]) * k) for i in range(3)))
    base = col.resize((W, H))
    g = Image.new("L", (W, H), 0)
    ImageDraw.Draw(g).ellipse([W/2-380, 120, W/2+380, 880], fill=150)
    g = g.filter(ImageFilter.GaussianBlur(160))
    glow_img = Image.new("RGB", (W, H), hex2rgb(glow))
    return Image.composite(glow_img, base, g)

def frame(d):
    d.rectangle([36, 36, W-36, H-36], outline=GOLD_RGB + (150,), width=2)
    d.rectangle([48, 48, W-48, H-48], outline=GOLD_RGB + (70,), width=1)
    for (x, y) in [(36, 36), (W-36, 36), (36, H-36), (W-36, H-36)]:
        d.regular_polygon((x, y, 11), 4, rotation=45, fill=GOLD_RGB)

def svg_png(svg, size=600):
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=size, output_height=size)
    return Image.open(io.BytesIO(png)).convert("RGBA")

def center(d, y, text, font, fill, spacing=0):
    if spacing:
        widths = [d.textlength(ch, font=font) for ch in text]
        total = sum(widths) + spacing * (len(text) - 1)
        x = (W - total) / 2
        for ch, w in zip(text, widths):
            d.text((x, y), ch, font=font, fill=fill); x += w + spacing
        return
    w = d.textlength(text, font=font)
    d.text(((W - w) / 2, y), text, font=font, fill=fill)

def wrap(d, text, font, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=font) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

def divider(d, y, color=GOLD_RGB):
    d.line([(W/2-150, y), (W/2-18, y)], fill=color, width=2)
    d.line([(W/2+18, y), (W/2+150, y)], fill=color, width=2)
    d.regular_polygon((W/2, y, 8), 4, rotation=45, fill=color)

# ---------- SVG helpers (600x600 canvas, centre 300,300) ----------
def svg(body, defs=""):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600"><defs>{defs}</defs>{body}</svg>'

def petal_ring(n, r_in, r_out, width_deg, stroke, fill, sw=3, rot=0):
    out = []
    for i in range(n):
        a = math.radians(rot + i * 360 / n)
        half = math.radians(width_deg / 2)
        x0, y0 = 300 + r_in * math.cos(a - half), 300 + r_in * math.sin(a - half)
        x1, y1 = 300 + r_in * math.cos(a + half), 300 + r_in * math.sin(a + half)
        tx, ty = 300 + r_out * math.cos(a), 300 + r_out * math.sin(a)
        c = r_out * 0.78
        c0x, c0y = 300 + c * math.cos(a - half * 1.15), 300 + c * math.sin(a - half * 1.15)
        c1x, c1y = 300 + c * math.cos(a + half * 1.15), 300 + c * math.sin(a + half * 1.15)
        out.append(f'<path d="M{x0:.1f},{y0:.1f} Q{c0x:.1f},{c0y:.1f} {tx:.1f},{ty:.1f} Q{c1x:.1f},{c1y:.1f} {x1:.1f},{y1:.1f} Z" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>')
    return "".join(out)

def rays(n, r1, r2, color, sw=2, op=0.6):
    return "".join(f'<line x1="{300+r1*math.cos(math.radians(i*360/n)):.1f}" y1="{300+r1*math.sin(math.radians(i*360/n)):.1f}" x2="{300+r2*math.cos(math.radians(i*360/n)):.1f}" y2="{300+r2*math.sin(math.radians(i*360/n)):.1f}" stroke="{color}" stroke-width="{sw}" opacity="{op}" stroke-linecap="round"/>' for i in range(n))

def poly(n, r, rot=-90):
    pts = [f"{300+r*math.cos(math.radians(rot+i*360/n)):.1f},{300+r*math.sin(math.radians(rot+i*360/n)):.1f}" for i in range(n)]
    return " ".join(pts)

# ---------- emblems ----------
def devi_emblem(dv, idx):
    c = dv["color"]; g = GOLD
    b = [f'<circle cx="300" cy="300" r="282" fill="none" stroke="{g}" stroke-width="1.5" opacity="0.5"/>',
         rays(72, 250, 278, g, 1.5, 0.45)]
    n = dv["petals"]
    if n == 1000:   # Sahasrara: thousand-petal crown, drawn as three dense rings
        b.append(petal_ring(48, 150, 245, 9, g, c + "55", 1.5))
        b.append(petal_ring(36, 125, 205, 11, g, c + "88", 1.5, rot=5))
        b.append(petal_ring(24, 100, 165, 15, g, c, 1.8, rot=7.5))
    elif n == 2:    # Ajna: two wide petals
        b.append(petal_ring(2, 95, 250, 70, g, c, 3, rot=0))
    else:
        if n >= 10: b.append(petal_ring(n, 140, 240, 360 / n * 0.95, g, c + "66", 2, rot=180 / n))
        b.append(petal_ring(n, 120, 225 if n < 10 else 205, 360 / n * 0.9, g, c, 3, rot=-90))
    b.append(f'<circle cx="300" cy="300" r="122" fill="#1a1230" stroke="{g}" stroke-width="3"/>')
    inner = dv["inner"]
    if inner == "square":
        b.append(f'<rect x="228" y="228" width="144" height="144" fill="none" stroke="{c}" stroke-width="5"/><polygon points="300,250 340,330 260,330" fill="{c}" opacity="0.85"/>')
    elif inner == "crescent":
        b.append(f'<path d="M230,300 A70,70 0 1,0 370,300 A70,52 0 1,1 230,300 Z" fill="{c}"/>')
    elif inner == "triangle":
        b.append(f'<polygon points="215,255 385,255 300,395" fill="none" stroke="{c}" stroke-width="6" stroke-linejoin="round"/>'
                 f'<path d="M262,226 A40,40 0 0,0 338,226 A40,30 0 0,1 262,226 Z" fill="{g}"/>'
                 f'<path d="M285,300 Q300,268 315,300 L320,318 L280,318 Z" fill="{g}"/><circle cx="300" cy="326" r="5" fill="{g}"/>')
    elif inner == "hexagram":
        b.append(f'<polygon points="{poly(3,82,-90)}" fill="none" stroke="{c}" stroke-width="5"/><polygon points="{poly(3,82,90)}" fill="none" stroke="{c}" stroke-width="5"/>'
                 f'<circle cx="300" cy="300" r="20" fill="{g}"/>' + rays(12, 30, 48, g, 3, 0.9))
    elif inner == "circle":
        b.append(f'<polygon points="{poly(3,92,90)}" fill="none" stroke="{g}" stroke-width="3" opacity="0.7"/><circle cx="300" cy="300" r="52" fill="{c}"/><circle cx="300" cy="300" r="70" fill="none" stroke="{c}" stroke-width="3"/>')
    elif inner == "eye":
        b.append(f'<path d="M205,300 Q300,225 395,300 Q300,375 205,300 Z" fill="none" stroke="{c}" stroke-width="6"/><circle cx="300" cy="300" r="32" fill="{c}"/><circle cx="300" cy="300" r="12" fill="{g}"/>')
    elif inner == "night":
        b.append(f'<circle cx="300" cy="300" r="95" fill="#0b0716"/>' + "".join(
            f'<circle cx="{300+70*math.cos(math.radians(a)):.1f}" cy="{300+70*math.sin(math.radians(a)):.1f}" r="{3 if a%60 else 5}" fill="{g}"/>' for a in range(0, 360, 30))
            + f'<path d="M300,252 Q322,288 300,348 Q278,288 300,252 Z" fill="{g}"/><path d="M300,282 Q310,300 300,330 Q290,300 300,282 Z" fill="#fff6d8"/>')
    elif inner == "moon":
        b.append(f'<circle cx="300" cy="300" r="70" fill="{c}"/><circle cx="330" cy="285" r="62" fill="#1a1230"/>'
                 f'<circle cx="300" cy="300" r="96" fill="none" stroke="{c}" stroke-width="2" opacity="0.7"/>')
    elif inner == "siddhi":
        b.append(petal_ring(8, 30, 95, 32, g, c, 2.5, rot=-90))
        b.append("".join(f'<circle cx="{300+108*math.cos(math.radians(-90+i*40)):.1f}" cy="{300+108*math.sin(math.radians(-90+i*40)):.1f}" r="7" fill="{g}"/>' for i in range(9)))
        b.append(f'<circle cx="300" cy="300" r="24" fill="{g}"/>')
    return svg("".join(b))

def vice_emblem(idx):
    g = GOLD; ember = "#E2563A"
    b = [f'<circle cx="300" cy="300" r="282" fill="none" stroke="{g}" stroke-width="1.5" opacity="0.4"/>']
    for i in range(10):
        a = -90 + i * 36
        cx, cy = 300 + 205 * math.cos(math.radians(a)), 300 + 205 * math.sin(math.radians(a))
        on = (i == idx)
        fill = ember if on else "#3a1c1c"
        stroke = "#ffd9a0" if on else g
        op = 1 if on else 0.55
        # small crowned head
        b.append(f'<g opacity="{op}"><circle cx="{cx:.1f}" cy="{cy:.1f}" r="{34 if on else 27}" fill="{fill}" stroke="{stroke}" stroke-width="{3 if on else 2}"/>'
                 f'<polygon points="{cx-18:.1f},{cy-24:.1f} {cx-10:.1f},{cy-44:.1f} {cx:.1f},{cy-30:.1f} {cx+10:.1f},{cy-44:.1f} {cx+18:.1f},{cy-24:.1f}" fill="{stroke}"/></g>')
        if on:
            b.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="52" fill="none" stroke="{ember}" stroke-width="2" opacity="0.7"/>')
    # central flame of Vijayadashami
    b.append(f'<circle cx="300" cy="300" r="118" fill="#1a0e0e" stroke="{g}" stroke-width="2.5"/>')
    b.append(f'<path d="M300,190 C350,250 370,290 345,345 C335,370 315,385 300,388 C285,385 265,370 255,345 C232,290 255,250 300,190 Z" fill="{ember}"/>')
    b.append(f'<path d="M300,250 C328,290 335,318 320,350 C313,365 306,372 300,374 C294,372 287,365 280,350 C266,318 274,290 300,250 Z" fill="#F5A04A"/>')
    b.append(f'<path d="M300,300 C314,322 316,340 306,358 C303,363 301,365 300,366 C299,365 297,363 294,358 C285,340 287,322 300,300 Z" fill="#FFE6A8"/>')
    return svg("".join(b))

def nidhi_emblem(idx):
    g = GOLD; teal = "#2FA39A"; deep = "#0f2b30"
    b = [f'<circle cx="300" cy="300" r="282" fill="none" stroke="{g}" stroke-width="1.5" opacity="0.45"/>',
         "".join(f'<circle cx="{300+266*math.cos(math.radians(-90+i*40)):.1f}" cy="{300+266*math.sin(math.radians(-90+i*40)):.1f}" r="{9 if i==idx else 5}" fill="{g}" opacity="{1 if i==idx else 0.5}"/>' for i in range(9)),
         f'<circle cx="300" cy="300" r="235" fill="{deep}" stroke="{g}" stroke-width="3"/>']
    s = ""
    if idx == 0:   # Padma: lotus over muddy water
        s += "".join(f'<path d="M150,{390+k*22} Q225,{375+k*22} 300,{390+k*22} T450,{390+k*22}" fill="none" stroke="{teal}" stroke-width="4" opacity="{0.9-k*0.25}"/>' for k in range(3))
        s += f'<path d="M300,180 C330,230 335,290 300,350 C265,290 270,230 300,180 Z" fill="#F4A6B8" stroke="{g}" stroke-width="3"/>'
        s += f'<path d="M300,350 C250,330 215,280 210,230 C255,245 290,290 300,350 Z" fill="#EC8FA6" stroke="{g}" stroke-width="3"/>'
        s += f'<path d="M300,350 C350,330 385,280 390,230 C345,245 310,290 300,350 Z" fill="#EC8FA6" stroke="{g}" stroke-width="3"/>'
        s += f'<path d="M300,352 C240,355 190,330 165,300 C215,300 265,320 300,352 Z" fill="#D9768F" stroke="{g}" stroke-width="3"/>'
        s += f'<path d="M300,352 C360,355 410,330 435,300 C385,300 335,320 300,352 Z" fill="#D9768F" stroke="{g}" stroke-width="3"/>'
    elif idx == 1:  # Mahapadma: great lotus radiating smaller blooms
        s += petal_ring(16, 70, 175, 20, g, "#F4A6B8", 2.5, rot=-90)
        s += petal_ring(8, 40, 120, 38, g, "#EC8FA6", 2.5, rot=-67.5)
        s += f'<circle cx="300" cy="300" r="34" fill="{g}"/>'
        s += "".join(f'<circle cx="{300+205*math.cos(math.radians(a)):.1f}" cy="{300+205*math.sin(math.radians(a)):.1f}" r="11" fill="#F4A6B8" stroke="{g}" stroke-width="2"/>' for a in range(0, 360, 45))
    elif idx == 2:  # Shankha: conch with spiral and sound waves
        s += f'<path d="M190,330 C190,230 280,175 360,200 C420,220 430,290 395,330 C370,360 330,380 300,420 C285,395 250,375 190,330 Z" fill="#F7EFE0" stroke="{g}" stroke-width="4"/>'
        pts = []
        for t in range(0, 720, 8):
            r = 8 + t * 0.085; a = math.radians(t)
            pts.append(f"{330+r*math.cos(a):.1f},{270+r*math.sin(a):.1f}")
        s += f'<polyline points="{" ".join(pts)}" fill="none" stroke="{g}" stroke-width="3.5"/>'
        s += "".join(f'<path d="M{150-k*22},{250+k*0} Q{120-k*22},{300} {150-k*22},{350}" fill="none" stroke="{teal}" stroke-width="4" opacity="{0.9-k*0.3}"/>' for k in range(3))
    elif idx == 3:  # Makara: guardian arch with curling wave
        s += f'<path d="M170,420 L170,260 Q170,170 300,170 Q430,170 430,260 L430,420" fill="none" stroke="{g}" stroke-width="6"/>'
        s += f'<path d="M190,400 Q230,330 290,350 Q340,365 330,320 Q320,280 270,290 Q300,250 350,270 Q410,300 395,360 Q380,410 300,410 Z" fill="{teal}" stroke="{g}" stroke-width="3"/>'
        s += f'<circle cx="352" cy="300" r="7" fill="{g}"/>'
        s += f'<path d="M150,440 Q190,420 230,440 T310,440 T390,440 T470,440" fill="none" stroke="{teal}" stroke-width="4"/>'
    elif idx == 4:  # Kachchhapa: tortoise, limbs drawn in
        s += f'<ellipse cx="300" cy="300" rx="150" ry="120" fill="#5E7D4C" stroke="{g}" stroke-width="4"/>'
        s += f'<polygon points="{" ".join(f"{300+52*math.cos(math.radians(30+i*60)):.1f},{300+52*math.sin(math.radians(30+i*60)):.1f}" for i in range(6))}" fill="none" stroke="{g}" stroke-width="3"/>'
        for a in range(30, 390, 60):
            x, y = 300 + 52 * math.cos(math.radians(a)), 300 + 52 * math.sin(math.radians(a))
            x2, y2 = 300 + 130 * math.cos(math.radians(a)) * 1.0, 300 + 105 * math.sin(math.radians(a))
            s += f'<line x1="{x:.1f}" y1="{y:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{g}" stroke-width="3"/>'
        s += f'<ellipse cx="300" cy="168" rx="30" ry="22" fill="#5E7D4C" stroke="{g}" stroke-width="3"/>'
        s += "".join(f'<ellipse cx="{x}" cy="{y}" rx="18" ry="12" fill="#5E7D4C" stroke="{g}" stroke-width="3"/>' for x, y in [(170, 230), (430, 230), (175, 380), (425, 380)])
    elif idx == 5:  # Mukunda: music — notes and veena-like curve
        s += f'<path d="M180,410 Q300,160 420,190" fill="none" stroke="{g}" stroke-width="5"/>'
        s += f'<circle cx="190" cy="400" r="48" fill="#C9864A" stroke="{g}" stroke-width="4"/><circle cx="420" cy="190" r="26" fill="#C9864A" stroke="{g}" stroke-width="3"/>'
        s += "".join(f'<line x1="{200+k*6}" y1="{392-k*4}" x2="{412+k*2}" y2="{184+k*6}" stroke="#F7EFE0" stroke-width="1.5" opacity="0.8"/>' for k in range(4))
        for (x, y) in [(330, 330), (390, 300)]:
            s += f'<ellipse cx="{x}" cy="{y}" rx="16" ry="12" fill="{teal}" transform="rotate(-20 {x} {y})"/><line x1="{x+14}" y1="{y-4}" x2="{x+14}" y2="{y-70}" stroke="{teal}" stroke-width="4"/>'
        s += f'<line x1="344" y1="260" x2="404" y2="230" stroke="{teal}" stroke-width="7"/>'
    elif idx == 6:  # Kunda: full kalash with leaves and coconut
        s += f'<path d="M220,260 Q200,330 230,380 Q260,420 300,420 Q340,420 370,380 Q400,330 380,260 Z" fill="#C9864A" stroke="{g}" stroke-width="4"/>'
        s += f'<rect x="240" y="236" width="120" height="28" rx="10" fill="#B0703A" stroke="{g}" stroke-width="3"/>'
        for ang in (-150, -120, -60, -30):
            a = math.radians(ang); tx, ty = 300 + 115 * math.cos(a), 236 + 115 * math.sin(a)
            p = math.radians(ang + 90); mx, my = 300 + 60 * math.cos(a), 236 + 60 * math.sin(a)
            s += (f'<path d="M300,236 Q{mx+22*math.cos(p):.1f},{my+22*math.sin(p):.1f} {tx:.1f},{ty:.1f} '
                  f'Q{mx-22*math.cos(p):.1f},{my-22*math.sin(p):.1f} 300,236 Z" fill="#4FB477" stroke="{g}" stroke-width="2.5"/>')
        s += f'<ellipse cx="300" cy="200" rx="40" ry="46" fill="#8A5A34" stroke="{g}" stroke-width="3"/>'
        s += f'<path d="M235,320 Q300,345 365,320" fill="none" stroke="{g}" stroke-width="3"/>' + "".join(f'<circle cx="{x}" cy="352" r="5" fill="{g}"/>' for x in (265, 300, 335))
    elif idx == 7:  # Neela: sky circle over ocean waves, with a blue drop
        s += f'<circle cx="300" cy="250" r="110" fill="#2E5FA8" stroke="{g}" stroke-width="3"/>'
        s += f'<path d="M300,175 Q345,240 345,270 A45,45 0 0,1 255,270 Q255,240 300,175 Z" fill="#7DB3F0" stroke="{g}" stroke-width="3"/>'
        s += "".join(f'<path d="M110,{370+k*28} Q160,{348+k*28} 210,{370+k*28} T310,{370+k*28} T410,{370+k*28} T510,{370+k*28}" fill="none" stroke="#3E7CC9" stroke-width="5" opacity="{1-k*0.25}"/>' for k in range(3))
    elif idx == 8:  # Kharva: branch bending low with fruit
        s += f'<path d="M150,190 Q330,170 410,260 Q450,310 440,400" fill="none" stroke="#8A5A34" stroke-width="10" stroke-linecap="round"/>'
        for (x, y, r) in [(250, 215, 22), (330, 225, 26), (395, 270, 28), (430, 340, 30), (438, 410, 24)]:
            s += f'<line x1="{x}" y1="{y-r}" x2="{x}" y2="{y-r-14}" stroke="#8A5A34" stroke-width="4"/><circle cx="{x}" cy="{y+8}" r="{r}" fill="#E8913A" stroke="{g}" stroke-width="3"/>'
        s += "".join(f'<path d="M{x},{y} q18,-24 40,-10 q-22,22 -40,10 Z" fill="#4FB477"/>' for x, y in [(200, 196), (290, 186), (365, 225)])
    b.append(f'<g>{s}</g>')
    return svg("".join(b))

def siddhi_emblem(idx):
    g = GOLD; v = "#B48CF0"
    b = [f'<circle cx="300" cy="300" r="282" fill="none" stroke="{g}" stroke-width="1.5" opacity="0.45"/>',
         "".join(f'<circle cx="{300+266*math.cos(math.radians(-90+i*45)):.1f}" cy="{300+266*math.sin(math.radians(-90+i*45)):.1f}" r="{9 if i==idx else 5}" fill="{g}" opacity="{1 if i==idx else 0.5}"/>' for i in range(8)),
         f'<polygon points="{poly(8,235,-90+22.5)}" fill="#1c1236" stroke="{g}" stroke-width="3"/>']
    s = ""
    if idx == 0:    # Anima: a tiny bright point within vast rings
        s += "".join(f'<circle cx="300" cy="300" r="{r}" fill="none" stroke="{v}" stroke-width="2" opacity="{0.25+0.12*k}"/>' for k, r in enumerate([190, 150, 110, 70, 35]))
        s += f'<circle cx="300" cy="300" r="7" fill="#fff6d8"/><circle cx="300" cy="300" r="16" fill="none" stroke="{g}" stroke-width="2"/>'
    elif idx == 1:  # Mahima: expanding sun
        s += rays(32, 110, 200, g, 4, 0.8) + f'<circle cx="300" cy="300" r="100" fill="{v}" stroke="{g}" stroke-width="4"/><circle cx="300" cy="300" r="60" fill="#d8c4ff"/>'
    elif idx == 2:  # Garima: mountain, immovable
        s += f'<polygon points="140,410 260,200 310,270 350,230 460,410" fill="#4b3a7a" stroke="{g}" stroke-width="4" stroke-linejoin="round"/>'
        s += f'<polygon points="260,200 290,252 268,244 246,262" fill="#F1EDE4"/><line x1="130" y1="412" x2="470" y2="412" stroke="{g}" stroke-width="5"/>'
    elif idx == 3:  # Laghima: feather drifting
        s += f'<path d="M210,430 Q260,330 300,260 Q350,175 420,150 Q400,230 350,300 Q300,370 210,430 Z" fill="#d8c4ff" stroke="{g}" stroke-width="3"/>'
        s += f'<path d="M210,430 Q320,300 420,150" fill="none" stroke="{g}" stroke-width="3"/>'
        s += "".join(f'<line x1="{255+k*25}" y1="{375-k*35}" x2="{290+k*25}" y2="{385-k*38}" stroke="{g}" stroke-width="1.5"/>' for k in range(5))
    elif idx == 4:  # Prapti: path reaching a star
        s += f'<path d="M160,430 Q240,380 250,320 Q260,250 340,230 Q400,215 420,180" fill="none" stroke="{v}" stroke-width="6" stroke-dasharray="14 10" stroke-linecap="round"/>'
        star = " ".join(f"{420+(46 if i%2==0 else 19)*math.cos(math.radians(-90+i*36)):.1f},{170+(46 if i%2==0 else 19)*math.sin(math.radians(-90+i*36)):.1f}" for i in range(10))
        s += f'<polygon points="{star}" fill="{g}"/><circle cx="160" cy="430" r="12" fill="{v}"/>'
    elif idx == 5:  # Prakamya: diya flame of will
        s += f'<path d="M195,350 Q300,450 405,350 Z" fill="#C9864A" stroke="{g}" stroke-width="4"/>'
        s += f'<path d="M300,180 C345,240 350,290 325,330 C315,345 305,350 300,352 C295,350 285,345 275,330 C250,290 255,240 300,180 Z" fill="#F5A04A"/>'
        s += f'<path d="M300,250 C318,280 320,305 310,325 C306,333 302,336 300,337 C298,336 294,333 290,325 C280,305 282,280 300,250 Z" fill="#FFE6A8"/>'
    elif idx == 6:  # Ishitva: crown
        s += f'<polygon points="170,380 170,230 235,300 300,190 365,300 430,230 430,380" fill="{g}" stroke="#fff3c9" stroke-width="3" stroke-linejoin="round"/>'
        s += f'<rect x="170" y="380" width="260" height="34" fill="#c9a654"/>' + "".join(f'<circle cx="{x}" cy="397" r="9" fill="{v}"/>' for x in (215, 300, 385))
        s += "".join(f'<circle cx="{x}" cy="{y}" r="11" fill="{v}"/>' for x, y in [(170, 222), (300, 180), (430, 222)])
    elif idx == 7:  # Vashitva: a steady eye within reins (circle of command)
        s += f'<circle cx="300" cy="300" r="170" fill="none" stroke="{v}" stroke-width="5"/><circle cx="300" cy="300" r="140" fill="none" stroke="{v}" stroke-width="2" opacity="0.6"/>'
        s += f'<path d="M190,300 Q300,210 410,300 Q300,390 190,300 Z" fill="none" stroke="{g}" stroke-width="5"/><circle cx="300" cy="300" r="36" fill="{v}"/><circle cx="300" cy="300" r="14" fill="#140c26"/>'
        s += "".join(f'<line x1="{300+170*math.cos(math.radians(a)):.1f}" y1="{300+170*math.sin(math.radians(a)):.1f}" x2="{300+192*math.cos(math.radians(a)):.1f}" y2="{300+192*math.sin(math.radians(a)):.1f}" stroke="{g}" stroke-width="4"/>' for a in range(0, 360, 45))
    b.append(s)
    return svg("".join(b))

def mandala_emblem():
    g = GOLD
    b = [f'<circle cx="300" cy="300" r="285" fill="none" stroke="{g}" stroke-width="2" opacity="0.6"/>']
    for i in range(10):
        a = math.radians(-90 + i * 36)
        b.append(f'<circle cx="{300+250*math.cos(a):.1f}" cy="{300+250*math.sin(a):.1f}" r="22" fill="#4a1d1d" stroke="#E2563A" stroke-width="3"/>')
    b.append(f'<circle cx="300" cy="300" r="215" fill="none" stroke="{g}" stroke-width="2"/>')
    for i in range(9):
        a = math.radians(-90 + i * 40)
        b.append(f'<circle cx="{300+175*math.cos(a):.1f}" cy="{300+175*math.sin(a):.1f}" r="20" fill="#123a3e" stroke="#2FA39A" stroke-width="3"/>')
    b.append(f'<circle cx="300" cy="300" r="140" fill="none" stroke="{g}" stroke-width="2"/>')
    b.append(petal_ring(8, 40, 125, 36, g, "#3a2a66", 2.5, rot=-90))
    b.append(f'<circle cx="300" cy="300" r="40" fill="{g}"/><circle cx="300" cy="300" r="16" fill="#fff6d8"/>')
    return svg("".join(b))

# ---------- card composer ----------
def compose(slug, theme, emblem_svg, kicker, hi, name, sub, body_line, bullets, footer_note=None, sub_italic=True, highlight=None):
    bg = background(*theme)
    im = bg.convert("RGBA")
    over = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(over)
    frame(d)
    center(d, 92, kicker.upper(), SANS_SB(24), GOLD_RGB + (230,), spacing=5)
    es = 500 if bullets else 540
    em = svg_png(emblem_svg, es)
    over.alpha_composite(em, ((W - es) // 2, 138))
    ops = []  # (height, fn)
    ops.append((130, lambda y: center(d, y, hi, DEV(86), (255, 244, 220, 255))))
    ops.append((76, lambda y: center(d, y, name, SERIF_B(62), GOLD_RGB + (255,))))
    if sub:
        ops.append((58, lambda y: center(d, y, sub, (SERIF_I if sub_italic else SERIF_SB)(40), (240, 228, 205, 255))))
    ops.append((40, lambda y: divider(d, y + 12)))
    if body_line:
        for ln in wrap(d, body_line, SANS(29), 860):
            ops.append((40, lambda y, ln=ln: center(d, y, ln, SANS(29), (232, 224, 210, 235))))
        ops.append((8, lambda y: None))
    if highlight:
        ops.append((70, lambda y: center(d, y + 4, highlight, SERIF_SB(50), GOLD_RGB + (255,))))
    if bullets:
        ops.append((36, lambda y: center(d, y + 4, "LIVE IT", SANS_SB(19), GOLD_RGB + (200,), spacing=5)))
        for bl in bullets:
            ops.append((39, lambda y, bl=bl: center(d, y, "•  " + bl, SANS(27), (255, 238, 200, 245))))
    top, bottom = 138 + es + 6, H - 150
    total = sum(h for h, _ in ops)
    y = top + max(0, (bottom - top - total) // 2) if not bullets else top
    if y + total > bottom: print("WARN overflow", slug, y + total - bottom)
    for h, fn in ops:
        fn(y); y += h
    center(d, H - 98, "INNER VICTORY GUIDE", SANS_SB(20), GOLD_RGB + (190,), spacing=6)
    if footer_note:
        center(d, H - 136, footer_note, SERIF_I(28), (240, 228, 205, 200))
    im.alpha_composite(over)
    path = os.path.join(OUT, slug + ".jpg")
    im.convert("RGB").save(path, "JPEG", quality=88, optimize=True, progressive=True)
    return path

def run(only=None):
    made = []
    DEVI_BG = ("#1b1236", "#0b0818")
    for i, dv in enumerate(DEVIS):
        if only and dv["slug"] not in only: continue
        made.append(compose(dv["slug"], DEVI_BG + (dv["color"] if dv["slug"] != "mahagauri" else "#8c86a8",),
            devi_emblem(dv, i), f"Navratri · Night {i+1}", dv["hi"], dv["name"],
            f'{dv["theme"]}', dv["line"], dv["practice"], footer_note=f'Chakra: {dv["chakra"]}'))
    for i, v in enumerate(VICES):
        if only and v["slug"] not in only: continue
        made.append(compose(v["slug"], ("#2a0f0f", "#0e0606", "#7a2a18"), vice_emblem(i),
            f"Ravan's 10 heads · {i+1}", v["hi"], v["name"], v["en"],
            None, [], footer_note="Dussehra: the victory within", highlight=f'Conquer it with {v["virtue"]}'))
    for i, n in enumerate(NIDHIS):
        if only and n["slug"] not in only: continue
        made.append(compose(n["slug"], ("#0d2a2e", "#06141a", "#1f6f6a"), nidhi_emblem(i),
            f"Nav Nidhi · {i+1}  ·  {n['sym']}", n["hi"], n["name"] + " Nidhi", n["theme"], n["line"], n["practice"], footer_note="An inner treasure"))
    for i, s in enumerate(SIDDHIS):
        if only and s["slug"] not in only: continue
        made.append(compose(s["slug"], ("#1c1236", "#0a0716", "#5b3fa8"), siddhi_emblem(i),
            f"Ashta Siddhi · {i+1}", s["hi"], s["name"], s["inner"], f'Traditional: {s["trad"]}', [], footer_note="Inner power, used for good"))
    if not only or "mandala" in only:
        made.append(compose("mandala", ("#1b1236", "#0b0818", "#6b4a2a"), mandala_emblem(),
            "The Inner Victory Mandala", "अंतर्विजय", "Inner Victory",
            "From the outside in", "Defeat the 10 vices, receive the 9 Nidhis, master the 8 Siddhis, return to the Self.",
            [], footer_note="Ask about any Devi, Nidhi, Siddhi or vice"))
    return made

if __name__ == "__main__":
    only = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else None
    for p in run(only): print(p)

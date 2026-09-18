# Four logomark animations, same 54px box, same ground, interchangeable in the
# tag. Frame 0 of every one of them is the finished face-on mark: Outlook plays
# no GIF and renders only the first frame, so that frame is what a large share
# of recipients will ever see.
#
#   spin    a full turn about the vertical axis, with an edge-on flash
#   scan    a diagonal HUD wipe, the three chevrons resolving behind the edge
#   glitch  the settled mark, interrupted by band-displacement bursts
#   pulse   a slow neon breath and nothing else
from PIL import Image, ImageDraw
import math, os, card, mark, theme as T

OUT = os.path.abspath("../assets/sig")
PX  = T.MARK * T.R
INSET = int(round(PX * 0.055))

def _eo3(p): return 1 - (1 - p) ** 3
# the ground under the mark is the card's own lattice, cropped at the phase it
# has where this GIF is pasted -- a flat fill here would read as a faint square
def _ground(): return card.ground(PX, PX, T.PAD_L, card.MARK_TOP).copy()

def _fit(im):
    """Inset the mark so the diamond's points never kiss the GIF edge."""
    s = PX - 2 * INSET
    out = Image.new("RGBA", (PX, PX), (0, 0, 0, 0))
    out.alpha_composite(im.resize((s, s), Image.LANCZOS), (INSET, INSET))
    return out

SHAPES = [_fit(mark.shape(i, PX, T.NEON + (255,))) for i in range(3)]
SOLID  = _fit(mark.mark(PX, T.NEON + (255,)))

def _tint(src, rgb, alpha=1.0):
    lay = Image.new("RGBA", src.size, (0, 0, 0, 0))
    lay.paste(rgb, (0, 0), src.split()[3])
    a = src.split()[3]
    if alpha < 1.0:
        a = a.point(lambda v: int(v * alpha))
    lay.putalpha(a)
    return lay

def _flat(rgb=T.NEON, alpha=1.0):
    cv = _ground(); cv.alpha_composite(_tint(SOLID, rgb, alpha)); return cv

FINAL = _flat()

# ---------------------------------------------------------------- spin
def _spin():
    frames, durs = [], []
    frames.append(FINAL); durs.append(1300)              # rest, face on
    N = 26
    for i in range(1, N + 1):
        th = 2 * math.pi * i / N
        c  = math.cos(th)
        w  = max(1, int(round(PX * abs(c))))
        cv = _ground()
        if w <= 2:
            # edge on: a bright sliver, which is what sells the turn
            ImageDraw.Draw(cv).rectangle(
                [PX // 2 - 1, INSET, PX // 2, PX - INSET], fill=T.NEON2 + (255,))
        else:
            face = SOLID if c >= 0 else SOLID.transpose(Image.FLIP_LEFT_RIGHT)
            k = 0.52 + 0.48 * abs(c)                     # shade as it turns away
            lay = _tint(face, T.lerp(T.NEON, T.NEON2, max(0.0, c)), 1.0)
            lay = lay.resize((w, PX), Image.LANCZOS)
            dim = Image.new("RGBA", lay.size, (0, 0, 0, 0))
            dim.paste(T.lerp((18, 26, 0), T.NEON, k), (0, 0), lay.split()[3])
            dim.putalpha(lay.split()[3])
            cv.alpha_composite(dim, ((PX - w) // 2, 0))
        frames.append(cv); durs.append(42)
    frames.append(FINAL); durs.append(1500)
    return frames, durs

# ---------------------------------------------------------------- scan
def _scan():
    ramp = Image.linear_gradient("L").rotate(-45, resample=Image.BILINEAR,
                                             expand=False).resize((PX, PX))
    def at(p, band=0.22):
        cv = _ground()
        for i, sh in enumerate(SHAPES):
            sp = (p - i * 0.07) / (1 - 2 * 0.07)
            sp = 0.0 if sp < 0 else (1.0 if sp > 1 else sp)
            if sp <= 0: continue
            cut = _eo3(sp)
            m = ramp.point(lambda v, c=cut: 255 if v / 255.0 <= c else 0)
            cv.alpha_composite(Image.composite(
                sh, Image.new("RGBA", (PX, PX), (0, 0, 0, 0)), m))
            if cut < 1.0:
                lo, hi = max(0.0, cut - band), cut
                gm = ramp.point(lambda v: 255 if lo <= v / 255.0 <= hi else 0)
                cv.alpha_composite(Image.composite(
                    _tint(sh, T.NEON2), Image.new("RGBA", (PX, PX), (0,0,0,0)), gm))
        return cv
    N = 22
    frames = [at((i + 1) / N) for i in range(N)]
    durs   = [55] * N
    frames.append(FINAL); durs.append(2200)
    return frames, durs

# ---------------------------------------------------------------- glitch
# fixed, not random: a signature that re-renders differently every build is a
# signature you cannot diff.
BURSTS = [[(0.00, 0.22, 5), (0.34, 0.52, -7), (0.70, 0.88, 4)],
          [(0.12, 0.30, -4), (0.46, 0.60, 8), (0.62, 0.95, -3)],
          [(0.05, 0.40, 3), (0.55, 0.78, -6)]]

def _glitch_frame(bands, split):
    cv = _ground()
    if split:
        cv.alpha_composite(_tint(SOLID, (0, 220, 190), 0.5).transform(
            SOLID.size, Image.AFFINE, (1, 0, split, 0, 1, 0)))
        cv.alpha_composite(_tint(SOLID, T.NEON2, 0.5).transform(
            SOLID.size, Image.AFFINE, (1, 0, -split, 0, 1, 0)))
    base = _tint(SOLID, T.NEON)
    out = Image.new("RGBA", (PX, PX), (0, 0, 0, 0))
    prev = 0
    for y0, y1, dx in bands:
        a, b = int(y0 * PX), int(y1 * PX)
        if a > prev:
            out.alpha_composite(base.crop((0, prev, PX, a)), (0, prev))
        strip = base.crop((0, a, PX, b))
        out.alpha_composite(strip, (dx, a))
        prev = b
    if prev < PX:
        out.alpha_composite(base.crop((0, prev, PX, PX)), (0, prev))
    cv.alpha_composite(out)
    return cv

def _glitch():
    frames, durs = [], []
    for k, bands in enumerate(BURSTS):
        frames.append(FINAL); durs.append(1100 if k else 1400)
        for j, split in enumerate((3, 6, 2)):
            frames.append(_glitch_frame(bands, split)); durs.append(45)
        frames.append(_flat(T.NEON2)); durs.append(35)
    frames.append(FINAL); durs.append(1600)
    return frames, durs

# ---------------------------------------------------------------- pulse
def _pulse():
    frames, durs = [], []
    N = 18
    for i in range(N):
        t = 0.5 - 0.5 * math.cos(2 * math.pi * i / N)     # smooth in and out
        frames.append(_flat(T.lerp(T.NEON, T.NEON2, t), 0.74 + 0.26 * t))
        durs.append(105)
    return frames, durs

BUILDERS = dict(spin=_spin, scan=_scan, glitch=_glitch, pulse=_pulse)

def build(variant):
    frames, durs = BUILDERS[variant]()
    seq  = [FINAL] + frames               # frame 0 = finished art (Outlook)
    durs = [20] + durs
    # 96 colours: the lattice sits two levels off the ground and a tighter
    # palette merges the two, which shows up as a flat patch behind the mark
    seq  = [f.convert("RGB").quantize(colors=96, method=Image.MEDIANCUT)
            for f in seq]
    p = f"{OUT}/sv-mark-{variant}-v1.gif"
    seq[0].save(p, save_all=True, append_images=seq[1:], duration=durs,
                loop=0, optimize=True, disposal=1)
    print(f"  sv-mark-{variant}-v1.gif  {seq[0].size}  {len(seq)}f  "
          f"{sum(durs)/1000:.2f}s  {os.path.getsize(p)/1024:.0f} KB")

if __name__ == "__main__":
    for v in T.VARIANTS:
        build(v)

# The services strip. The site runs these as a marquee; a marquee that loops
# seamlessly needs the full track in the file, which at this width is hundreds
# of frames. A vertical roll says the same thing in 42: each label eases up and
# out as the next eases up behind it. Pure translation, so a 16-colour palette
# stays clean -- a cross-dissolve would band.
from PIL import Image, ImageDraw
import os, card, theme as T

OUT = os.path.abspath("../assets/sig")
# the strip is inset by PAD_L, which is wider than the corner radius, so the
# band the GIF covers is flat -- the two rounded bottom corners stay in PNGs.
W   = (card.CARD_W - 2 * T.PAD_L) * T.R
H   = T.ROT_H * T.R
BOT = T.BORDER * T.R           # the card's bottom border, baked into every frame
LBL = (106, 106, 106)
TRK = 0.18 * 7.5 * T.R

def _eo3(p): return 1 - (1 - p) ** 3

def _label(text, dy):
    """One label, centred, shifted `dy` device px from its resting line."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d  = ImageDraw.Draw(im)
    f  = card.f(T.MONO, 7.5)
    tw = card.tracked_w(text, f, TRK)
    dia = 4 * T.R
    total = dia + 7 * T.R + tw
    x = (W - total) / 2
    cy = (H - BOT) / 2 + dy
    d.polygon([(x + dia / 2, cy - dia / 2), (x + dia, cy),
               (x + dia / 2, cy + dia / 2), (x, cy)], fill=T.NEON + (255,))
    card.draw_tracked(d, x + dia + 7 * T.R, cy, text, f, LBL, TRK)
    return im

def _frame(i, dy_out, dy_in):
    cv = card.ground(W, H, T.PAD_L, card.BODY_H + 1).copy()
    n = len(T.SERVICES)
    if dy_out is not None:
        cv.alpha_composite(_label(T.SERVICES[i], dy_out))
    if dy_in is not None:
        cv.alpha_composite(_label(T.SERVICES[(i + 1) % n], dy_in))
    ImageDraw.Draw(cv).rectangle([0, H - BOT, W - 1, H - 1], fill=T.EDGE + (255,))
    return cv

def build():
    frames, durs = [], []
    STEPS, TRAVEL = 5, H - BOT
    for i in range(len(T.SERVICES)):
        frames.append(_frame(i, 0, None)); durs.append(1250)     # hold
        for s in range(1, STEPS + 1):
            e = _eo3(s / STEPS)
            frames.append(_frame(i, -TRAVEL * e, TRAVEL * (1 - e)))
            durs.append(45)
    seq  = [frames[0]] + frames          # frame 0 = a resting label (Outlook)
    durs = [20] + durs
    seq  = [f.convert("RGB").quantize(colors=64, method=Image.MEDIANCUT)
            for f in seq]
    p = f"{OUT}/sv-rotator-v1.gif"
    seq[0].save(p, save_all=True, append_images=seq[1:], duration=durs,
                loop=0, optimize=True, disposal=1)
    print(f"  sv-rotator-v1.gif  {seq[0].size}  {len(seq)}f  "
          f"{sum(durs)/1000:.1f}s  {os.path.getsize(p)/1024:.0f} KB")

if __name__ == "__main__":
    build()

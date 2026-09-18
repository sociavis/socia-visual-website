# Renders the tag once, then cuts it into the pieces the HTML reassembles.
#
# Why every pixel is an image, and why the markup declares no colour at all --
# two clients, two opposite rules, one answer (carried over from the Antique
# Tile build, 2026-09-01):
#   * Gmail's mobile app rewrites CSS colours for dark mode with no opt-out.
#     It never touches <img>.
#   * Apple Mail does the reverse: a message that declares ANY background
#     switches off its dark adaptation and the whole body renders on white.
# So the tag can neither rely on CSS colour nor declare one. Ground, border,
# rounded corners, the neon bar, type and icons are all baked pixels, and the
# markup is a bare table of <img>. Nothing in it can be recoloured, and nothing
# in it can tell a client anything about the background of the mail it sits in.
import os
from PIL import Image, ImageDraw, ImageFont
import theme as T

R = T.R
_scratch = ImageDraw.Draw(Image.new("RGB", (1, 1)))

def f(path, px): return ImageFont.truetype(path, int(round(px * R)))

def tracked_w(text, font, track):
    if not text: return 0.0
    return sum(_scratch.textlength(c, font=font) for c in text) + track * (len(text) - 1)

def draw_tracked(d, x, y, text, font, fill, track):
    for ch in text:
        d.text((x, y), ch, font=font, fill=fill, anchor="lm")
        x += _scratch.textlength(ch, font=font) + track

# ---- type ----
F_NAME  = lambda: f(T.CHAKRA_BOLD, 15)
F_ROW   = lambda: f(T.CHAKRA, 11)
F_TAG   = lambda: f(T.MONO, 7.5)
TRK_NAME = 0.04 * 15 * R
TRK_TAG  = 0.16 * 7.5 * R

def _glyph_globe(d, box, fill):
    x, y, s = box
    d.ellipse([x, y, x + s, y + s], outline=fill, width=max(1, R))
    d.ellipse([x + s * 0.28, y, x + s * 0.72, y + s], outline=fill, width=max(1, R))
    d.line([x, y + s / 2, x + s, y + s / 2], fill=fill, width=max(1, R))

def _glyph_mail(d, box, fill):
    x, y, s = box
    h = s * 0.74; y += (s - h) / 2
    w = max(1, R)
    d.rectangle([x, y, x + s, y + h], outline=fill, width=w)
    d.line([x, y, x + s / 2, y + h * 0.58], fill=fill, width=w)
    d.line([x + s, y, x + s / 2, y + h * 0.58], fill=fill, width=w)

def _glyph_phone(d, box, fill):
    """A handset at 12px collapses into a smudge; the phone body reads at this
    size, and the speaker slot is what stops it looking like a plain rectangle."""
    x, y, s = box
    w = max(1, R)
    bw = s * 0.62; bx = x + (s - bw) / 2
    d.rounded_rectangle([bx, y, bx + bw, y + s], radius=s * 0.17,
                        outline=fill, width=w)
    d.line([bx + bw * 0.3, y + s * 0.15, bx + bw * 0.7, y + s * 0.15],
           fill=fill, width=w)

GLYPH = {"globe": _glyph_globe, "mail": _glyph_mail, "phone": _glyph_phone}

def _lattice(w, h):
    """The diamond lattice: a 45-degree cross-hatch, the mark's own geometry
    tiled and taken down to a couple of levels above the ground."""
    im = Image.new("RGBA", (w, h), T.GROUND + (255,))
    d  = ImageDraw.Draw(im)
    S  = T.TEX_STEP * R
    for c in range(-h - S, w + S, S):
        d.line([(c, 0), (c + h, h)], fill=T.TEX + (255,), width=1)   # x - y = c
        d.line([(c, h), (c + h, 0)], fill=T.TEX + (255,), width=1)   # x + y = c
    return im


_FULL = None

def ground(w, h, ox=0, oy=0):
    """Ground for a `w`x`h` device-px region whose top-left sits at CSS (ox,oy)
    in the card.

    The offsets matter: the two GIFs are pasted over this same ground, so they
    have to carry the lattice at the phase the card has there, or the seam
    shows as a faint rectangle exactly where the GIF sits. Rather than solve
    the phase per region -- which is easy to get subtly wrong -- the lattice is
    drawn once at card size and every region is a crop of it. Phase then cannot
    drift, because there is only ever one lattice.
    """
    global _FULL
    if _FULL is None:
        _FULL = _lattice(CARD_W * R, CARD_H * R)
    x, y = ox * R, oy * R
    assert x >= 0 and y >= 0 and x + w <= _FULL.width and y + h <= _FULL.height, \
        f"region ({ox},{oy}) {w}x{h} falls outside the card"
    return _FULL.crop((x, y, x + w, y + h))


PERSON = dict(
    name="Scott Socia",
    rows=[("phone", "TEL", "903-617-1527",          "tel:+19036171527"),
          ("globe", "WEB", "sociavisual.com",       "https://sociavisual.com"),
          ("mail",  "EML", "scott@sociavisual.com", "mailto:scott@sociavisual.com")])

def measure():
    """Card width, and the width of the text column, in CSS px."""
    fn, fr = F_NAME(), F_ROW()
    row_w = max(_scratch.textlength(v, font=fr) for _, _, v, _ in PERSON["rows"])
    w = max(tracked_w(PERSON["name"], fn, TRK_NAME), T.TXT * R + row_w)
    text_w = max(T.MIN_TEXT_W, -(-int(w) // R) + 1)
    card_w = T.PAD_L + T.MARK + T.GUTTER + text_w + T.PAD_R
    return card_w, text_w

CARD_W, TEXT_W = measure()
TEXT_H  = T.NAME_H + T.NAME_GAP + T.ROW_H * len(PERSON["rows"])
BODY_H  = T.BAR_H + T.PAD_T + max(T.MARK, TEXT_H) + T.PAD_B
CARD_H  = BODY_H + 1 + T.ROT_H          # + hairline + rotator strip
TEXT_TOP = T.BAR_H + T.PAD_T + max(0, (max(T.MARK, TEXT_H) - TEXT_H) // 2)
MARK_TOP = T.BAR_H + T.PAD_T + max(0, (max(T.MARK, TEXT_H) - T.MARK) // 2)

def render():
    """Draw the whole tag at 2x, then return the canvas. The rotator strip is
    left as bare ground: the GIF is pasted over that band by the HTML."""
    W, H = CARD_W * R, CARD_H * R
    cv = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    rad = T.RADIUS * R
    # textured ground, clipped to the rounded rect, then the border on top
    shape = Image.new("L", (W, H), 0)
    ImageDraw.Draw(shape).rounded_rectangle([0, 0, W - 1, H - 1], radius=rad, fill=255)
    cv.paste(ground(W, H), (0, 0), shape)
    d = ImageDraw.Draw(cv)
    d.rounded_rectangle([0, 0, W - 1, H - 1], radius=rad, outline=T.EDGE + (255,),
                        width=T.BORDER * R)

    # neon bar: transparent -> #a8ff00 -> #d4ff00 -> transparent, clipped to the
    # rounded top so it cannot square off the corners
    bar = Image.new("RGBA", (W, T.BAR_H * R), (0, 0, 0, 0))
    bd  = ImageDraw.Draw(bar)
    for x in range(W):
        u = x / (W - 1)
        if   u < 0.16: c, a = T.NEON, u / 0.16
        elif u < 0.50: c, a = T.lerp(T.NEON, T.NEON2, (u - 0.16) / 0.34), 1.0
        elif u < 0.84: c, a = T.NEON2, 1.0
        else:          c, a = T.NEON2, (1 - u) / 0.16
        bd.line([x, 0, x, T.BAR_H * R], fill=c + (int(255 * max(0.0, min(1.0, a))),))
    clip = Image.new("L", (W, H), 0)
    ImageDraw.Draw(clip).rounded_rectangle([0, 0, W - 1, H - 1], radius=rad, fill=255)
    band = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    band.alpha_composite(bar, (0, T.BORDER * R))
    cv.alpha_composite(Image.composite(band, Image.new("RGBA", (W, H), (0, 0, 0, 0)), clip))

    # hairline above the rotator strip
    ry = (BODY_H) * R
    d.rectangle([T.BORDER * R, ry, W - 1 - T.BORDER * R, ry + R - 1], fill=T.RULE + (255,))

    # ---- text column ----
    fn, fr = F_NAME(), F_ROW()
    x0 = (T.PAD_L + T.MARK + T.GUTTER) * R
    top = TEXT_TOP
    y = top * R
    draw_tracked(d, x0, y + T.NAME_H * R / 2, PERSON["name"], fn, T.INK, TRK_NAME)
    y += (T.NAME_H + T.NAME_GAP) * R

    rows_y = []
    for glyph, _tag, val, href in PERSON["rows"]:
        cy = y + T.ROW_H * R / 2
        s = T.ICON * R
        GLYPH[glyph](d, (x0, cy - s / 2, s), T.NEON + (255,))
        d.text((x0 + T.TXT * R, cy), val, font=fr, fill=T.MUTE, anchor="lm")
        rows_y.append(y)
        y += T.ROW_H * R
    return cv, top, rows_y

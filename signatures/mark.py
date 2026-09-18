# The Socia logomark, as PIL geometry. Three chevrons nested around a common
# diagonal: the SVG ships them as flat polygon point lists, so they are copied
# here verbatim rather than parsed -- the file is the source of truth and it
# has not changed since 2026-03-17.
from PIL import Image, ImageDraw

VB = 1920.0            # SVG viewBox, square
SS = 4                 # supersample factor for the vector edges

# index 0 = the short inner bar, 1 = the upper-left chevron, 2 = the lower-right
# chevron. Draw order is back-to-front; the animation staggers them in this order.
SHAPES = [
    [(1454.6,882),(625.1,882),(469.2,1035.9),(1298.7,1035.9)],
    [(331.3,960.5),(959.1,332.7),(1188.3,562),(1406.8,562),(1179.6,334.8),
     (958.6,113.7),(114.4,959),(428.2,1275.9),(1055.4,1275.9),(1211.3,1122.1),
     (492.9,1122.1)],
    [(1493,648.1),(862.1,648.1),(706.2,802),(1428.4,802),(1586.9,960.5),
     (959.1,1588.3),(849.7,1478.9),(732.9,1362.1),(514.4,1362.1),(739.7,1587.4),
     (958.6,1806.3),(1805.6,960.7)],
]

def bbox(pts):
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)

# tight bounds of the whole mark, so it can be fitted to a box with no dead air
ALL = [p for s in SHAPES for p in s]
X0, Y0, X1, Y1 = bbox(ALL)

def shape(i, px, fill):
    """One chevron, alpha-only tile at `px` square, positioned as it sits in the
    full mark. Rendered at SS and downsampled: PIL has no polygon antialiasing."""
    big = px * SS
    im = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    s = big / max(X1 - X0, Y1 - Y0)
    d.polygon([((x - X0) * s, (y - Y0) * s) for x, y in SHAPES[i]], fill=fill)
    return im.resize((px, px), Image.LANCZOS)

def mark(px, fill):
    im = Image.new("RGBA", (px, px), (0, 0, 0, 0))
    for i in range(3):
        im.alpha_composite(shape(i, px, fill))
    return im

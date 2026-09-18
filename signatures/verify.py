# Reassembles the shipped pieces exactly as the HTML stacks them and diffs the
# result against the master render. Slicing drift shows up here as a nonzero
# pixel count long before it shows up as a hairline seam in someone's inbox.
#
# Nothing here is hardcoded to a row count or a y offset: the piece list is
# read back out of the emitted markup and the geometry comes from card, so the
# check stays honest when the layout changes.
import re, sys, os
from PIL import Image, ImageChops, ImageDraw
import card, theme as T

OUT     = os.path.abspath("../assets/sig")
R       = T.R
VARIANT = sys.argv[1] if len(sys.argv) > 1 else "spin"
html    = open(f"sv-signature-{VARIANT}.html").read()
pieces  = re.findall(r'<img src="[^"]*/([^"/]+)" width="(\d+)" height="(\d+)"', html)
sizes   = {fn: (int(w), int(h)) for fn, w, h in pieces}

master, _, _ = card.render()
W, H = card.CARD_W * R, card.CARD_H * R
recon = Image.new("RGBA", (W, H), (0, 0, 0, 0))
placed = []

def paste(fn, x, y):
    im = Image.open(os.path.join(OUT, fn))
    im.seek(0)                                  # GIFs: the frame Outlook shows
    w, h = sizes[fn]
    assert im.size == (w * R, h * R), f"{fn} is {im.size}, markup says {w}x{h}@{R}x"
    recon.alpha_composite(im.convert("RGBA"), (x * R, y * R))
    placed.append(fn)

left_w = T.PAD_L + T.MARK
BH     = card.BODY_H
nb_end = card.TEXT_TOP + T.NAME_H + T.NAME_GAP
n_rows = len(card.PERSON["rows"])

paste("sv-tag-l-top-v1.png", 0, 0)
paste("sv-tag-l-pad-v1.png", 0, card.MARK_TOP)
paste(f"sv-mark-{VARIANT}-v1.gif", T.PAD_L, card.MARK_TOP)
paste("sv-tag-l-bot-v1.png", 0, card.MARK_TOP + T.MARK)
paste("sv-tag-name-v1.png", left_w, 0)
for i in range(n_rows):
    paste(f"sv-tag-r{i}-v1.png", left_w, nb_end + T.ROW_H * i)
paste("sv-tag-rule-v1.png", 0, BH)
paste("sv-tag-rot-l-v1.png", 0, BH + 1)
paste("sv-rotator-v1.gif", T.PAD_L, BH + 1)
paste("sv-tag-rot-r-v1.png", card.CARD_W - T.PAD_L, BH + 1)

missing = set(sizes) - set(placed)
assert not missing, f"markup ships pieces this check never placed: {missing}"

# the two GIF bands are the only regions allowed to differ (animated art plus
# palette quantisation); everywhere else must match the master to the pixel.
mask = Image.new("L", (W, H), 255)
md = ImageDraw.Draw(mask)
md.rectangle([T.PAD_L * R, card.MARK_TOP * R,
              (T.PAD_L + T.MARK) * R - 1, (card.MARK_TOP + T.MARK) * R - 1], fill=0)
md.rectangle([T.PAD_L * R, (BH + 1) * R,
              (card.CARD_W - T.PAD_L) * R - 1, card.CARD_H * R - 1], fill=0)

# The masked check below cannot see inside the GIF bands, and that is exactly
# where palette quantisation could flatten the lattice into plain ground. So
# sample ground-only pixels in each band and require them to match the card.
def ground_probe(fn, ox, oy, pts):
    g = Image.open(os.path.join(OUT, fn)); g.seek(0)
    g = g.convert("RGB")
    m = master.convert("RGB")
    out = []
    for px, py in pts:
        a = g.getpixel((px, py))
        b = m.getpixel((ox * R + px, oy * R + py))
        out.append((px, py, a, b))
    return out

MW = T.MARK * R
probes  = ground_probe(f"sv-mark-{VARIANT}-v1.gif", T.PAD_L, card.MARK_TOP,
                       [(2, 2), (MW - 3, 2), (2, MW - 3), (MW - 3, MW - 3),
                        (MW // 2, 3), (3, MW // 2)])
RW, RH = (card.CARD_W - 2 * T.PAD_L) * R, T.ROT_H * R
probes += ground_probe("sv-rotator-v1.gif", T.PAD_L, card.BODY_H + 1,
                       [(2, 2), (2, RH // 2), (RW - 3, 2), (RW - 3, RH // 2),
                        (RW // 4, 2)])
off = [pr for pr in probes if pr[2] != pr[3]]
print(f"  [{VARIANT}] ground probes: {len(probes) - len(off)}/{len(probes)} match the card")
if off:
    for px, py, a, b in off:
        print(f"      ({px},{py}) gif {a} vs card {b}")
    raise SystemExit("  GIF GROUND DRIFT — the lattice does not line up")

diff = ImageChops.difference(master.convert("RGB"), recon.convert("RGB"))
flat = Image.composite(diff, Image.new("RGB", (W, H), (0, 0, 0)), mask).convert("L")
bad  = sum(1 for p in flat.tobytes() if p > 2)
print(f"  [{VARIANT}] {len(pieces)} pieces, {n_rows} contact rows, "
      f"{bad} px differing from master")
if bad:
    flat.point(lambda v: 255 if v > 2 else 0).save(f"/tmp/drift-{VARIANT}.png")
    raise SystemExit(f"  SLICING DRIFT — map written to /tmp/drift-{VARIANT}.png")
print(f"  [{VARIANT}] OK — reassembles to the master exactly")

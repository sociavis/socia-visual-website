# Cuts the rendered tag into pieces and writes the signature HTML.
#
# Layout of the pieces (CSS px, card 234 x 93):
#
#   +--------------------------------------------+  <- top: neon bar + padding
#   | padl |  MARK GIF  |  name + title block     |
#   |      |  (50x50)   |  WEB row   (linked)     |
#   | bot  |            |  EML row   (linked)     |
#   +--------------------------------------------+  <- hairline, full width
#   | edge |   ROTATOR GIF (214x14)        | edge |  <- bottom corners in PNGs
#   +--------------------------------------------+
#
# The two GIFs only ever sit on flat ground: the rounded corners and both
# borders live in PNGs around them, so a GIF never has to carry a curve.
import os
import card, theme as T
import gif_mark, gif_rotator

BASE = "https://sociavisual.com/assets/sig"
OUT  = os.path.abspath("../assets/sig")
VER  = "v2"

Z  = ('style="padding:0;margin:0;line-height:0;font-size:0;'
      'vertical-align:top;border:0;"')
TB = ('<table cellpadding="0" cellspacing="0" border="0" role="presentation" '
      'style="border-collapse:collapse;border-spacing:0;">')

def img(fn, w, h, alt="", href=None):
    # -ms-interpolation-mode: Outlook rescales images by the system DPI and
    # defaults to nearest-neighbour when it does.
    i = (f'<img src="{BASE}/{fn}" width="{w}" height="{h}" alt="{alt}" '
         f'style="display:block;border:0;outline:none;text-decoration:none;'
         f'-ms-interpolation-mode:bicubic;">')
    return f'<a href="{href}" style="text-decoration:none;">{i}</a>' if href else i

def cut_all():
    """Cut the PNG pieces once. Every variant shares them -- only the logomark
    GIF differs between them, so the card itself is rendered and sliced once."""
    os.makedirs(OUT, exist_ok=True)
    cv, top, _ = card.render()
    R = T.R

    def cut(name, box, alt="", href=None):
        x1, y1, x2, y2 = [v * R for v in box]
        fn = f"sv-tag-{name}-{VER}.png"
        cv.crop((x1, y1, x2, y2)).save(os.path.join(OUT, fn))
        return (fn, box[2] - box[0], box[3] - box[1], alt, href)

    W, BH = card.CARD_W, card.BODY_H
    left_w  = T.PAD_L + T.MARK
    mark_y0 = card.MARK_TOP                 # the GIF's top edge
    mark_y1 = mark_y0 + T.MARK
    nb_end  = top + T.NAME_H + T.NAME_GAP

    L = dict(top = cut("l-top",  (0, 0, left_w, mark_y0)),
             pad = cut("l-pad",  (0, mark_y0, T.PAD_L, mark_y1)),
             bot = cut("l-bot",  (0, mark_y1, left_w, BH)))
    name = cut("name", (left_w, 0, W, nb_end),
               card.PERSON["name"])
    rows = []
    for i, (_, _, val, href) in enumerate(card.PERSON["rows"]):
        ya = nb_end + T.ROW_H * i
        yb = BH if i == len(card.PERSON["rows"]) - 1 else ya + T.ROW_H
        rows.append(cut(f"r{i}", (left_w, ya, W, yb), val, href))
    rule  = cut("rule",  (0, BH, W, BH + 1))
    edg_l = cut("rot-l", (0, BH + 1, T.PAD_L, card.CARD_H))
    edg_r = cut("rot-r", (W - T.PAD_L, BH + 1, W, card.CARD_H))

    return dict(L=L, name=name, rows=rows, rule=rule, edg_l=edg_l, edg_r=edg_r,
                top=top, nb_end=nb_end)

P = None

def build(variant):
    global P
    if P is None:
        P = cut_all()
    L, name, rows = P["L"], P["name"], P["rows"]
    rule, edg_l, edg_r = P["rule"], P["edg_l"], P["edg_r"]
    W = card.CARD_W
    cell = lambda inner: f'<tr><td {Z}>{inner}</td></tr>'
    # left column. The logo row is its own nested table rather than a colspan:
    # some signature editors strip colspan and the column then collapses.
    left = (TB + cell(img(*L["top"])) + cell(
        TB + f'<tr><td {Z}>{img(*L["pad"])}</td>'
             f'<td {Z}>{img(f"sv-mark-{variant}-{VER}.gif", T.MARK, T.MARK, "Socia Visual")}</td>'
             f'</tr></table>')
        + cell(img(*L["bot"])) + '</table>')
    right = TB + cell(img(*name)) + "".join(cell(img(*r)) for r in rows) + '</table>'
    body  = TB + f'<tr><td {Z}>{left}</td><td {Z}>{right}</td></tr></table>'
    rot_w = W - 2 * T.PAD_L
    band  = (TB + f'<tr><td {Z}>{img(*edg_l)}</td>'
             f'<td {Z}>{img(f"sv-rotator-{VER}.gif", rot_w, T.ROT_H, "")}</td>'
             f'<td {Z}>{img(*edg_r)}</td></tr></table>')

    html = (TB + cell(body) + cell(img(*rule)) + cell(band) + '</table>')
    open(f"sv-signature-{variant}.html", "w").write(html)
    print(f"  sv-signature-{variant}.html  {W}x{card.CARD_H} css px  "
          f"{len(html)} bytes markup")
    return html

if __name__ == "__main__":
    for v in T.VARIANTS:
        gif_mark.build(v)
    gif_rotator.build()
    for v in T.VARIANTS:
        build(v)
    total = sum(os.path.getsize(os.path.join(OUT, f))
                for f in os.listdir(OUT) if f.startswith("sv-"))
    print(f"  total payload {total/1024:.0f} KB")

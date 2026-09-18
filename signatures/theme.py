# One place for the numbers every piece of the tag shares. The GIFs and the
# sliced PNGs are rendered by different scripts but have to meet at the pixel,
# so nothing here may be duplicated by hand anywhere else.
import os

R  = 2                      # device px per CSS px (retina)
FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fonts")
CHAKRA      = f"{FONTS}/chakra-petch-400.ttf"
CHAKRA_BOLD = f"{FONTS}/chakra-petch-700.ttf"
MONO        = f"{FONTS}/share-tech-mono.ttf"

# ---- palette (Socia Visual studio brand) ----
GROUND = (10, 10, 10)       # #0a0a0a  card ground
EDGE   = (38, 38, 38)       # #262626  1px card border
RULE   = (26, 26, 26)       # #1a1a1a  hairline above the rotator
TEX    = (19, 19, 19)       # #131313  the diamond lattice in the ground
NEON   = (168, 255, 0)      # #a8ff00
NEON2  = (212, 255, 0)      # #d4ff00
INK    = (232, 232, 232)    # name
MUTE   = (154, 154, 154)    # contact rows
DIM    = (85, 85, 85)       # WEB / EML tags

# ---- geometry, CSS px ----
RADIUS  = 8
BORDER  = 1
BAR_H   = 2                 # neon gradient hairline across the top
PAD_L   = 12
MARK    = 62                # the animated logomark GIF, square
GUTTER  = 15
PAD_R   = 14
PAD_T   = 9                 # below the neon bar
PAD_B   = 8
ROT_H   = 15                # services rotator strip
TEX_STEP = 13               # lattice spacing, CSS px, measured on the diagonal
# no title line: the name carries the block alone, so it is set a size up.
NAME_H, NAME_GAP, ROW_H = 18, 6, 15
ICON, TXT = 12, 17          # icon box, and text offset within a contact row
# the text column is padded out to this if the type does not reach it, so the
# tag keeps a deliberate width rather than shrink-wrapping the longest row.
MIN_TEXT_W = 172

# What the studio actually bills for. "Visual Identity" is gone as a near
# duplicate of Brand Identity; the last four are the work that has come through
# most this year -- decks for Crockett/VMX/PZAX/Jetwerx, race-week social,
# and the trifold/backdrop/apparel runs for Triple Crown.
SERVICES = ["WEB DESIGN", "WEB DEVELOPMENT", "BRAND IDENTITY",
            "GRAPHIC DESIGN", "MOTION GRAPHICS", "MARKETING", "SEO",
            "PITCH DECKS", "SOCIAL CAMPAIGNS", "PRINT & APPAREL"]

# Logomark animations. The tag is built once per variant so they can be
# compared side by side in the same card.
VARIANTS = ["spin", "scan", "glitch", "pulse"]

def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))

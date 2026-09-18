# The page Scott actually uses: the tag on both grounds, one button that puts
# the real markup on the clipboard as text/html, and the per-client steps.
# Generated so the embedded markup can never drift from sv-signature.html.
import html as H, card, theme as T

SIGS  = {v: open(f"sv-signature-{v}.html").read() for v in T.VARIANTS}
# What gets previewed on this page and what gets copied differ by one thing:
# the preview is same-origin so it works before a deploy, while the clipboard
# payload keeps the absolute URLs it needs once it is sitting in a mail client.
SHOW  = {v: h.replace("https://sociavisual.com/assets/sig", "/assets/sig")
         for v, h in SIGS.items()}
BLURB = {"spin":   "A full turn about the vertical axis, with a flash as it goes edge on.",
         "scan":   "A diagonal wipe; the three chevrons resolve behind the leading edge.",
         "glitch": "Sits still, then tears into a chromatic split. The site's HUD, at 62px.",
         "pulse":  "A slow breath between the two greens. The quietest of the four."}

STEPS = [
 ("Apple Mail (macOS)",
  ["Mail &rsaquo; Settings &rsaquo; Signatures, pick the account, hit <b>+</b>.",
   "Uncheck <b>Always match my default message font</b> &mdash; leave it on and Mail flattens the tag.",
   "Click into the signature box, select everything already there, and paste.",
   "Quit and reopen Mail once so it rewrites its signature cache."]),
 ("Gmail (web)",
  ["Settings &rsaquo; See all settings &rsaquo; General &rsaquo; Signature.",
   "Create or open the signature, select all inside the box, paste.",
   "Scroll down and <b>Save Changes</b> &mdash; Gmail discards the box if you navigate away."]),
 ("Gmail (iOS / Android)",
  ["The mobile app can&rsquo;t hold an image signature of its own.",
   "Set <b>Mobile Signature</b> to empty in the app, and Gmail falls back to the "
   "web signature above on everything you send."]),
 ("Outlook",
  ["Paste into Signatures &rsaquo; New. Outlook shows the first frame of a GIF "
   "and never animates &mdash; the tag is built so frame one is the finished art."]),
]

cards = "".join(f'''
<section class="variant">
  <div class="vhead"><h2>{v}</h2><p>{BLURB[v]}</p></div>
  <div class="grounds">
    <div class="g light"><p>light message</p>{SHOW[v]}</div>
    <div class="g dark"><p>dark message</p>{SHOW[v]}</div>
  </div>
  <button data-for="{v}">Copy this one</button>
  <details><summary>Raw HTML</summary><pre id="src-{v}">{H.escape(SIGS[v])}</pre></details>
</section>''' for v in T.VARIANTS)

steps = "".join(
 f'<article><h3>{t}</h3><ol>' + "".join(f"<li>{s}</li>" for s in ss) + '</ol></article>'
 for t, ss in STEPS)

open("index.html", "w").write(f'''<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Email Signature — Socia Visual</title>
<meta name="robots" content="noindex">
<style>
@font-face{{font-family:Chakra;src:url(/fonts/chakra-petch-400.woff2)format('woff2');font-weight:400;font-display:swap}}
@font-face{{font-family:Chakra;src:url(/fonts/chakra-petch-700.woff2)format('woff2');font-weight:700;font-display:swap}}
@font-face{{font-family:STMono;src:url(/fonts/share-tech-mono.woff2)format('woff2');font-display:swap}}
*{{box-sizing:border-box}}
body{{margin:0;padding:48px 24px 96px;background:#050505;color:#8b8b8b;
 font:15px/1.6 Chakra,system-ui,sans-serif}}
.wrap{{max-width:860px;margin:0 auto}}
.kicker{{font:11px/1 STMono,monospace;letter-spacing:.3em;text-transform:uppercase;color:#a8ff00;margin:0 0 12px}}
h1{{font:700 30px/1.1 Chakra,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#ededed;margin:0 0 10px}}
.sub{{margin:0 0 40px;max-width:60ch}}
.variant{{border-top:1px solid #1a1a1a;padding:34px 0 8px}}
.vhead{{display:flex;flex-wrap:wrap;align-items:baseline;gap:14px;margin:0 0 18px}}
.vhead h2{{font:700 15px/1 Chakra,sans-serif;letter-spacing:.24em;text-transform:uppercase;
 color:#a8ff00;margin:0}}
.vhead p{{margin:0;font-size:13.5px;color:#6f6f6f}}
.grounds{{display:flex;flex-wrap:wrap;gap:16px;margin:0 0 20px}}
.g{{padding:26px;border-radius:10px;flex:1 1 300px}}
.g.light{{background:#fff}} .g.dark{{background:#1f1f1f}}
.g p{{margin:0 0 6px;font:10px/1 STMono,monospace;letter-spacing:.2em;text-transform:uppercase}}
.g.light p{{color:#aaa}} .g.dark p{{color:#777}}
button{{font:700 13px/1 Chakra,sans-serif;letter-spacing:.14em;text-transform:uppercase;
 background:#a8ff00;color:#07140a;border:0;border-radius:6px;padding:15px 30px;cursor:pointer;
 transition:background .2s}}
button:hover{{background:#d4ff00}}
button[data-done]{{background:#1c2b10;color:#a8ff00}}
.note{{font:12px/1.5 STMono,monospace;color:#5a5a5a;margin:14px 0 0}}
.steps{{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:22px;
 margin:56px 0 0;border-top:1px solid #1a1a1a;padding-top:34px}}
article{{border:1px solid #1a1a1a;border-radius:10px;padding:20px 22px;background:#0a0a0a}}
h3{{font:700 12px/1 Chakra,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#a8ff00;margin:0 0 12px}}
ol{{margin:0;padding-left:18px}} li{{margin:0 0 8px;font-size:13.5px}}
b{{color:#cfcfcf;font-weight:700}}
details{{margin:16px 0 0}}
summary{{cursor:pointer;font:11px/1 STMono,monospace;letter-spacing:.2em;text-transform:uppercase;color:#6a6a6a}}
pre{{background:#0a0a0a;border:1px solid #1a1a1a;border-radius:8px;padding:16px;overflow:auto;
 font:11px/1.7 STMono,monospace;color:#7d7d7d;white-space:pre-wrap;word-break:break-all;margin:16px 0 0}}
@media(prefers-reduced-motion:reduce){{button{{transition:none}}}}
</style></head><body><div class="wrap">
<p class="kicker">Socia Visual</p>
<h1>Email Signature</h1>
<p class="sub">A {card.CARD_W}&times;{card.CARD_H} tag. Every pixel is an image, and the markup
declares no colour at all &mdash; so Gmail&rsquo;s dark mode can&rsquo;t recolour it and
Apple Mail can&rsquo;t mistake it for a background and flip your whole message to white.
Four logomark animations below; they are otherwise identical, so pick one and copy it.</p>

{cards}

<div class="steps">{steps}</div>
</div>
<script>
document.querySelectorAll('button[data-for]').forEach(b => {{
  b.addEventListener('click', async () => {{
    const src = document.getElementById('src-' + b.dataset.for);
    const sig = src.textContent;
    try {{
      await navigator.clipboard.write([new ClipboardItem({{
        'text/html':  new Blob([sig], {{type:'text/html'}}),
        'text/plain': new Blob([sig], {{type:'text/plain'}})
      }})]);
      b.textContent = 'Copied'; b.dataset.done = '1';
    }} catch (err) {{
      b.textContent = 'Press Cmd-C';
      src.closest('details').open = true;
      const r = document.createRange(); r.selectNodeContents(src);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }}
    setTimeout(() => {{ b.textContent = 'Copy this one'; delete b.dataset.done; }}, 2600);
  }});
}});
</script></body></html>''')
print("  index.html")

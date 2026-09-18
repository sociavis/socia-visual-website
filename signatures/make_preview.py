# Local proof sheet: the real markup, on every ground a mail client is likely
# to paint behind it, plus a first-frame-only column standing in for Outlook.
import re, os

SIG = open("sv-signature.html").read()
LOCAL = SIG.replace("https://sociavisual.com/assets/sig", "../assets/sig")
GROUNDS = [("Gmail / Apple Mail, light", "#ffffff"),
           ("Gmail app, dark", "#1f1f1f"),
           ("Apple Mail, dark", "#1e1e1e"),
           ("Outlook / quoted reply", "#f4f4f4"),
           ("A stray coloured ground", "#0b2b3c")]

body = "".join(f'''
  <section>
    <p class="cap">{n} &nbsp;<code>{c}</code></p>
    <div class="ground" style="background:{c}">
      <p class="mail" style="color:{'#111' if c in ('#ffffff','#f4f4f4') else '#ddd'}">
        Thanks — sending the revised deck over tonight.<br><br>Scott</p>
      {LOCAL}
    </div>
  </section>''' for n, c in GROUNDS)

open("preview.html", "w").write(f'''<!doctype html><meta charset="utf-8">
<title>Socia Visual — signature proof</title>
<style>
 body{{background:#0a0a0a;color:#666;font:13px/1.5 ui-sans-serif,system-ui;
      margin:0;padding:32px;display:flex;flex-wrap:wrap;gap:24px}}
 section{{flex:0 0 auto}}
 .cap{{font:11px/1 ui-monospace,monospace;letter-spacing:.12em;
       text-transform:uppercase;color:#7a7a7a;margin:0 0 8px}}
 code{{color:#a8ff00}}
 .ground{{padding:22px;border-radius:6px;width:330px}}
 .mail{{font:14px/1.5 -apple-system,system-ui;margin:0 0 18px}}
</style>{body}''')
print("  preview.html")

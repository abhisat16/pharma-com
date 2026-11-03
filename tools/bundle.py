"""Bundle public/ into single-file builds.
   dist/Pharma-com.html          full standalone page (open in Chrome for live voice)
   dist/artifact.html         body-only page for a claude.ai artifact (shared link)"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
pub = root / 'public'
html = (pub / 'index.html').read_text()
css = (pub / 'styles.css').read_text()
core = (pub / 'core.js').read_text()
app = (pub / 'app.js').read_text()
vendor = (pub / 'vendor' / 'sarvam-agent.js').read_text()
fonts = re.search(r'<link rel="stylesheet" href="(https://fonts[^"]+)">', html).group(1)
body = html.split('<!--APP-START-->')[1].split('<!--APP-END-->')[0]
scripts = f'<script>\n{vendor}\n</script>\n<script>\n{core}\n</script>\n<script>\n{app}\n</script>'
(root / 'dist').mkdir(exist_ok=True)
full = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Pharma.com</title>
<link rel="stylesheet" href="{fonts}">
<style>
{css}</style></head>
<body>{body}{scripts}
</body></html>'''
(root / 'dist' / 'Pharma-com.html').write_text(full)
(root / 'index.html').write_text(full)  # GitHub Pages entry
art = f'''<title>Pharma.com</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="{fonts}">
<style>
{css}</style>
{body}{scripts}
'''
(root / 'dist' / 'artifact.html').write_text(art)
print('ok', len(full), len(art))

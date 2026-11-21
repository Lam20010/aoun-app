import re, sys, json
def compile_dc(src, out, title, extra_head='', extra_body='', blob_map=None, props=None, post_logic='', mount='Component'):
    s = open(src, encoding='utf-8').read()
    for k, v in (blob_map or {}).items(): s = s.replace(k, v)
    helmet = re.search(r'<helmet>(.*?)</helmet>', s, re.S).group(1)
    logic = re.search(r'<script type="text/x-dc"[^>]*>(.*?)</script>', s, re.S).group(1)
    body = s[s.index('</helmet>') + len('</helmet>'):]
    body = body[:body.index('<script type="text/x-dc"')]
    body = re.sub(r'</x-dc>.*', '', body, flags=re.S)
    html = f'''<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{title}</title>
{extra_head}
{helmet}
<style>html,body{{margin:0;padding:0}}#dc-root{{min-height:100dvh}}</style>
</head><body>
<div id="dc-root"></div>
<template id="dc-tpl">{body}</template>
<script src="dcrt.js"></script>
{extra_body}
<script>
{logic}
{post_logic}
window.__dc = DCmount(document.getElementById("dc-root"), document.getElementById("dc-tpl"), {mount}, {json.dumps(props or {})});
</script>
</body></html>'''
    open(out, 'w', encoding='utf-8').write(html)
    print('wrote', out, len(html))
if __name__ == '__main__':
    compile_dc(sys.argv[1], sys.argv[2], sys.argv[3])

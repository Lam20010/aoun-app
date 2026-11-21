from compile_dc import compile_dc
BM={'/_blob/aad49c9c38166d643a8b317cd15a08f5':'img/mark.png','/_blob/493972fb782dfdd8aa94c15f344a195c':'img/wordmark.png','/_blob/3fed7070c947086694a6b21da1c3bdc2':'img/ministry-logo.png','/_blob/9696cd0a861bad1a76006865402e9335':'geo/ksa-regions.json'}
HEAD='''<meta name="theme-color" content="#2F7F80">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="apple-mobile-web-app-title" content="عون">
<link rel="apple-touch-icon" href="img/icon-180.png"><link rel="icon" href="img/icon-192.png"><link rel="manifest" href="manifest.webmanifest">'''
compile_dc('../dcsrc/App.dc.html','../site3/index.html','عون',extra_head=HEAD,blob_map=BM,
  extra_body='<script src="data.js"></script><script src="places.js"></script><script src="el.js"></script>',
  post_logic=open('live.js',encoding='utf-8').read(), mount='AounApp')
compile_dc('../dcsrc/Ministry.dc.html','../site3/ministry.html','منصة عون · وزارة الصحة',extra_head='<meta name="theme-color" content="#2F7F80"><link rel="icon" href="img/icon-192.png">',blob_map=BM,
  extra_body='<script src="data.js"></script>', post_logic=open('ministry_live.js',encoding='utf-8').read(), mount='AounMinistry')

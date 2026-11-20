#!/usr/bin/env python3
"""One PDF page for each app screen, captured in Chromium."""
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from threading import Thread
from io import BytesIO
from PIL import Image
from playwright.sync_api import sync_playwright
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import os

root=Path(__file__).resolve().parent.parent
dest=root/'downloads'/'Aegypten-Exit-Game_Alle-Seiten.pdf'
jobs=[
('index.html','Station 1',['start','help','video','puzzle','question','symbol','door']),
('station2.html','Station 2',['info','memory','cloze','glyph','door']),
('station3.html','Station 3',['intro','info','sort','sentence','glyph','door']),
('station4.html','Station 4',['intro','explore','match','ammit','glyph','door']),
('ausklang.html','Ausklang',['outro1','outro2']),
('bonus.html','Bonusaufgabe',['game','victory'])]
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args): pass
def add(pdf,png,title):
 img=Image.open(BytesIO(png)).convert('RGB')
 if img.width>1600:img=img.resize((1600,round(img.height*1600/img.width)),Image.Resampling.LANCZOS)
 jpg=BytesIO()
 img.save(jpg,'JPEG',quality=86,optimize=True)
 jpg.seek(0)
 width=1120.
 height=img.height/img.width*width
 pageheight=max(700.,height+38.)
 pdf.setPageSize((width,pageheight))
 pdf.setFillColorRGB(.96,.93,.84)
 pdf.rect(0,0,width,pageheight,fill=1,stroke=0)
 pdf.drawImage(ImageReader(jpg),0,pageheight-height-18,width,height)
 pdf.setFillColorRGB(.35,.26,.17)
 pdf.setFont('Helvetica-Bold',10)
 pdf.drawString(18,10,'Aegypten-Exit-Game  |  '+title)
 pdf.setFont('Helvetica',9)
 pdf.drawRightString(width-18,10,str(pdf.getPageNumber()))
 pdf.showPage()
def main():
 os.chdir(root)
 dest.parent.mkdir(exist_ok=True,parents=True)
 server=ThreadingHTTPServer(('127.0.0.1',8765),Quiet)
 Thread(target=server.serve_forever,daemon=True).start()
 pdf=canvas.Canvas(str(dest),pageCompression=1)
 pdf.setTitle('Ägypten Exit-Game - Bildschirmseiten')
 total=0
 try:
  with sync_playwright() as p:
   browser=p.chromium.launch(args=['--no-sandbox','--disable-dev-shm-usage'],headless=True)
   context=browser.new_context(viewport={'width':1280,'height':850},device_scale_factor=1)
   for filename,label,states in jobs:
    page=context.new_page()
    page.goto('http://127.0.0.1:8765/'+filename,wait_until='domcontentloaded',timeout=60000)
    page.wait_for_timeout(1000)
    for state in states:
     selector=('#'+state) if filename=='bonus.html' else ('#screen-'+state)
     page.evaluate("""selector => {
       document.querySelectorAll('video,audio').forEach(x => {try{x.pause()}catch(e){}});
       document.querySelectorAll('.screen,[id^="screen-"],#game,#victory').forEach(el => {
         el.classList.add('hidden');el.setAttribute('aria-hidden','true');
       });
       const node=document.querySelector(selector);
       if(!node)throw Error('Missing screen: '+selector);
       node.classList.remove('hidden');node.setAttribute('aria-hidden','false');
       const css=document.getElementById('pdf-export-style')||document.createElement('style');
       css.id='pdf-export-style';
       css.textContent='*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}';
       document.head.appendChild(css);
       window.scrollTo(0,0);
     }""",selector)
     page.wait_for_timeout(100)
     node=page.locator(selector)
     parent=node.locator('xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " frame ")][1]')
     picture=(parent if parent.count() else node).screenshot(type='png',animations='disabled',timeout=60000)
     add(pdf,picture,label+' - '+state)
     total+=1
     print(total,filename,state,flush=True)
    page.close()
   browser.close()
 finally:
  pdf.save()
  server.shutdown()
 print('PDF CREATED:',dest,'PAGES:',total,'BYTES:',dest.stat().st_size,flush=True)
if __name__=='__main__':main()

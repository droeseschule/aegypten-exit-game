#!/usr/bin/env python3
"""Capture each current student-app screen, including both endings and help cards."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
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
('index.html','Station 1 · Mumifizierung',['start','help','video','puzzle','question','symbol','door']),
('station2.html','Station 2 · Kanopen',['info','memory','cloze','glyph','door']),
('station3.html','Station 3 · Grabbeigaben',['intro','info','sort','sentence','glyph','door']),
('station4.html','Station 4 · Totengericht',['intro','explore','match','ammit','glyph','door']),
('ausklang.html','Regulärer Ausklang',['outro1','outro2']),
('ewiges-leben.html','Zusatzaufgabe',['worksheet']),
('bonus.html','Kreuzworträtsel',['game','victory']),
('zeitende.html','Alternativer Abschluss',['warning','scene1','scene2','scene3','finish'])]
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass

def add(pdf,png,title):
    img=Image.open(BytesIO(png)).convert('RGB')
    if img.width>1800: img=img.resize((1800,round(img.height*1800/img.width)),Image.Resampling.LANCZOS)
    jpg=BytesIO()
    img.save(jpg,'JPEG',quality=90,optimize=True)
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
    pdf.drawString(18,10,'Ägypten-Exit-Game  |  '+title)
    pdf.setFont('Helvetica',9)
    pdf.drawRightString(width-18,10,str(pdf.getPageNumber()))
    pdf.showPage()

CSS='*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}'

def prepare(page):
    page.add_style_tag(content=CSS)
    page.evaluate("""() => {document.querySelectorAll('video,audio').forEach(a=>{a.pause();a.autoplay=false});window.scrollTo(0,0)}""")
    page.wait_for_timeout(150)

def select_screen(page,selector):
    page.evaluate("""selector => {
        document.querySelectorAll('video,audio').forEach(x=>x.pause());
        document.querySelectorAll('.screen,#game,#victory').forEach(el=>{
            el.classList.add('hidden');el.setAttribute('aria-hidden','true');
        });
        const node=document.querySelector(selector);
        if(!node)throw Error('Missing screen: '+selector);
        node.classList.remove('hidden');node.setAttribute('aria-hidden','false');
        if(selector==='#screen-door'){
            for(const id of ['door-complete','door-finished','door-complete3','door4-complete']){
                const e=document.getElementById(id);if(e)e.classList.remove('hidden');
            }
            for(const id of ['insert-tile','second-tile','third-tile','tile4']){
                const e=document.getElementById(id);if(e)e.classList.add(id==='insert-tile'?'placed':'done');
            }
            const status=document.getElementById('door4-status');if(status)status.textContent='Die Grabkammer ist entriegelt!';
        }
        window.scrollTo(0,0);
    }""",selector)

def image_ready(page,selector):
    page.locator(selector).evaluate("""async node=>{
        const imgs=[...node.querySelectorAll('img')].filter(x=>!x.hidden&&x.getClientRects().length);
        await Promise.all(imgs.map(x=>x.decode().catch(()=>{})));
        await document.fonts.ready;
    }""")

def shot(page,selector):
    image_ready(page,selector)
    return page.locator(selector).screenshot(type='png',animations='disabled',timeout=60000)

def ending(page,state):
    # Direct view of the real ending page; freeze playback and show each exact scene independently.
    page.evaluate("""async state=>{
        const warning=document.getElementById('warning'), scene=document.getElementById('scene'),
              finish=document.getElementById('finish'), controls=document.getElementById('controls');
        document.getElementById('voice').pause();
        controls.hidden=true;warning.hidden=state!=='warning';finish.hidden=state!=='finish';
        scene.hidden=!state.startsWith('scene');
        if(!scene.hidden){scene.src='zeitende-bild'+state.slice(-1)+'.webp';await scene.decode()}
    }""",state)
    return shot(page,'main')

def dialog(page,selector):
    page.evaluate("""selector=>{
        const e=document.querySelector(selector);
        e.hidden=false;e.classList.remove('hidden');
        e.style.setProperty('max-height','none','important');
        e.style.setProperty('overflow','visible','important');
        const parent=e.parentElement;
        parent.hidden=false;parent.classList.remove('hidden');
        parent.style.setProperty('position','absolute','important');
        parent.style.setProperty('align-items','start','important');
        parent.style.setProperty('overflow','visible','important');
        parent.style.setProperty('height','auto','important');
        e.querySelectorAll('*').forEach(n=>{
            if(getComputedStyle(n).overflowY==='auto'||getComputedStyle(n).overflowY==='scroll'){
                n.style.setProperty('max-height','none','important');
                n.style.setProperty('overflow','visible','important');
            }
        });
    }""",selector)
    return shot(page,selector)

def main():
    os.chdir(root)
    dest.parent.mkdir(exist_ok=True,parents=True)
    server=ThreadingHTTPServer(('127.0.0.1',8765),Quiet)
    Thread(target=server.serve_forever,daemon=True).start()
    temp=dest.with_suffix('.tmp.pdf')
    pdf=canvas.Canvas(str(temp),pageCompression=1)
    pdf.setTitle('Ägypten Exit-Game – alle Schüleransichten')
    total=0
    def emit(png,title):
        nonlocal total
        add(pdf,png,title);total+=1;print(total,title,flush=True)
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(args=['--no-sandbox','--disable-dev-shm-usage'],headless=True)
            context=browser.new_context(viewport={'width':1280,'height':850},device_scale_factor=1,reduced_motion='reduce')
            context.add_init_script("localStorage.setItem('egypt-exit-mumification-video-complete-v1','1')")
            # Bonus screen normally requires a locally saved worksheet. Seed a fictitious receipt only in the export browser.
            context.add_init_script("sessionStorage.setItem('aegypten-worksheet-receipt-v1',JSON.stringify({id:'pdf-preview',snapshot:{},mode:'local'}))")
            # The export uses no live session and cannot send pupil data.
            context.route('https://**/*supabase.co/**',lambda route:route.abort())
            context.route('https://raw.githubusercontent.com/**',lambda route:route.abort())
            for filename,label,states in jobs:
                page=context.new_page()
                page.goto('http://127.0.0.1:8765/'+filename,wait_until='domcontentloaded',timeout=60000)
                page.wait_for_timeout(700)
                prepare(page)
                for state in states:
                    if filename=='zeitende.html':
                        png=ending(page,state)
                    elif filename=='ewiges-leben.html':
                        png=shot(page,'main.wrap')
                    else:
                        selector=('#'+state) if filename=='bonus.html' else ('#screen-'+state)
                        if filename=='index.html' and state=='puzzle':
                            page.evaluate("document.getElementById('video-next').click()")
                        select_screen(page,selector)
                        # All screens are initialized by their original JS; verify dynamic task content.
                        checks={'puzzle':'#steps > *','memory':'#memory-board .memory-card','sentence':'#sentence-pieces .sentence-piece','match':'#match-pool .s4-card','game':'#crossword > *'}
                        if state in checks and page.locator(checks[state]).count()==0:
                            raise RuntimeError('Missing dynamic task content: '+filename+' '+state)
                        png=shot(page,'main.wrap')
                    emit(png,label+' - '+state)
                if filename=='ewiges-leben.html':
                    emit(dialog(page,'#help-card'),label+' - Hilfekarte')
                elif filename=='bonus.html':
                    emit(dialog(page,'#help-overlay .helper-card'),label+' - Wortbank')
                elif filename in ('index.html','station2.html','station3.html','station4.html'):
                    if page.locator('#station-glossary').count():
                        modal=page.locator('#station-glossary > *').first
                        selector='#station-glossary > '+modal.evaluate('(e)=>e.tagName.toLowerCase()')
                        emit(dialog(page,selector),label+' - Glossar')
                page.close()
            browser.close()
    finally:
        pdf.save()
        server.shutdown()
    if total!=40: raise RuntimeError('Unexpected page count: '+str(total))
    temp.replace(dest)
    print('PDF CREATED:',dest,'PAGES:',total,'BYTES:',dest.stat().st_size,flush=True)
if __name__=='__main__':main()

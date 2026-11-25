#!/usr/bin/env python3
"""Export the actual teacher app with synthetic local data only."""
from export_app_pdf import root, Quiet, add, prepare, shot
from http.server import ThreadingHTTPServer
from threading import Thread
from playwright.sync_api import sync_playwright
from reportlab.pdfgen import canvas
import os

dest=root/'downloads'/'Aegypten-Exit-Game_Lehrkraft-App.pdf'
def main():
    os.chdir(root)
    dest.parent.mkdir(exist_ok=True,parents=True)
    server=ThreadingHTTPServer(('127.0.0.1',8766),Quiet)
    Thread(target=server.serve_forever,daemon=True).start()
    temp=dest.with_suffix('.tmp.pdf')
    pdf=canvas.Canvas(str(temp),pageCompression=1)
    pdf.setTitle('Ägypten Exit-Game – Lehrkraft-App')
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(args=['--no-sandbox','--disable-dev-shm-usage'])
            context=browser.new_context(viewport={'width':1280,'height':850},device_scale_factor=1)
            # Block ALL non-local connections, including auth and database requests.
            def local_only(route):
                if route.request.url.startswith('http://127.0.0.1:8766/'):route.continue_()
                else:route.abort()
            context.route('**/*',local_only)
            page=context.new_page()
            page.goto('http://127.0.0.1:8766/lehrkraft.html',wait_until='domcontentloaded')
            prepare(page)
            add(pdf,shot(page,'main'),'Lehrkraft-App - Anmeldung')
            page.evaluate("""() => {
                const now=Date.now();
                const s={id:'demo',title:'Beispielklasse – Totenkult',join_code:'VORSCHAU-KEIN-ECHTER-LINK',created_at:new Date(now).toISOString(),expires_at:new Date(now+7*86400000).toISOString(),closed_at:null,timer_minutes:35};
                sessions=[s];selected=s.id;
                const examples=[[3,3,12],[8,8,7],[14,14,21],[20,20,5],[23,23,190],[26,26,9],[29,29,4]];
                rows=examples.map(([current_step,furthest_step,seconds],i)=>({id:'demo-'+i,alias:'Beispiel '+(i+1),current_step,furthest_step,updated_at:new Date(now-seconds*1000).toISOString()}));
                $('login').hidden=true;$('cockpit').hidden=false;
                $('session').replaceChildren(new Option(s.title+' · offen',s.id));$('session').value=s.id;
                sessionUi();render();$('joinlink').value='Beispiel-Link (nicht aktiv)';
                say('PDF-Vorschau · Ausschließlich fiktive Beispieldaten · Keine Live-Verbindung');
            }""")
            if page.locator('#rows tr').count()!=7:raise RuntimeError('Example table missing')
            if page.locator('#timer-minutes').input_value()!='35':raise RuntimeError('Timer default missing')
            add(pdf,shot(page,'main'),'Lehrkraft-App - Cockpit (fiktive Daten)')
            browser.close()
    finally:
        pdf.save();server.shutdown()
    temp.replace(dest)
    print('TEACHER PDF CREATED:',dest,'PAGES: 2',flush=True)
if __name__=='__main__':main()

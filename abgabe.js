(function(){
'use strict';
const $=id=>document.getElementById(id), fields=[$('student-name'),$('answer-1'),$('answer-2'),$('answer-3')];
const code=$('class-code'), submit=$('submit-worksheet'), next=$('continue-crossword'), status=$('submit-status'), download=$('download-worksheet');
const receiptKey='aegypten-worksheet-receipt-v1', nameKey='aegypten-worksheet-first-name-v2';
const get=k=>{try{return sessionStorage.getItem(k)}catch(e){return null}};
const set=(k,v)=>{try{sessionStorage.setItem(k,v);return true}catch(e){return false}};
const remove=k=>{try{sessionStorage.removeItem(k)}catch(e){}};
const snapshot=()=>JSON.stringify(fields.map(f=>f.value.trim()));
let busy=false;
remove('aegypten-worksheet-name-v1');
fields[0].value=get(nameKey)||'';
function receipt(){try{return JSON.parse(get(receiptKey)||'null')}catch(e){return null}}
function saved(){const r=receipt();return !!(r&&r.id&&r.snapshot===snapshot()&&fields.every(f=>f.value.trim()))}
function message(t,kind){status.textContent=t;status.dataset.kind=kind||''}
function update(){next.disabled=busy||!saved();submit.disabled=busy||saved();download.disabled=busy;fields.forEach(f=>f.readOnly=busy);code.disabled=busy}
fields.forEach(f=>f.addEventListener('input',()=>{set(nameKey,fields[0].value);remove(receiptKey);message('Speichere deine Antworten, um das Kreuzworträtsel freizuschalten.');update()}));
function valid(){const f=fields.find(f=>!f.value.trim());if(f){message('Trage deinen Vornamen und Antworten zu allen drei Aufgaben ein.','error');f.focus();return false}return true}
function wrap(ctx,txt,max){const out=[];for(const para of txt.split(/\r?\n/)){let line='';for(const word of para.split(/\s+/).filter(Boolean)){if(ctx.measureText(word).width>max){if(line){out.push(line);line=''}for(const ch of word){if(ctx.measureText(line+ch).width>max){out.push(line);line=''}line+=ch}}else if(line&&ctx.measureText(line+' '+word).width>max){out.push(line);line=word}else line+=(line?' ':'')+word}out.push(line)}return out}
async function getArt(){const img=$('original-art');if(!img.hidden&&img.complete&&img.naturalWidth)return img;const svg=$('diagram-fallback').cloneNode(true);svg.removeAttribute('style');svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','820');svg.setAttribute('height','500');const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'});const url=URL.createObjectURL(blob);try{return await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=url})}finally{URL.revokeObjectURL(url)}}
async function makePdf(){
const W=1240,H=1754,M=85;const pages=[];let c,ctx,y;
function page(){c=document.createElement('canvas');c.width=W;c.height=H;ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#124b79';ctx.fillRect(M,55,W-2*M,9);ctx.fillStyle='#663b18';ctx.font='bold 43px Arial';ctx.fillText('Das Geheimnis des ewigen Lebens',M,119);ctx.font='27px Arial';ctx.fillStyle='#252525';let nameLines=wrap(ctx,'Vorname: '+fields[0].value.trim(),W-2*M);y=164;for(const l of nameLines){ctx.fillText(l,M,y);y+=34}y+=20;pages.push(c)}
function lines(txt,font,color,step){ctx.font=font;const list=wrap(ctx,txt,W-2*M);for(const l of list){if(y+step>H-105){page();ctx.font=font}ctx.fillStyle=color;ctx.fillText(l,M,y);y+=step}}
page();const art=await getArt();const aw=W-2*M, ah=Math.round(aw*(art.naturalHeight||500)/(art.naturalWidth||820));const height=Math.min(ah,650);ctx.drawImage(art,M,y,aw,height);y+=height+48;
for(let i=1;i<=3;i++){const question=document.querySelector('label[for="answer-'+i+'"]').textContent; if(y>H-245)page();lines(i+'. '+question,'bold 30px Arial','#663b18',39);y+=12;lines(fields[i].value.trim(),'29px Arial','#202020',40);y+=35}
for(let i=0;i<pages.length;i++){const g=pages[i].getContext('2d');g.font='22px Arial';g.fillStyle='#555';g.fillText('Geschichte · Klasse 6',M,H-45);g.textAlign='right';g.fillText('Seite '+(i+1)+' / '+pages.length,W-M,H-45)}
const enc=new TextEncoder(), parts=[], offsets=[0];let bytes=0;
function add(s){const a=typeof s==='string'?enc.encode(s):s;parts.push(a);bytes+=a.length}
function obj(n,body){offsets[n]=bytes;add(n+' 0 obj\n');add(body);add('\nendobj\n')}
add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Count '+pages.length+' /Kids ['+pages.map((p,i)=>(3+i*3)+' 0 R').join(' ')+'] >>');
for(let i=0;i<pages.length;i++){const n=3+i*3, jpeg=atob(pages[i].toDataURL('image/jpeg',0.8).split(',')[1]), data=Uint8Array.from(jpeg,x=>x.charCodeAt(0));obj(n,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 '+(n+1)+' 0 R >> >> /Contents '+(n+2)+' 0 R >>');offsets[n+1]=bytes;add((n+1)+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+W+' /Height '+H+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+data.length+' >>\nstream\n');add(data);add('\nendstream\nendobj\n');const stream='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n';obj(n+2,'<< /Length '+enc.encode(stream).length+' >>\nstream\n'+stream+'endstream')}
const xref=bytes;add('xref\n0 '+offsets.length+'\n0000000000 65535 f \n');for(let i=1;i<offsets.length;i++)add(String(offsets[i]).padStart(10,'0')+' 00000 n \n');add('trailer\n<< /Size '+offsets.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');return new Blob(parts,{type:'application/pdf'})
}
function endpoint(){try{const u=new URL(window.AEGYPTEN_ABGABE_URL||'');return u.protocol==='https:'?u.href:''}catch(e){return ''}}
download.addEventListener('click',async()=>{if(!valid())return;busy=true;update();try{const pdf=await makePdf(),url=URL.createObjectURL(pdf),a=document.createElement('a');a.href=url;a.download=fields[0].value.trim().replace(/[^\p{L}\p{N}_-]+/gu,'_')+'_Ewiges_Leben.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);message('PDF-Kopie erstellt. Für das Weitergehen musst du das Arbeitsblatt noch abgeben.')}catch(e){message('PDF konnte nicht erstellt werden. Bitte erneut versuchen.','error')}finally{busy=false;update()}});
submit.addEventListener('click',async()=>{if(!valid())return;const url=endpoint();if(!url){message('Die zentrale Abgabe ist noch nicht eingerichtet. Bitte melde dich bei deiner Lehrkraft.','error');return}if(!code.value.trim()){message('Gib den Abgabecode deiner Lehrkraft ein.','error');code.focus();return}busy=true;update();message('Dein Arbeitsblatt wird erstellt und abgegeben …');try{const pdf=await makePdf();if(pdf.size>4000000)throw Error('Die Datei ist zu groß.');const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/pdf','X-Class-Code':code.value.trim()},body:pdf,cache:'no-store'});const data=await res.json();if(!res.ok||data.ok!==true||!data.id)throw Error(data.error||'Abgabe nicht bestätigt.');if(!set(receiptKey,JSON.stringify({id:data.id,snapshot:snapshot()})))throw Error('Die Abgabe wurde gespeichert, aber der Browser blockiert den Sitzungsnachweis. Bitte melde dich bei deiner Lehrkraft.');code.value='';message('Dein Arbeitsblatt wurde erfolgreich abgegeben. Du kannst jetzt weitergehen.','success')}catch(e){message(e.message||'Abgabe fehlgeschlagen. Bitte erneut versuchen.','error')}finally{busy=false;update()}});
next.addEventListener('click',()=>{if(saved())location.assign('bonus.html')});
window.addEventListener('pageshow',()=>{if(saved())message('Dein Arbeitsblatt wurde erfolgreich abgegeben. Du kannst jetzt weitergehen.','success');update()});
if(saved())message('Dein Arbeitsblatt wurde erfolgreich abgegeben. Du kannst jetzt weitergehen.','success');
else if(!endpoint())message('Die zentrale Abgabe ist noch nicht eingerichtet. Bitte melde dich bei deiner Lehrkraft.','error');
update();
})();
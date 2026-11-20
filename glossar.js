
(function(){
'use strict';
var STATIONEN={
 "1":{name:"Mumifizierung",begriffe:[
 ["Verstorbene","Menschen, die gestorben sind."],
 ["Mumie","Ein toter Körper, der besonders behandelt wurde, damit er lange erhalten bleibt."],
 ["Mumifizierung","So machten die Ägypter einen toten Körper haltbar."],
 ["Einbalsamierer","Ein Mensch, der Tote zu Mumien machte."],
 ["Organe","Wichtige Teile im Körper, zum Beispiel Herz, Lunge oder Magen."],
 ["Natron","Ein besonderes Salz, mit dem die Ägypter tote Körper trockneten."],
 ["Harz","Eine klebrige Flüssigkeit, die von manchen Bäumen stammt."],
 ["Leinenbinden","Lange Stoffstreifen, mit denen die Mumie eingewickelt wurde."]
 ]},
 "2":{name:"Kanopen und Schutzgötter",begriffe:[
 ["Kanopen","Gefäße, in denen die Ägypter Organe von Toten aufbewahrten."],
 ["Kanopenkasten","Eine Kiste, in der die Kanopen aufbewahrt wurden."],
 ["Schutzgötter","Götter, die nach dem Glauben der Ägypter die Organe beschützten."],
 ["Amset","Schutzgott mit Menschenkopf. Er beschützte die Leber."],
 ["Hapi","Schutzgott mit Paviankopf. Er beschützte die Lunge."],
 ["Duamutef","Schutzgott mit Schakalkopf. Er beschützte den Magen."],
 ["Kebechsenuef","Schutzgott mit Falkenkopf. Er beschützte den Darm."]
 ]},
 "3":{name:"Grabbeigaben",begriffe:[
 ["Grabbeigaben","Dinge, die einem Toten mit ins Grab gelegt wurden."],
 ["Uschebtis","Kleine Figuren, die für Tote im Jenseits arbeiten sollten."],
 ["Pharao","Der König des Alten Ägypten."],
 ["Schutzamulett","Ein kleiner Gegenstand, der seinen Besitzer beschützen sollte."]
 ]},
 "4":{name:"Totengericht",begriffe:[
 ["Totengericht","Hier entschieden die Götter, ob ein Toter im Jenseits weiterleben durfte."],
 ["Herzwägung","Das Herz eines Toten wurde mit einer Feder verglichen."],
 ["Maat","Göttin der Wahrheit und Gerechtigkeit."],
 ["Isis","Göttin der Magie und eine Beschützerin der Toten."],
 ["Anubis","Gott mit Schakalkopf. Er half beim Wiegen des Herzens."],
 ["Osiris","Gott des Totenreichs. Er war Richter beim Totengericht."],
 ["Ammit","Ein gefährliches Wesen, das das Herz eines Toten fressen konnte."],
 ["Sünden","Dinge, die ein Mensch getan hat und die als falsch gelten."]
 ]}
};
var UEBERGREIFEND=[
 ["Jenseits","Das Leben nach dem Tod, an das die Ägypter glaubten."],
 ["Seele","Ein unsichtbarer Teil des Menschen, der nach manchen Vorstellungen nach dem Tod weiterlebt."],
 ["Hieroglyphen","Die Schriftzeichen der alten Ägypter."],
 ["Totenreich","Die Welt der Toten."],
 ["Wiedergeburt","Wenn jemand nach dem Tod erneut zum Leben kommt."]
];
function make(tag,cls,txt){var el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el}
function init(){
 var script=document.querySelector('script[data-glossar-station]');
 var station=script&&STATIONEN[script.getAttribute('data-glossar-station')];
 if(!station)return;
 var screens=document.querySelectorAll('section.screen');
 if(!screens.length)return;
 var previousFocus=null,previousOverflow='';
 var backdrop=make('div','glossar-overlay');backdrop.id='station-glossary';backdrop.hidden=true;
 backdrop.setAttribute('role','dialog');backdrop.setAttribute('aria-modal','true');backdrop.setAttribute('aria-labelledby','glossar-titel');
 var fenster=make('div','glossar-fenster');
 var kopf=make('div','glossar-kopf');
 kopf.appendChild(make('h2','', '📖 Glossar'));
 kopf.querySelector('h2').id='glossar-titel';
 var close=make('button','glossar-schliessen','✕ Schließen');close.type='button';kopf.appendChild(close);
 var body=make('div','glossar-inhalt');
 body.appendChild(make('p','glossar-hinweis','Hier kannst du unbekannte Wörter nachschlagen. Das Spiel bleibt an derselben Stelle.'));
 function addSection(heading,entries){
  body.appendChild(make('h3','',heading));
  var dl=make('dl','glossar-eintraege');
  entries.forEach(function(pair){var box=make('div','glossar-eintrag');box.appendChild(make('dt','',pair[0]));box.appendChild(make('dd','',pair[1]));dl.appendChild(box)});
  body.appendChild(dl);
 }
 addSection('Begriffe dieser Station: '+station.name,station.begriffe);
 body.appendChild(make('hr','glossar-trenner'));
 addSection('Übergreifende Begriffe',UEBERGREIFEND);
 fenster.appendChild(kopf);fenster.appendChild(body);backdrop.appendChild(fenster);document.body.appendChild(backdrop);
 function open(){
  previousFocus=document.activeElement;previousOverflow=document.body.style.overflow;
  backdrop.hidden=false;document.body.style.overflow='hidden';close.focus();
 }
 function shut(){
  if(backdrop.hidden)return;
  backdrop.hidden=true;document.body.style.overflow=previousOverflow;
  if(previousFocus&&document.contains(previousFocus))previousFocus.focus();
 }
 close.addEventListener('click',shut);
 backdrop.addEventListener('click',function(ev){if(ev.target===backdrop)shut()});
 backdrop.addEventListener('keydown',function(ev){
  if(ev.key==='Escape'){ev.preventDefault();shut();return}
  if(ev.key==='Tab'){
   var focusables=[close].concat(Array.prototype.slice.call(body.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])')));
   var first=focusables[0],last=focusables[focusables.length-1];
   if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus()}
   else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus()}
  }
 });
 screens.forEach(function(screen){
  var bar=make('div','glossar-leiste');
  var button=make('button','glossar-oeffnen','📖 Glossar');
  button.type='button';
  button.setAttribute('aria-haspopup','dialog');
  button.setAttribute('aria-label','Glossar für '+station.name+' öffnen');
  button.addEventListener('click',open);
  bar.appendChild(button);
  screen.insertBefore(bar,screen.firstChild);
 });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();

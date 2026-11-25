(function () {
  'use strict';

  // Restart controls in stations 1–4 and in the crossword bonus.
  const restartButtons = new Set([
    'replay', 'memory-reset', 'station2-replay',
    'sort-reset', 'sentence-reset', 'replay-station3',
    'match-reset', 'replay-station4', 'crossword-reset'
  ]);
  const approved = new WeakSet();
  let pending = null;
  let previousFocus = null;

  const style = document.createElement('style');
  style.textContent = [
    '.neustart-overlay[hidden]{display:none!important}',
    '.neustart-overlay{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(22,13,8,.78)}',
    '.neustart-box{width:min(100%,450px);background:#fff0d1;color:#402a1c;border:4px solid #b77a30;border-radius:20px;box-shadow:0 12px 48px rgba(0,0,0,.45);padding:24px 22px;text-align:center;font-family:"Trebuchet MS",Arial,sans-serif}',
    '.neustart-box h2{color:#663b18;font-size:clamp(22px,5vw,29px);line-height:1.25;margin:0 0 23px}',
    '.neustart-actions{display:flex;justify-content:center;gap:14px;flex-wrap:wrap}',
    '.neustart-actions button{min-width:115px;min-height:52px;border-radius:13px;padding:10px 22px;font:900 18px "Trebuchet MS",Arial,sans-serif;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent}',
    '.neustart-yes{color:#3d250c;background:linear-gradient(#ffdf7b,#e8a12a);border:3px solid #9f5e19}',
    '.neustart-no{color:#674721;background:#fff9e9;border:2px solid #b78c4d}',
    '.neustart-actions button:focus-visible{outline:3px solid #0e86cf;outline-offset:3px}'
  ].join('');
  document.head.appendChild(style);

  const overlay = document.createElement('div');
  overlay.className = 'neustart-overlay';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'neustart-frage');
  overlay.innerHTML = '<div class="neustart-box"><h2 id="neustart-frage">Willst du wirklich neu starten?</h2><div class="neustart-actions"><button type="button" class="neustart-yes">Ja</button><button type="button" class="neustart-no">Nein</button></div></div>';
  document.body.appendChild(overlay);

  const yes = overlay.querySelector('.neustart-yes');
  const no = overlay.querySelector('.neustart-no');

  function close() {
    overlay.hidden = true;
    pending = null;
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
  }

  function accept() {
    const action = pending;
    close();
    if (action) action();
  }

  no.addEventListener('click', close);
  yes.addEventListener('click', accept);
  overlay.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      if (!event.shiftKey && document.activeElement === no) {
        event.preventDefault(); yes.focus();
      } else if (event.shiftKey && document.activeElement === yes) {
        event.preventDefault(); no.focus();
      }
    }
  });

  function isRestart(element) {
    if (restartButtons.has(element.id)) return true;
    if (element.tagName !== 'A') return false;
    const href = element.getAttribute('href') || '';
    return /(?:^|\/)index\.html(?:[?#].*)?$/i.test(href)
      && /Exit-Game von vorne starten/i.test(element.textContent);
  }

  function executeRestart(element) {
    if (element.id === 'crossword-reset') {
      try {
        localStorage.removeItem('aegypten-bonus-kreuzwort-v1');
        localStorage.removeItem('aegypten-bonus-geloest-v1');
      } catch (_) { /* Storage may be disabled. */ }
      window.location.reload();
    } else if (element.tagName === 'A') {
      try { ['aegypten-worksheet-receipt-v1','aegypten-worksheet-name-v1','aegypten-worksheet-first-name-v2','aegypten-ewiges-leben-answer-1','aegypten-ewiges-leben-answer-2','aegypten-ewiges-leben-answer-3'].forEach(function(key){sessionStorage.removeItem(key);}); sessionStorage.removeItem('aegypten-time-limit-v1'); } catch (_) {}
      window.location.assign(element.href);
    } else {
      // Let the existing station-specific restart logic run unchanged.
      approved.add(element);
      try { element.click(); } finally { approved.delete(element); }
    }
  }

  document.addEventListener('click', function (event) {
    if (!overlay.hidden) return;
    const element = event.target.closest('button,a');
    if (!element || !isRestart(element) || approved.has(element)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    previousFocus = element;
    pending = function () { executeRestart(element); };
    overlay.hidden = false;
    no.focus();
  }, true);
})();


/* Hidden per-tab lesson time limit. Enabled only when all ending assets are published. */
(function(){
  'use strict';
  const KEY='aegypten-time-limit-v1', LIMIT=35*60*1000;
  const page=location.pathname.split('/').pop()||'index.html';
  if(!['index.html','station2.html','station3.html','station4.html','ausklang.html','bonus.html'].includes(page))return;
  const get=()=>{try{return JSON.parse(sessionStorage.getItem(KEY)||'null')}catch(e){return null}};
  const put=s=>{try{sessionStorage.setItem(KEY,JSON.stringify(s));return true}catch(e){return false}};
  const scope=()=>{
    try{
      const p=new URLSearchParams(location.search), h=new URLSearchParams(location.hash.slice(1));
      const code=h.get('s')||p.get('s')||(JSON.parse(sessionStorage.getItem('egypt-live-v1')||'null')||{}).code;
      return /^[0-9a-f]{32}$/.test(code||'')?code:'solo';
    }catch(e){return 'solo'}
  };
  const runScope=scope();
  let state=get();
  if(state&&state.scope!==runScope){try{sessionStorage.removeItem(KEY)}catch(e){}state=null}
  let pendingStart=0, availability=null, navigating=false;
  let duration=35, settingsReady=runScope==='solo', lastSettingsAt=0;
  function validMinutes(v){return Number.isInteger(v)&&v>=1&&v<=120}
  function applySettings(v){if(!validMinutes(v))return;duration=v;settingsReady=true;lastSettingsAt=Date.now();if(state&&state.phase==='running'){state.startedAt=state.startedAt||state.deadline-LIMIT;state.deadline=state.startedAt+duration*60000;state.minutes=duration;put(state)}check()}
  window.addEventListener('egypt-timer-setting',e=>applySettings(e.detail));
  const active=id=>{const el=document.getElementById(id);return !!el&&!el.classList.contains('hidden')&&el.getAttribute('aria-hidden')!=='true'};
  function finish(){
    if(!state||state.phase!=='running')return;
    state.phase='complete';put(state);
  }
  function expire(){
    if(navigating)return;
    if(state.phase==='running'){state.phase='expired';if(!put(state))return}
    navigating=true;
    document.querySelectorAll('audio,video').forEach(a=>{try{a.pause()}catch(e){}});
    location.replace(new URL('zeitende.html',location.href).href);
  }
  function check(){
    if(navigating)return;
    // An accepted start changes the visible screen; failed name validation or join does not start the clock.
    if(page==='index.html'&&pendingStart&&active('screen-help')&&!state){
      state={scope:runScope,startedAt:pendingStart,deadline:pendingStart+duration*60000,minutes:duration,phase:'running',enabled:availability};
      if(!put(state)){state=null;pendingStart=0;return}
      pendingStart=0;
    }
    if(!state)return;
    if(state.phase==='expired'||state.phase==='ended'){expire();return}
    if(state.phase!=='running')return;
    // The final door animation has genuinely completed (not merely the matching exercise).
    if(page==='ausklang.html'||page==='bonus.html'||(page==='station4.html'&&active('screen-door')&&active('door4-complete'))){
      if(Date.now()<=state.deadline||page==='ausklang.html'||page==='bonus.html'){finish();return}
    }
    if(state.enabled===null&&availability!==null){state.enabled=availability;put(state)}
    if(state.enabled===true&&Date.now()>=state.deadline){
      // Ask for the latest teacher setting just before expiry. If offline, use the last known deadline after a short grace period.
      if(runScope!=='solo'&&Date.now()-lastSettingsAt>12000){window.dispatchEvent(new Event('egypt-timer-refresh'));if(Date.now()-state.deadline<15000)return}
      expire();
    }
  }
  if(page==='index.html'){
    const button=document.getElementById('start-button');
    if(button)document.addEventListener('click',e=>{
      if(!button.contains(e.target)||button.disabled||!active('screen-start')||state)return;
      const input=document.getElementById('start-student-name');
      if(!input||!input.value.trim())return;
      // The live join handler may replay the click programmatically after the RPC.
      if(e.isTrusted||!pendingStart)pendingStart=Date.now();
    },true);
  }
  // Keep the old game usable if media have not yet been uploaded. HEAD requests do not download media.
  async function assetsReady(){
    try{
      const response=await fetch('zeitende-medien.json',{cache:'no-store'});
      if(!response.ok)return false;
      const manifest=await response.json();
      if(manifest.version!==1||manifest.ready!==true)return false;
      const expected=[1,2,3].flatMap(i=>['zeitende-bild'+i+'.webp','zeitende-audio'+i+'.mp3']);
      const files=await Promise.all(expected.map(f=>fetch(f,{method:'HEAD',cache:'no-store'})));
      return files.every(r=>r.ok);
    }catch(e){return false}
  }
  if(state&&state.phase==='running'){state.startedAt=state.startedAt||state.deadline-LIMIT;duration=validMinutes(state.minutes)?state.minutes:35;put(state)}
  if(!state||state.enabled===null)assetsReady().then(ok=>{availability=ok;check()});
  else availability=state.enabled;
  new MutationObserver(check).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class','aria-hidden']});
  setInterval(check,500);
  window.addEventListener('pageshow',()=>{
    // Re-read the state after BFCache navigation.
    const saved=get();
    if(saved&&saved.scope===runScope)state=saved;
    else if(!saved)state=null;
    navigating=false;check();
  });
  document.addEventListener('visibilitychange',check);
  check();
})();

;(function(){var s=document.createElement('script');s.src='live-fortschritt.js?v=2';document.body.appendChild(s)})();

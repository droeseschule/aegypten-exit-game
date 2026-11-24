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
      try { ['aegypten-worksheet-receipt-v1','aegypten-worksheet-name-v1','aegypten-ewiges-leben-answer-1','aegypten-ewiges-leben-answer-2','aegypten-ewiges-leben-answer-3'].forEach(function(key){sessionStorage.removeItem(key);}); } catch (_) {}
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

/* main.js — Edward IA (chat full screen) */

/*
 Regras:
 - Não coloque sua OpenAI key aqui.
 - A função Netlify (/.netlify/functions/edward) deve existir e usar OPENAI_API_KEY no servidor.
 - Este script envia { prompt, lang } via POST para a função.
*/

const CHAT_KEY = 'edward_chat_history_v1'; // localStorage key

const chatList = document.getElementById('chatList');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const langSelect = document.getElementById('langSelect');

let history = []; // { role: 'user'|'bot', text: '...' }

// ---------- helpers ----------
function saveHistory() {
  try { localStorage.setItem(CHAT_KEY, JSON.stringify(history)); } catch(e){}
}
function loadHistory() {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    history = raw ? JSON.parse(raw) : [];
  } catch(e){ history = []; }
}
function clearHistory() {
  history = [];
  saveHistory();
  renderHistory();
}
function appendToHistory(role, text) {
  history.push({ role, text, ts: Date.now() });
  saveHistory();
}
function sanitize(text){
  // simples: evita tags
  return text.replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function createMessageEl(role, text){
  const el = document.createElement('div');
  el.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
  el.innerHTML = sanitize(text);
  return el;
}
function addCopyButton(container, text){
  const btn = document.createElement('button');
  btn.className = 'copy-btn';
  btn.textContent = 'Copiar';
  btn.title = 'Copiar resposta';
  btn.onclick = () => {
    navigator.clipboard.writeText(text).then(()=> {
      btn.textContent = 'Copiado!';
      setTimeout(()=> btn.textContent = 'Copiar', 1600);
    });
  };
  container.appendChild(btn);
}

// ---------- render ----------
function renderHistory(){
  chatList.innerHTML = '';
  history.forEach(item => {
    const el = createMessageEl(item.role, item.text);
    chatList.appendChild(el);
    if(item.role === 'bot') {
      addCopyButton(chatList, item.text); // adds below each bot message
      const meta = document.createElement('div'); meta.className='meta'; meta.textContent = ''; chatList.appendChild(meta);
    }
  });
  chatList.scrollTop = chatList.scrollHeight;
}

// ---------- language detection ----------
function detectLanguage(text){
  const forced = langSelect.value;
  if(forced && forced !== 'auto') return forced;

  const t = (text || '').toLowerCase();
  // heurísticas simples de palavras-chave:
  const esWords = ['hola','gracias','por','buenos','tarde','mañana','¿','que','cómo'];
  const enWords = ['hello','thanks','please','what','how','the','is','are','you'];
  const ptWords = ['olá','oi','obrigado','por','favor','tudo','como','qual','quem'];

  let score = {pt:0,en:0,es:0};
  const words = t.split(/\s+/).slice(0,40);
  words.forEach(w=>{
    if(!w) return;
    if(ptWords.includes(w)) score.pt++;
    if(enWords.includes(w)) score.en++;
    if(esWords.includes(w)) score.es++;
  });
  // fallback to navigator
  if(score.pt === 0 && score.en === 0 && score.es === 0){
    const nav = (navigator.language || navigator.userLanguage || 'pt').toLowerCase();
    if(nav.startsWith('es')) return 'es';
    if(nav.startsWith('en')) return 'en';
    return 'pt';
  }
  // pick highest
  const max = Object.keys(score).reduce((a,b)=> score[a]>=score[b]?a:b);
  return max;
}

// ---------- UI effects: typing ----------
function showTypingIndicator(){
  const typingEl = document.createElement('div');
  typingEl.className = 'msg bot typing';
  typingEl.textContent = 'Digitando...';
  chatList.appendChild(typingEl);
  chatList.scrollTop = chatList.scrollHeight;
  return typingEl;
}
function removeEl(el){ if(el && el.parentNode) el.parentNode.removeChild(el); }

// ---------- communication with serverless function ----------
async function askServer(prompt, lang){
  const payload = { prompt, lang };
  try{
    const res = await fetch('/.netlify/functions/edward', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(payload),
    });
    if(!res.ok){
      const txt = await res.text();
      throw new Error('server:'+res.status+' '+txt.slice(0,200));
    }
    const data = await res.json();
    // expected: { reply: '...' }
    return data.reply || 'Desculpe, não obtive resposta do servidor.';
  }catch(err){
    console.error('askServer error', err);
    return null;
  }
}

// ---------- fallback local responder (quando função não existir) ----------
function localResponder(text, lang){
  const t = text.toLowerCase();
  if(t.includes('olá')||t.includes('oi')||t.includes('hola')||t.includes('hello')){
    if(lang==='es') return '¡Hola! Soy Edward IA. ¿En qué puedo ayudarte?';
    if(lang==='en') return 'Hello! I am Edward IA. How can I help you?';
    return 'Olá! Sou Edward IA. Como posso ajudar?';
  }
  if(t.includes('criar site')||t.includes('crear sitio')||t.includes('create site')){
    if(lang==='es') return 'Para crear un sitio, usa Netlify, Vercel o GitHub Pages. ¿Te muestro pasos?';
    if(lang==='en') return 'To create a site use Netlify, Vercel or GitHub Pages. Want steps?';
    return 'Para criar um site, recomendo Netlify, Vercel ou GitHub Pages. Deseja os passos?';
  }
  if(lang==='es') return 'Buena pregunta. Puedo ayudarte con más detalles si me dices qué necesitas exactamente.';
  if(lang==='en') return 'Good question. I can help with more details if you tell me exactly what you need.';
  return 'Boa pergunta. Diga exatamente o que deseja e eu te ajudo com passo a passo.';
}

// ---------- main send flow ----------
async function handleSend(){
  const text = userInput.value.trim();
  if(!text) return;
  // push user msg
  appendToHistory('user', text);
  renderHistory();
  userInput.value = '';
  // show typing
  const typingEl = showTypingIndicator();

  // detect lang based on text + selected option
  const lang = detectLanguage(text);

  // ask server
  const serverReply = await askServer(text, lang);

  removeEl(typingEl);

  let finalReply = serverReply;
  if(finalReply === null){ // server error / offline
    // fallback local
    finalReply = localResponder(text, lang);
    appendToHistory('bot', finalReply);
    renderHistory();
    return;
  }

  // store and render with typing effect
  appendToHistory('bot', finalReply);
  renderHistory();
}

// ---------- events ----------
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keydown', e => { if(e.key === 'Enter') handleSend(); });
clearBtn.addEventListener('click', ()=> {
  if(confirm('Deseja realmente limpar o histórico local?')) {
    clearHistory();
    addSystemMessage('Histórico limpo localmente.');
  }
});

// system message helper
function addSystemMessage(t){
  appendToHistory('bot', t);
  renderHistory();
}

// ---------- init ----------
(function init(){
  loadHistory();
  renderHistory();
  // greet if empty
  if(history.length === 0){
    const welcome = 'Bem-vindo ao Edward IA. Digite uma pergunta para começar (suporta Português, English e Español).';
    appendToHistory('bot', welcome);
    renderHistory();
  }
  // ensure language select default = auto
  langSelect.value = 'auto';
})();

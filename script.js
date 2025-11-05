// Frontend inteligente do Edward IA
const API_ENDPOINT = "/.netlify/functions/chat"; // Netlify function path
const chat = document.getElementById("chat");
const form = document.getElementById("form");
const input = document.getElementById("input");
const langSelect = document.getElementById("lang");
const copyAllBtn = document.getElementById("copy-all");
const downloadBtn = document.getElementById("download");

function createMessage(text, who="bot"){
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerText = `${who === "user" ? "Você" : "Edward IA"}`;
  const txt = document.createElement("div");
  txt.className = "txt";
  txt.innerText = text;
  div.appendChild(meta);
  div.appendChild(txt);

  // actions
  const actions = document.createElement("div");
  actions.className = "row-actions";
  const copyBtn = document.createElement("button");
  copyBtn.innerText = "Copiar";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(text).then(()=>copyBtn.innerText="Copiado");
    setTimeout(()=>copyBtn.innerText="Copiar",1500);
  });
  actions.appendChild(copyBtn);
  div.appendChild(actions);

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return txt;
}

function showTypingPlaceholder(){
  const placeholder = createMessage("...", "bot");
  return placeholder;
}

async function sendQuestion(question){
  const userEl = createMessage(question, "user");
  const placeholder = showTypingPlaceholder();

  // prepare payload
  const preferred = langSelect.value === "auto" ? "auto" : langSelect.value;
  try{
    const res = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ question, preferred_language: preferred })
    });
    if(!res.ok){
      const text = await res.text();
      throw new Error(text || "Erro desconhecido");
    }
    const data = await res.json();
    const reply = data.reply || "Desculpe, não consegui responder agora.";
    // remove placeholder then display typed text with small typing animation
    placeholder.parentElement.remove(); // remove the "..." bubble
    await typeText(reply);
  }catch(err){
    placeholder.parentElement.querySelector(".txt").innerText = "Erro ao se conectar com o servidor.";
    console.error(err);
  }
}

function typeText(text){
  return new Promise(resolve=>{
    const elTxt = createMessage("", "bot");
    let i = 0;
    // typing speed but short so response feels instant; adjust if needed
    const speed = 18;
    function step(){
      if(i <= text.length){
        elTxt.innerText = text.slice(0,i);
        chat.scrollTop = chat.scrollHeight;
        i++;
        requestAnimationFrame(()=>setTimeout(step,speed));
      } else {
        resolve();
      }
    }
    step();
  });
}

// copy all conversation
copyAllBtn.addEventListener("click", async ()=>{
  const items = Array.from(document.querySelectorAll(".msg")).map(m=>{
    const who = m.classList.contains("user") ? "Você" : "Edward IA";
    const txt = m.querySelector(".txt").innerText;
    return `${who}: ${txt}`;
  }).join("\n\n");
  await navigator.clipboard.writeText(items);
  copyAllBtn.innerText = "Copiado";
  setTimeout(()=>copyAllBtn.innerText = "Copiar conversa", 1500);
});

// download conversation
downloadBtn.addEventListener("click", ()=>{
  const items = Array.from(document.querySelectorAll(".msg")).map(m=>{
    const who = m.classList.contains("user") ? "Você" : "Edward IA";
    const txt = m.querySelector(".txt").innerText;
    return `${who}: ${txt}`;
  }).join("\n\n");
  const blob = new Blob([items], {type: "text/plain;charset=utf-8"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "conversa-edward-ia.txt";
  a.click();
  URL.revokeObjectURL(url);
});

// submit
form.addEventListener("submit", e=>{
  e.preventDefault();
  const q = input.value.trim();
  if(!q) return;
  input.value = "";
  sendQuestion(q);
});

// small welcome
createMessage("Olá. Sou Edward IA — como posso ajudar hoje?", "bot");

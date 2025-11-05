// ======= Edward IA — Chat Profissional =======

const chatBox = document.getElementById("chat");
const input = document.getElementById("input");
const form = document.getElementById("form");

function addMessage(text, sender = "bot") {
  const msg = document.createElement("div");
  msg.className = sender;
  chatBox.appendChild(msg);
  typeEffect(msg, text);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Efeito de digitação com cursor piscando
function typeEffect(element, text, speed = 20) {
  let index = 0;
  const cursor = document.createElement("span");
  cursor.classList.add("typing");
  element.appendChild(cursor);

  const interval = setInterval(() => {
    if (index < text.length) {
      element.insertBefore(document.createTextNode(text.charAt(index)), cursor);
      index++;
    } else {
      clearInterval(interval);
      cursor.remove();
    }
  }, speed);
}

// Função simulada (sem API por enquanto)
async function askEdward(question) {
  addMessage("Um momento, analisando com inteligência...", "bot");

  setTimeout(() => {
    const respostas = [
      "Entendido! Posso te ajudar em qualquer assunto, desde tecnologia até estudos.",
      "Excelente pergunta! Eu explico de forma simples e clara.",
      "Aqui está uma resposta detalhada, como um verdadeiro especialista explicaria.",
      "Adorei isso! Vamos resolver juntos 😎",
    ];
    const resposta = respostas[Math.floor(Math.random() * respostas.length)];
    addMessage(resposta, "bot");
  }, 1000);
}

// Enviar mensagem
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const msg = input.value.trim();
  if (!msg) return;
  addMessage(msg, "user");
  input.value = "";
  askEdward(msg);
});

// Mensagem inicial
addMessage("👋 Olá! Sou o Edward IA — seu assistente inteligente e moderno. O que você quer aprender hoje?");

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");

// Função para exibir mensagens no chat
function addMessage(sender, text) {
  const message = document.createElement("div");
  message.classList.add("chat-message");
  message.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(message);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Simulação de digitação com atraso natural
function typeEffect(text, callback) {
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      chatBox.lastChild.innerHTML += text.charAt(i);
      i++;
      chatBox.scrollTop = chatBox.scrollHeight;
    } else {
      clearInterval(interval);
      if (callback) callback();
    }
  }, 15);
}

// Enviar mensagem
async function sendMessage() {
  const question = userInput.value.trim();
  if (question === "") return;

  addMessage("Você", question);
  userInput.value = "";

  // Mensagem de "digitando..."
  const typingMessage = document.createElement("div");
  typingMessage.classList.add("chat-message");
  typingMessage.innerHTML = "<strong>Edward IA:</strong> ⌛ Digitando...";
  chatBox.appendChild(typingMessage);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("/.netlify/functions/edward", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: question }),
    });

    const data = await response.json();
    const reply = data.reply || "Desculpe, houve um erro ao processar sua pergunta.";

    // Substitui a mensagem de digitação pelo texto real
    typingMessage.innerHTML = `<strong>Edward IA:</strong> `;
    typeEffect(reply);

  } catch (error) {
    typingMessage.innerHTML = `<strong>Edward IA:</strong> Ocorreu um erro, tente novamente.`;
  }
}

const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatBox = document.querySelector("#chat-box");
const clearBtn = document.querySelector("#clear-btn");

async function sendMessage(message) {
  addMessage("user", message);
  chatInput.value = "";

  const typing = addMessage("bot", "Digitando...");
  typing.classList.add("typing");

  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await response.json();

    typing.remove();
    addMessage("bot", data.reply, true);
  } catch (error) {
    typing.remove();
    addMessage("bot", "⚠️ Erro ao se conectar com o servidor.");
  }
}

function addMessage(sender, text, allowCopy = false) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", sender);

  const bubble = document.createElement("div");
  bubble.classList.add("bubble");
  bubble.innerHTML = text.replace(/\n/g, "<br>");
  messageDiv.appendChild(bubble);

  if (sender === "bot" && allowCopy) {
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copiar";
    copyBtn.classList.add("copy-btn");
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(text);
      copyBtn.textContent = "Copiado!";
      setTimeout(() => (copyBtn.textContent = "Copiar"), 1500);
    };
    messageDiv.appendChild(copyBtn);
  }

  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
  return messageDiv;
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (message) sendMessage(message);
});

clearBtn.addEventListener("click", () => {
  chatBox.innerHTML = "";
  addMessage("bot", "Histórico limpo. Como posso te ajudar agora?");
});

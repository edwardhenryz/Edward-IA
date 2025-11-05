const chatbox = document.getElementById("chatbox");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const langSelect = document.getElementById("language");

async function sendMessage() {
  const text = input.value.trim();
  if (!text) return;

  appendMessage("user", text);
  input.value = "";

  const lang = langSelect.value;

  try {
    const res = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, lang })
    });

    const data = await res.json();
    appendMessage("bot", data.reply);
  } catch (err) {
    appendMessage("bot", "⚠️ Ocorreu um erro ao se comunicar com o servidor.");
  }
}

function appendMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add(sender === "user" ? "msg-user" : "msg-bot");
  div.innerText = text;
  chatbox.appendChild(div);
  chatbox.scrollTop = chatbox.scrollHeight;
}

sendBtn.addEventListener("click", sendMessage);
input.addEventListener("keypress", e => { if (e.key === "Enter") sendMessage(); });

document.querySelectorAll(".example").forEach(btn => {
  btn.addEventListener("click", () => {
    input.value = btn.textContent;
    sendMessage();
  });
});

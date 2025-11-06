// main.js — Edward IA Pro (GPT-5 Turbo) integrado ao chat

// --- Configuração principal ---
const API_KEY = "SUA_API_KEY_AQUI"; // 🔑 Substitua pela sua chave da OpenAI

// --- Função que envia a mensagem do usuário para o GPT-5 ---
async function edwardResponder(userMessage) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-5-turbo",
        messages: [
          {
            role: "system",
            content:
              "Você é Edward IA — uma inteligência artificial premium, elegante, gentil e natural. Fale como se estivesse conversando pessoalmente, com empatia e inteligência. Responda sempre de forma criativa e completa.",
          },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await response.json();
    return (
      data.choices?.[0]?.message?.content ||
      "⚠️ Não consegui gerar uma resposta agora."
    );
  } catch (error) {
    console.error("Erro na comunicação com o GPT-5:", error);
    return "⚠️ Erro de conexão com o servidor.";
  }
}

// --- Controle do chat ---
const form = document.querySelector("form");
const input = document.querySelector("input");
const chatBox = document.querySelector(".chat-box");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  addMessage("user", userMessage);
  input.value = "";

  addMessage("bot", "⏳ Edward está digitando...");

  const botReply = await edwardResponder(userMessage);

  document.querySelector(".chat-box .bot:last-child").remove();
  addMessage("bot", botReply);
});

// --- Função para adicionar mensagens ---
function addMessage(sender, text) {
  const div = document.createElement("div");
  div.classList.add(sender);
  div.textContent = text;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

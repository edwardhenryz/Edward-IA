// netlify/functions/chat.js
exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const body = JSON.parse(event.body || "{}");
  const question = (body.question || "").toString().trim();
  const preferred = (body.preferred_language || "auto");

  if(!question) {
    return { statusCode: 400, body: JSON.stringify({ error: "Pergunta vazia" }) };
  }

  const OPENAI_KEY = process.env.OPENAI_API_KEY;
  if(!OPENAI_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "Chave de API não encontrada no servidor" }) };
  }

  // SYSTEM PROMPT: restringe formatação/emoji e força clareza
  const systemPrompt = `
You are "Edward IA", a professional, ultra-intelligent assistant. 
Always answer clearly and concisely in the user's language (detect automatically if 'auto' passed).
Do NOT use emojis, do not include special bullet characters like '*' or '/' as part of plain text.
Format answers in short paragraphs and keep each sentence clear and separate.
If asked to switch to English, answer in English. If user requests another language, comply.
If the user asks for code, provide code blocks only when necessary.
Always avoid repeating the same sentence twice.
`;

  // Build messages
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: question }
  ];

  // Decide model — use gpt-4-mini or fallback to gpt-4o-mini (change if your account has a different name)
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini"; // se der erro troque para "gpt-4-mini"

  try {
    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model,
        input: messages.map(m => (m.role === "system" ? { role: m.role, content: m.content } : { role: m.role, content: m.content }))
      })
    });

    if(!resp.ok){
      const txt = await resp.text();
      return { statusCode: resp.status, body: JSON.stringify({ error: txt }) };
    }

    const data = await resp.json();
    // Response structure may vary; try to extract text
    let reply = "";
    if (data.output && Array.isArray(data.output) && data.output.length){
      // For newer Responses API, look at output[0].content
      const first = data.output[0];
      if (first.content){
        // content can be array of objects; collect "text" fields
        if (Array.isArray(first.content)) {
          reply = first.content.map(c => c.text || (c[Object.keys(c)[0]]?.text) || "").join("");
        } else if (typeof first.content === "string") {
          reply = first.content;
        } else {
          // try text field
          reply = JSON.stringify(first.content);
        }
      } else {
        reply = JSON.stringify(first);
      }
    } else if (data.output_text) {
      reply = data.output_text;
    } else if (data.choices && data.choices.length && data.choices[0].message) {
      reply = data.choices[0].message.content || "";
    }

    // sanitize: remove repeated identical lines
    reply = reply.replace(/\r/g,"").split("\n").filter((v,i,a)=>!(i>0 && v.trim() === a[i-1].trim())).join("\n").trim();

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    console.error("OpenAI error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro interno ao consultar o modelo." }) };
  }
};

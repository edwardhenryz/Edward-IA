// netlify/functions/chat.js
exports.handler = async function(event, context) {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method Not Allowed' };
    }
    const { question, lang } = JSON.parse(event.body || '{}');
    if (!question) return { statusCode: 400, body: JSON.stringify({ error: 'Pergunta obrigatória' }) };

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    const MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'; // você pode alterar para o modelo que preferir

    if (!OPENAI_KEY) {
      return { statusCode: 500, body: JSON.stringify({ error: 'OPENAI_API_KEY não configurada' }) };
    }

    // Prompt system: instruções de comportamento do assistente
    const systemPrompt = `Você é Edward IA — assistente profissional, neutro, amigável e direto.
Responda claramente sem usar emojis, sem caracteres como * ou / no texto, e sem repetir frases.
Se o usuário pedir outro idioma, responda no idioma solicitado.
Seja conciso e educado. Sempre mantenha o contexto da pergunta.`;

    // Monta requisição para a API da OpenAI (Chat Completions)
    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: (lang === 'en' ? `[ENGLISH] ` : '') + question }
      ],
      max_tokens: 800,
      temperature: 0.1
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return { statusCode: 502, body: JSON.stringify({ error: 'OpenAI error', detail: errText }) };
    }

    const j = await resp.json();
    const reply = j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content.trim() : "Desculpe, sem resposta.";
    return { statusCode: 200, body: JSON.stringify({ reply }) };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error', detail: String(err)}) };
  }
};

const CHAT_ID = '627627996';
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const TG_TOKEN = process.env.TG_BOT_TOKEN;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

  const body = JSON.parse(event.body);

  // Telegram send mode
  if (body.action === 'telegram') {
    const token = TG_TOKEN || body.botToken;
    try {
      const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: body.text, parse_mode: 'HTML' })
      });
      const d = await r.json();
      if (!d.ok) return { statusCode: 400, body: JSON.stringify({ error: d.description }) };
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch(e) {
      return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
    }
  }

  // OpenAI analysis mode
  const { prompt } = body;
  const apiKey = OPENAI_KEY || body.apiKey;
  try {
    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({ model: 'gpt-4o', tools: [{ type: 'web_search_preview' }], input: prompt })
    });
    const data = await resp.json();
    if (data.error) return { statusCode: 400, body: JSON.stringify({ error: data.error.message }) };
    const textBlock = (data.output || []).find(b => b.type === 'message');
    const text = textBlock?.content?.find(c => c.type === 'output_text')?.text || '';
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ result: text }) };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.chatWithAI = async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_api_key') {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured on the server' });
    }

    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'A non-empty message is required' });
    }

    const response = await client.responses.create({
      model: "gpt-5-mini",
      input: message,
    });
    res.json({
      reply: response.output_text,
    });
  } catch (err) {
    console.error('CHAT WITH AI ERROR:', err);
    res.status(500).json({
      error: "AI Error",
      details: err.message,
    });
  }
};
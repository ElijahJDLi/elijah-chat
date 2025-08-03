export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { messages } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/assistants/asst_u6oAZEJ8BEZtVj5IYCrkfbpTv/runs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        model: 'gpt-4'
      })
    });

    const result = await response.json();
    const reply = result.choices?.[0]?.message?.content || 'No response available.';
    res.status(200).json({ reply });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ reply: 'Sorry, something went wrong.' });
  }
}
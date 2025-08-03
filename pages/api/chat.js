export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ reply: 'API key missing in environment.' });
  }

  try {
    const threadResponse = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({ messages })
    });

    const threadData = await threadResponse.json();
    const threadId = threadData.id;

    const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: 'asst_u6oAZEJ8BEZtVj5IYCrkfbpTv'
      })
    });

    const runData = await runResponse.json();
    const runId = runData.id;

    let runStatus = runData.status;
    while (runStatus !== 'completed' && runStatus !== 'failed') {
      await new Promise(r => setTimeout(r, 1000));
      const checkRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      const checkData = await checkRes.json();
      runStatus = checkData.status;
    }

    if (runStatus === 'failed') {
      return res.status(500).json({ reply: 'Run failed.' });
    }

    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const messagesData = await messagesResponse.json();
    const lastMessage = messagesData.data.find(msg => msg.role === 'assistant');

    const reply = lastMessage?.content?.[0]?.text?.value || 'No response available.';
    res.status(200).json({ reply });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ reply: 'Server error: ' + error.message });
  }
}
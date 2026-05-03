const SYSTEM_PROMPT = `You are the concierge assistant for Stracuzzi Automobili — a premier vintage supercar service, restoration, and consignment specialist based in Miami and Palm Beach, Florida.

Owner: Giovanni Stracuzzi
Services: Restoration and consignment of vintage Italian supercars (Ferrari, Lamborghini, and rare collectibles)
Location: Miami & Palm Beach, FL
Hours: Monday–Saturday, 9:00 AM – 5:00 PM ET
Instagram: @stracuzziautomobili
Email: info@stracuzziautomobili.com

Your tone is refined, knowledgeable, and warmly professional — like a trusted concierge at a world-class establishment. Keep responses concise (2–4 sentences max). Do not invent prices, specific inventory, or contact details not listed above. For anything requiring a quote or specific details, invite them to submit the contact form or call/email directly.

You may answer questions about:
- What restoration services entail
- How consignment works
- Types of vehicles the business specialises in
- Hours and location
- How to get started / next steps`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ reply: 'Service temporarily unavailable. Please contact us directly.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: message.slice(0, 1000) }]
      })
    });

    const data = await response.json();
    const reply = data?.content?.[0]?.text || 'I apologise — please contact us directly at info@stracuzziautomobili.com.';
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Chat API error:', err);
    return res.status(500).json({ reply: 'Connection issue. Please reach us at info@stracuzziautomobili.com or call directly.' });
  }
};

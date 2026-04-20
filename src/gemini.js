const API_KEY = import.meta.env.VITE_GROQ_KEY
const API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function parseExpense(text, categories = ['Materiallar', 'Usta haqi', 'Asboblar', 'Yuk tashish', 'Boshqa']) {
  const catList = JSON.stringify(categories)
  const prompt = `You are a construction expense parser. Extract expense information from this text spoken in Uzbek or Russian.

Text: "${text}"

Available categories: ${catList}

Return ONLY a JSON object with these fields:
- amount: number (handle "тысяч/ming" as *1000, "миллион/million" as *1000000)
- category: pick the most relevant from the available categories list above
- description: short description in the original language (2-5 words)

Examples:
"цемент 150 тысяч" → {"amount":150000,"category":"Materiallar","description":"Цемент"}
"заплатил мастеру 500000" → {"amount":500000,"category":"Usta haqi","description":"Usta haqi"}
"g'isht uchun 2 million to'ladim" → {"amount":2000000,"category":"Materiallar","description":"G'isht"}

Return only JSON, no markdown, no explanation.`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    }),
  })

  if (!res.ok) throw new Error('Groq API error')

  const data = await res.json()
  const raw = data.choices[0].message.content.trim()
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

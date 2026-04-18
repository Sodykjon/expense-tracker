const API_KEY = 'AIzaSyBr5naNUaV_BLb4g5xleJ966DLu8_5eeKQ'
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`

export async function parseExpense(text) {
  const prompt = `You are a construction expense parser. Extract expense information from this text spoken in Uzbek or Russian.

Text: "${text}"

Return ONLY a JSON object with these fields:
- amount: number (extract the numeric amount, handle "тысяч/ming" as *1000, "миллион/million" as *1000000)
- category: one of ["Materiallar", "Usta haqi", "Asboblar", "Yuk tashish", "Boshqa"]
- description: short description in the original language (2-5 words)

Category hints:
- Materiallar: cement, qum, temir, g'isht, цемент, песок, кирпич, арматура, краска, труба, and other building materials
- Usta haqi: usta, мастер, рабочий, worker payment
- Asboblar: tool, instrument, аппарат, дрель, болгарка
- Yuk tashish: transport, машина, deliver, доставка, перевозка
- Boshqa: anything else

Example: "цемент 150 тысяч" → {"amount": 150000, "category": "Materiallar", "description": "Цемент"}
Example: "заплатил мастеру 500000" → {"amount": 500000, "category": "Usta haqi", "description": "Usta haqi"}
Example: "g'isht uchun 2 million to'ladim" → {"amount": 2000000, "category": "Materiallar", "description": "G'isht"}

Return only JSON, no markdown, no explanation.`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 },
    }),
  })

  if (!res.ok) throw new Error('Gemini API error')

  const data = await res.json()
  const raw = data.candidates[0].content.parts[0].text.trim()
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

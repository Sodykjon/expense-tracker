import { useState, useRef } from 'react'
import { useExpenses } from './useExpenses'
import { parseExpense } from './gemini'
import './App.css'

const CATEGORY_ICONS = {
  'Materiallar': '🧱',
  'Usta haqi': '👷',
  'Asboblar': '🔧',
  'Yuk tashish': '🚚',
  'Boshqa': '📦',
}

const CATEGORY_COLORS = {
  'Materiallar': '#4f8ef7',
  'Usta haqi': '#f7a24f',
  'Asboblar': '#4fbe8e',
  'Yuk tashish': '#c07ef7',
  'Boshqa': '#f76f6f',
}

function formatAmount(n) {
  return new Intl.NumberFormat('uz-UZ').format(n)
}

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function App() {
  const { expenses, addExpense, deleteExpense } = useExpenses()
  const [status, setStatus] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [filter, setFilter] = useState('Hammasi')
  const recognitionRef = useRef(null)

  const categories = ['Hammasi', ...Object.keys(CATEGORY_ICONS)]
  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const filtered = filter === 'Hammasi' ? expenses : expenses.filter(e => e.category === filter)

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setErrorMsg("Brauzeringiz ovozni tanimaydi. Safari yoki Chrome ishlatib ko'ring.")
      setStatus('error')
      return
    }

    const rec = new SpeechRecognition()
    rec.lang = 'ru-RU'
    rec.continuous = false
    rec.interimResults = false
    recognitionRef.current = rec

    setStatus('listening')
    setTranscript('')
    setErrorMsg('')

    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript
      setTranscript(text)
      setStatus('processing')
      try {
        const parsed = await parseExpense(text)
        if (!parsed.amount || parsed.amount <= 0) throw new Error('no amount')
        addExpense({ ...parsed, rawText: text })
        setStatus('idle')
        setTranscript('')
      } catch {
        setErrorMsg('Tushunimsiz. Qaytadan aytib bering.')
        setStatus('error')
      }
    }

    rec.onerror = () => {
      setErrorMsg('Mikrofon xatosi. Qaytadan bosing.')
      setStatus('error')
    }

    rec.start()
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setStatus('idle')
  }

  return (
    <div className="app">
      <header>
        <h1>🏗️ Qurilish Xarajatlari</h1>
        <div className="total">
          <span className="total-label">Jami xarajat</span>
          <span className="total-amount">{formatAmount(total)} so'm</span>
        </div>
      </header>

      <div className="mic-section">
        {status === 'idle' || status === 'error' ? (
          <button className="mic-btn" onClick={startListening}>
            <span className="mic-icon">🎤</span>
            <span>Gapiring</span>
          </button>
        ) : status === 'listening' ? (
          <button className="mic-btn listening" onClick={stopListening}>
            <span className="mic-icon pulse">🔴</span>
            <span>Tinglayapman...</span>
          </button>
        ) : (
          <button className="mic-btn processing" disabled>
            <span className="mic-icon spin">⚙️</span>
            <span>Qayta ishlamoqda...</span>
          </button>
        )}

        {transcript ? (
          <div className="transcript">"{transcript}"</div>
        ) : (status === 'idle') ? (
          <div className="hint">
            Masalan: "цемент 150 тысяч" yoki "ustaga 500000 to'ladim"
          </div>
        ) : null}

        {status === 'error' && (
          <div className="error">{errorMsg}</div>
        )}
      </div>

      <div className="filter-bar">
        {categories.map(c => (
          <button
            key={c}
            className={`filter-btn ${filter === c ? 'active' : ''}`}
            onClick={() => setFilter(c)}
          >
            {c !== 'Hammasi' ? CATEGORY_ICONS[c] + ' ' : ''}{c}
          </button>
        ))}
      </div>

      <div className="expenses-list">
        {filtered.length === 0 ? (
          <div className="empty">Hech qanday xarajat yo'q</div>
        ) : (
          filtered.map(e => (
            <div key={e.id} className="expense-card">
              <div className="expense-left">
                <span className="expense-icon">{CATEGORY_ICONS[e.category]}</span>
                <div className="expense-info">
                  <span className="expense-desc">{e.description}</span>
                  <span className="expense-cat" style={{ color: CATEGORY_COLORS[e.category] }}>
                    {e.category}
                  </span>
                  <span className="expense-date">{formatDate(e.date)}</span>
                </div>
              </div>
              <div className="expense-right">
                <span className="expense-amount">{formatAmount(e.amount)}</span>
                <button className="delete-btn" onClick={() => deleteExpense(e.id)}>✕</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

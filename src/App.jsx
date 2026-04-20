import { useState, useRef } from 'react'
import { useExpenses } from './useExpenses'
import { parseExpense } from './gemini'
import './App.css'

const CATEGORIES = [
  { key: 'Materiallar', icon: '🧱', color: '#60a5fa', colorBg: 'rgba(96,165,250,0.1)',  colorBorder: 'rgba(96,165,250,0.2)' },
  { key: 'Usta haqi',   icon: '👷', color: '#fb923c', colorBg: 'rgba(251,146,60,0.1)',  colorBorder: 'rgba(251,146,60,0.2)' },
  { key: 'Asboblar',    icon: '🔧', color: '#34d399', colorBg: 'rgba(52,211,153,0.1)',  colorBorder: 'rgba(52,211,153,0.2)' },
  { key: 'Yuk tashish', icon: '🚚', color: '#a78bfa', colorBg: 'rgba(167,139,250,0.1)', colorBorder: 'rgba(167,139,250,0.2)' },
  { key: 'Boshqa',      icon: '📦', color: '#f472b6', colorBg: 'rgba(244,114,182,0.1)', colorBorder: 'rgba(244,114,182,0.2)' },
]
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.key, c]))

const PROJECT_ICONS = ['🏠','🏗️','🏢','🏡','🏬','🏭','🛖','🏰','🏚️','🏘️','🌳','🚗']

function formatAmount(n) { return new Intl.NumberFormat('uz-UZ').format(n) }
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ── ADD/EDIT EXPENSE MODAL ──────────────────────────────────────────────────
function ExpenseModal({ initial, onSave, onClose, title, projects }) {
  const defaultProject = projects[0]?.id || null
  const [form, setForm] = useState(initial || { description: '', amount: '', category: 'Materiallar', project_id: defaultProject })

  function handleSave() {
    const amount = parseFloat(String(form.amount).replace(/\s/g, ''))
    if (!form.description.trim() || !amount || amount <= 0 || !form.project_id) return
    onSave({ ...form, amount })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h2>{title}</h2>

        <div className="form-group">
          <label className="form-label">Loyiha</label>
          <div className="project-select-grid">
            {projects.map(p => (
              <button
                key={p.id}
                className={`project-option ${form.project_id === p.id ? 'selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, project_id: p.id }))}
              >
                <span>{p.icon}</span>
                <span className="project-option-name">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Tavsif</label>
          <input
            className="form-input"
            placeholder="Masalan: Цемент М400"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Summa (so'm)</label>
          <input
            className="form-input"
            type="number"
            placeholder="150000"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Kategoriya</label>
          <div className="category-grid">
            {CATEGORIES.map(c => (
              <button
                key={c.key}
                className={`cat-option ${form.category === c.key ? 'selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, category: c.key }))}
              >
                <span className="cat-emoji">{c.icon}</span>
                {c.key}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Bekor</button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={!form.description.trim() || !form.amount || !form.project_id}
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ADD PROJECT MODAL ───────────────────────────────────────────────────────
function AddProjectModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('🏠')

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h2>Yangi loyiha</h2>

        <div className="form-group">
          <label className="form-label">Nom</label>
          <input
            className="form-input"
            placeholder="Masalan: 1-xonadon"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Belgi</label>
          <div className="icon-grid">
            {PROJECT_ICONS.map(ic => (
              <button
                key={ic}
                className={`icon-option ${icon === ic ? 'selected' : ''}`}
                onClick={() => setIcon(ic)}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Bekor</button>
          <button
            className="btn-save"
            onClick={() => name.trim() && onSave(name.trim(), icon)}
            disabled={!name.trim()}
          >
            Yaratish
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const { expenses, addExpense, editExpense, deleteExpense, projects, addProject, deleteProject, loading } = useExpenses()

  const [status, setStatus] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [activeProject, setActiveProject] = useState(null) // null = all projects
  const [catFilter, setCatFilter] = useState('Hammasi')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showManageProjects, setShowManageProjects] = useState(false)
  const recognitionRef = useRef(null)

  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]))

  // expenses filtered by active project
  const projectExpenses = activeProject
    ? expenses.filter(e => e.project_id === activeProject)
    : expenses

  // further filtered by category
  const visibleExpenses = catFilter === 'Hammasi'
    ? projectExpenses
    : projectExpenses.filter(e => e.category === catFilter)

  const total = projectExpenses.reduce((s, e) => s + e.amount, 0)
  const thisMonth = projectExpenses.filter(e => {
    const d = new Date(e.date), now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, e) => s + e.amount, 0)

  // category breakdown for active project
  const catTotals = CATEGORIES.map(c => ({
    ...c,
    total: projectExpenses.filter(e => e.category === c.key).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0)

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setErrorMsg("Brauzeringiz ovozni tanimaydi."); setStatus('error'); return }
    const rec = new SR()
    rec.lang = 'ru-RU'
    rec.continuous = false
    rec.interimResults = false
    recognitionRef.current = rec
    setStatus('listening'); setTranscript(''); setErrorMsg('')

    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript
      setTranscript(text); setStatus('processing')
      try {
        const parsed = await parseExpense(text)
        if (!parsed.amount || parsed.amount <= 0) throw new Error('no amount')
        // use active project or first project
        const project_id = activeProject || projects[0]?.id || null
        addExpense({ ...parsed, rawText: text, project_id })
        setStatus('idle'); setTranscript('')
      } catch {
        setErrorMsg("Tushunimsiz. Qaytadan aytib bering."); setStatus('error')
      }
    }
    rec.onerror = () => { setErrorMsg('Mikrofon xatosi.'); setStatus('error') }
    rec.start()
  }

  function stopListening() { recognitionRef.current?.stop(); setStatus('idle') }

  const activeProjectData = activeProject ? projectMap[activeProject] : null

  if (loading) return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <span>Yuklanmoqda...</span>
    </div>
  )

  return (
    <div className="app">

      {/* ── HEADER ── */}
      <div className="header">
        <div className="header-top">
          <h1>🏗️ Qurilish</h1>
          <div className="header-actions">
            <button className="add-manual-btn" onClick={() => setShowAddExpense(true)} title="Xarajat qo'shish">+</button>
          </div>
        </div>

        {/* Project tabs */}
        <div className="project-tabs">
          <button
            className={`project-tab ${activeProject === null ? 'active' : ''}`}
            onClick={() => { setActiveProject(null); setCatFilter('Hammasi') }}
          >
            🌐 Hammasi
          </button>
          {projects.map(p => (
            <button
              key={p.id}
              className={`project-tab ${activeProject === p.id ? 'active' : ''}`}
              onClick={() => { setActiveProject(p.id); setCatFilter('Hammasi') }}
            >
              {p.icon} {p.name}
            </button>
          ))}
          <button className="project-tab add-project-tab" onClick={() => setShowAddProject(true)}>
            + Loyiha
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card main">
            <div className="stat-label">
              {activeProjectData ? `${activeProjectData.icon} ${activeProjectData.name}` : 'Jami barcha loyihalar'}
            </div>
            <div className="stat-value accent">{formatAmount(total)} <span style={{fontSize:16,fontWeight:500}}>so'm</span></div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Bu oy</div>
            <div className="stat-value small">{formatAmount(thisMonth)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Yozuvlar</div>
            <div className="stat-value small">{projectExpenses.length}</div>
          </div>
        </div>

        {/* Category breakdown bar */}
        {catTotals.length > 0 && total > 0 && (
          <div className="breakdown">
            <div className="breakdown-bar">
              {catTotals.map(c => (
                <div
                  key={c.key}
                  className="breakdown-segment"
                  style={{ width: `${(c.total / total) * 100}%`, background: c.color }}
                  title={`${c.key}: ${formatAmount(c.total)}`}
                />
              ))}
            </div>
            <div className="breakdown-legend">
              {catTotals.map(c => (
                <div key={c.key} className="legend-item">
                  <span className="legend-dot" style={{ background: c.color }} />
                  <span>{c.icon} {c.key}</span>
                  <span className="legend-amount">{formatAmount(c.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Manage projects link */}
        {projects.length > 0 && (
          <button className="manage-projects-btn" onClick={() => setShowManageProjects(true)}>
            Loyihalarni boshqarish →
          </button>
        )}
      </div>

      {/* ── MIC ── */}
      <div className="mic-section">
        <div className={`mic-ring ${status === 'listening' ? 'active' : ''}`}>
          {status === 'idle' || status === 'error' ? (
            <button className="mic-btn" onClick={startListening}>
              <span className="mic-icon">🎤</span>
              <span>Gapiring</span>
            </button>
          ) : status === 'listening' ? (
            <button className="mic-btn listening" onClick={stopListening}>
              <span className="mic-icon">🔴</span>
              <span>Tinglayapman</span>
            </button>
          ) : (
            <button className="mic-btn processing" disabled>
              <span className="mic-icon spin">⚙️</span>
              <span>Ishlamoqda</span>
            </button>
          )}
        </div>
        {activeProject && (
          <div className="mic-project-hint">
            {activeProjectData?.icon} {activeProjectData?.name} loyihasiga qo'shiladi
          </div>
        )}
        {transcript
          ? <div className="transcript">"{transcript}"</div>
          : status === 'idle'
          ? <div className="hint">Masalan: "цемент 150 тысяч" yoki "устага 500 минг тўладим"</div>
          : null}
        {status === 'error' && <div className="error-msg">{errorMsg}</div>}
      </div>

      {/* ── CATEGORY FILTER ── */}
      <div className="filter-bar">
        {['Hammasi', ...CATEGORIES.map(c => c.key)].map(c => (
          <button
            key={c}
            className={`filter-btn ${catFilter === c ? 'active' : ''}`}
            onClick={() => setCatFilter(c)}
          >
            {c !== 'Hammasi' ? CAT_MAP[c].icon + ' ' : ''}{c}
          </button>
        ))}
      </div>

      {/* ── EXPENSE LIST ── */}
      <div className="expenses-list">
        {visibleExpenses.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏗️</div>
            Hech qanday xarajat yo'q.<br />Mikrofonga bosing yoki + tugmasini bosing.
          </div>
        ) : (
          visibleExpenses.map(e => {
            const cat = CAT_MAP[e.category] || CAT_MAP['Boshqa']
            const proj = projectMap[e.project_id]
            return (
              <div key={e.id} className="expense-card"
                style={{ '--cat-color': cat.color, '--cat-color-bg': cat.colorBg, '--cat-color-border': cat.colorBorder }}
              >
                <div className="expense-left">
                  <div className="expense-icon-wrap">{cat.icon}</div>
                  <div className="expense-info">
                    <span className="expense-desc">{e.description}</span>
                    <div className="expense-meta">
                      <span className="expense-cat">{e.category}</span>
                      {!activeProject && proj && (
                        <span className="expense-project">{proj.icon} {proj.name}</span>
                      )}
                    </div>
                    <span className="expense-date">{formatDate(e.date)}</span>
                  </div>
                </div>
                <div className="expense-right">
                  <span className="expense-amount">{formatAmount(e.amount)}</span>
                  <div className="expense-actions">
                    <button className="action-btn edit" onClick={() => setEditingExpense(e)} title="Tahrirlash">✏️</button>
                    <button className="action-btn delete" onClick={() => deleteExpense(e.id)} title="O'chirish">🗑️</button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── MODALS ── */}
      {showAddExpense && (
        <ExpenseModal
          title="Xarajat qo'shish"
          projects={projects}
          initial={{ description: '', amount: '', category: 'Materiallar', project_id: activeProject || projects[0]?.id }}
          onSave={(data) => { addExpense(data); setShowAddExpense(false) }}
          onClose={() => setShowAddExpense(false)}
        />
      )}

      {editingExpense && (
        <ExpenseModal
          title="Xarajatni tahrirlash"
          projects={projects}
          initial={{ description: editingExpense.description, amount: editingExpense.amount, category: editingExpense.category, project_id: editingExpense.project_id }}
          onSave={(data) => { editExpense(editingExpense.id, data); setEditingExpense(null) }}
          onClose={() => setEditingExpense(null)}
        />
      )}

      {showAddProject && (
        <AddProjectModal
          onSave={(name, icon) => { addProject(name, icon); setShowAddProject(false) }}
          onClose={() => setShowAddProject(false)}
        />
      )}

      {showManageProjects && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowManageProjects(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <h2>Loyihalar</h2>
            <div className="manage-projects-list">
              {projects.map(p => (
                <div key={p.id} className="manage-project-row">
                  <span className="manage-project-icon">{p.icon}</span>
                  <span className="manage-project-name">{p.name}</span>
                  <span className="manage-project-count">
                    {expenses.filter(e => e.project_id === p.id).length} ta
                  </span>
                  <button
                    className="action-btn delete"
                    onClick={() => {
                      if (confirm(`"${p.name}" loyihasini va uning barcha xarajatlarini o'chirasizmi?`)) {
                        deleteProject(p.id)
                        if (activeProject === p.id) setActiveProject(null)
                      }
                    }}
                  >🗑️</button>
                </div>
              ))}
            </div>
            <button className="btn-save" style={{width:'100%', marginTop:16}} onClick={() => { setShowManageProjects(false); setShowAddProject(true) }}>
              + Yangi loyiha qo'shish
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

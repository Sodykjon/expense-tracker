import { useState, useRef } from 'react'
import { useExpenses, BUILT_IN_CATEGORIES } from './useExpenses'
import { parseExpense } from './gemini'
import './App.css'

const PROJECT_ICONS = ['🏠','🏗️','🏢','🏡','🏬','🏭','🛖','🏰','🏚️','🏘️','🌳','🚗']
const CATEGORY_ICONS = ['🧱','👷','🔧','🚚','📦','⚡','🪟','🚿','🎨','🪵','🏗️','💡','🔩','🪣','🛁','🌿']
const CATEGORY_COLORS = ['#60a5fa','#fb923c','#34d399','#a78bfa','#f472b6','#facc15','#f87171','#38bdf8','#4ade80','#e879f9']

function formatAmount(n) { return new Intl.NumberFormat('uz-UZ').format(n) }
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
}
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return `${r},${g},${b}`
}

// ── EXPENSE MODAL ────────────────────────────────────────────────────────────
function ExpenseModal({ initial, onSave, onClose, title, projects, allCategories }) {
  const [form, setForm] = useState(initial || {
    description: '', amount: '', category: allCategories[0]?.name || '', project_id: projects[0]?.id || null
  })

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
              <button key={p.id}
                className={`project-option ${form.project_id === p.id ? 'selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, project_id: p.id }))}>
                <span>{p.icon}</span>
                <span className="project-option-name">{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Tavsif</label>
          <input className="form-input" placeholder="Masalan: Цемент М400"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>

        <div className="form-group">
          <label className="form-label">Summa (so'm)</label>
          <input className="form-input" type="number" placeholder="150000"
            value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        </div>

        <div className="form-group">
          <label className="form-label">Kategoriya</label>
          <div className="category-grid">
            {allCategories.map(c => (
              <button key={c.name}
                className={`cat-option ${form.category === c.name ? 'selected' : ''}`}
                style={form.category === c.name ? { background: c.color, borderColor: 'transparent' } : {}}
                onClick={() => setForm(f => ({ ...f, category: c.name }))}>
                <span className="cat-emoji">{c.icon}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Bekor</button>
          <button className="btn-save" onClick={handleSave}
            disabled={!form.description.trim() || !form.amount || !form.project_id}>
            Saqlash
          </button>
        </div>
      </div>
    </div>
  )
}

// ── ADD PROJECT MODAL ────────────────────────────────────────────────────────
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
          <input className="form-input" placeholder="Masalan: 1-xonadon"
            value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Belgi</label>
          <div className="icon-grid">
            {PROJECT_ICONS.map(ic => (
              <button key={ic} className={`icon-option ${icon === ic ? 'selected' : ''}`}
                onClick={() => setIcon(ic)}>{ic}</button>
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Bekor</button>
          <button className="btn-save" onClick={() => name.trim() && onSave(name.trim(), icon)}
            disabled={!name.trim()}>Yaratish</button>
        </div>
      </div>
    </div>
  )
}

// ── ADD CATEGORY MODAL ───────────────────────────────────────────────────────
function AddCategoryModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📌')
  const [color, setColor] = useState('#a78bfa')
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <h2>Yangi kategoriya</h2>
        <div className="form-group">
          <label className="form-label">Nom</label>
          <input className="form-input" placeholder="Masalan: Santexnika"
            value={name} onChange={e => setName(e.target.value)} autoFocus />
        </div>
        <div className="form-group">
          <label className="form-label">Belgi</label>
          <div className="icon-grid">
            {CATEGORY_ICONS.map(ic => (
              <button key={ic} className={`icon-option ${icon === ic ? 'selected' : ''}`}
                onClick={() => setIcon(ic)}>{ic}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Rang</label>
          <div className="color-grid">
            {CATEGORY_COLORS.map(c => (
              <button key={c} className={`color-option ${color === c ? 'selected' : ''}`}
                style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Bekor</button>
          <button className="btn-save" onClick={() => name.trim() && onSave(name.trim(), icon, color)}
            disabled={!name.trim()}>Yaratish</button>
        </div>
      </div>
    </div>
  )
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const {
    expenses, projects, customCategories, loading,
    addExpense, editExpense, deleteExpense,
    addProject, deleteProject,
    addCategory, deleteCategory,
  } = useExpenses()

  const [status, setStatus] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [activeProject, setActiveProject] = useState(null)
  const [catFilter, setCatFilter] = useState('Hammasi')
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [editingExpense, setEditingExpense] = useState(null)
  const [showAddProject, setShowAddProject] = useState(false)
  const [showManageProjects, setShowManageProjects] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showManageCategories, setShowManageCategories] = useState(false)
  const recognitionRef = useRef(null)

  // merge built-in + custom categories
  const allCategories = [
    ...BUILT_IN_CATEGORIES,
    ...customCategories.map(c => ({ ...c, name: c.name, builtIn: false })),
  ]
  const catMap = Object.fromEntries(allCategories.map(c => [c.name, c]))
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p]))

  const projectExpenses = activeProject
    ? expenses.filter(e => e.project_id === activeProject)
    : expenses
  const visibleExpenses = catFilter === 'Hammasi'
    ? projectExpenses
    : projectExpenses.filter(e => e.category === catFilter)

  const total = projectExpenses.reduce((s, e) => s + e.amount, 0)
  const thisMonth = projectExpenses.filter(e => {
    const d = new Date(e.date), now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((s, e) => s + e.amount, 0)

  const catTotals = allCategories.map(c => ({
    ...c,
    total: projectExpenses.filter(e => e.category === c.name).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0)

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setErrorMsg("Brauzeringiz ovozni tanimaydi."); setStatus('error'); return }
    const rec = new SR()
    rec.lang = 'ru-RU'; rec.continuous = false; rec.interimResults = false
    recognitionRef.current = rec
    setStatus('listening'); setTranscript(''); setErrorMsg('')
    rec.onresult = async (e) => {
      const text = e.results[0][0].transcript
      setTranscript(text); setStatus('processing')
      try {
        const parsed = await parseExpense(text, allCategories.map(c => c.name))
        if (!parsed.amount || parsed.amount <= 0) throw new Error('no amount')
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

      {/* HEADER */}
      <div className="header">
        <div className="header-top">
          <h1>🏗️ Qurilish</h1>
          <button className="add-manual-btn" onClick={() => setShowAddExpense(true)}>+</button>
        </div>

        <div className="project-tabs">
          <button className={`project-tab ${activeProject === null ? 'active' : ''}`}
            onClick={() => { setActiveProject(null); setCatFilter('Hammasi') }}>
            🌐 Hammasi
          </button>
          {projects.map(p => (
            <button key={p.id}
              className={`project-tab ${activeProject === p.id ? 'active' : ''}`}
              onClick={() => { setActiveProject(p.id); setCatFilter('Hammasi') }}>
              {p.icon} {p.name}
            </button>
          ))}
          <button className="project-tab add-project-tab" onClick={() => setShowAddProject(true)}>
            + Loyiha
          </button>
        </div>

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

        {catTotals.length > 0 && total > 0 && (
          <div className="breakdown">
            <div className="breakdown-bar">
              {catTotals.map(c => (
                <div key={c.name} className="breakdown-segment"
                  style={{ width: `${(c.total / total) * 100}%`, background: c.color }}
                  title={`${c.name}: ${formatAmount(c.total)}`} />
              ))}
            </div>
            <div className="breakdown-legend">
              {catTotals.map(c => (
                <div key={c.name} className="legend-item">
                  <span className="legend-dot" style={{ background: c.color }} />
                  <span>{c.icon} {c.name}</span>
                  <span className="legend-amount">{formatAmount(c.total)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="manage-links">
          <button className="manage-projects-btn" onClick={() => setShowManageProjects(true)}>
            Loyihalar →
          </button>
          <button className="manage-projects-btn" onClick={() => setShowManageCategories(true)}>
            Kategoriyalar →
          </button>
        </div>
      </div>

      {/* MIC */}
      <div className="mic-section">
        <div className={`mic-ring ${status === 'listening' ? 'active' : ''}`}>
          {status === 'idle' || status === 'error' ? (
            <button className="mic-btn" onClick={startListening}>
              <span className="mic-icon">🎤</span><span>Gapiring</span>
            </button>
          ) : status === 'listening' ? (
            <button className="mic-btn listening" onClick={stopListening}>
              <span className="mic-icon">🔴</span><span>Tinglayapman</span>
            </button>
          ) : (
            <button className="mic-btn processing" disabled>
              <span className="mic-icon spin">⚙️</span><span>Ishlamoqda</span>
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

      {/* FILTER */}
      <div className="filter-bar">
        {['Hammasi', ...allCategories.map(c => c.name)].map(c => {
          const cat = catMap[c]
          return (
            <button key={c}
              className={`filter-btn ${catFilter === c ? 'active' : ''}`}
              style={catFilter === c && cat ? { background: cat.color, borderColor: 'transparent' } : {}}
              onClick={() => setCatFilter(c)}>
              {cat ? cat.icon + ' ' : ''}{c}
            </button>
          )
        })}
      </div>

      {/* LIST */}
      <div className="expenses-list">
        {visibleExpenses.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏗️</div>
            Hech qanday xarajat yo'q.<br />Mikrofonga bosing yoki + tugmasini bosing.
          </div>
        ) : (
          visibleExpenses.map(e => {
            const cat = catMap[e.category] || BUILT_IN_CATEGORIES[4]
            const proj = projectMap[e.project_id]
            const rgb = cat.color?.startsWith('#') ? hexToRgb(cat.color) : '167,139,250'
            return (
              <div key={e.id} className="expense-card"
                style={{
                  '--cat-color': cat.color,
                  '--cat-color-bg': `rgba(${rgb},0.1)`,
                  '--cat-color-border': `rgba(${rgb},0.2)`,
                }}>
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
                    <button className="action-btn edit" onClick={() => setEditingExpense(e)}>✏️</button>
                    <button className="action-btn delete" onClick={() => deleteExpense(e.id)}>🗑️</button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* MODALS */}
      {showAddExpense && (
        <ExpenseModal title="Xarajat qo'shish" projects={projects} allCategories={allCategories}
          initial={{ description: '', amount: '', category: allCategories[0]?.name, project_id: activeProject || projects[0]?.id }}
          onSave={data => { addExpense(data); setShowAddExpense(false) }}
          onClose={() => setShowAddExpense(false)} />
      )}

      {editingExpense && (
        <ExpenseModal title="Xarajatni tahrirlash" projects={projects} allCategories={allCategories}
          initial={{ description: editingExpense.description, amount: editingExpense.amount, category: editingExpense.category, project_id: editingExpense.project_id }}
          onSave={data => { editExpense(editingExpense.id, data); setEditingExpense(null) }}
          onClose={() => setEditingExpense(null)} />
      )}

      {showAddProject && (
        <AddProjectModal
          onSave={(name, icon) => { addProject(name, icon); setShowAddProject(false) }}
          onClose={() => setShowAddProject(false)} />
      )}

      {showAddCategory && (
        <AddCategoryModal
          onSave={(name, icon, color) => { addCategory(name, icon, color); setShowAddCategory(false) }}
          onClose={() => setShowAddCategory(false)} />
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
                  <span className="manage-project-count">{expenses.filter(e => e.project_id === p.id).length} ta</span>
                  <button className="action-btn delete" onClick={() => {
                    if (confirm(`"${p.name}" o'chirilsinmi?`)) {
                      deleteProject(p.id)
                      if (activeProject === p.id) setActiveProject(null)
                    }
                  }}>🗑️</button>
                </div>
              ))}
            </div>
            <button className="btn-save" style={{width:'100%',marginTop:16}}
              onClick={() => { setShowManageProjects(false); setShowAddProject(true) }}>
              + Yangi loyiha
            </button>
          </div>
        </div>
      )}

      {showManageCategories && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowManageCategories(false)}>
          <div className="modal">
            <div className="modal-handle" />
            <h2>Kategoriyalar</h2>
            <div className="manage-projects-list">
              {allCategories.map(c => (
                <div key={c.name} className="manage-project-row">
                  <span className="manage-project-icon">{c.icon}</span>
                  <span className="manage-project-name">{c.name}</span>
                  <span className="legend-dot" style={{ background: c.color, width:10, height:10, borderRadius:'50%', flexShrink:0 }} />
                  {c.builtIn
                    ? <span style={{fontSize:11,color:'#44446a'}}>standart</span>
                    : <button className="action-btn delete" onClick={() => {
                        if (confirm(`"${c.name}" o'chirilsinmi?`)) deleteCategory(c.id)
                      }}>🗑️</button>
                  }
                </div>
              ))}
            </div>
            <button className="btn-save" style={{width:'100%',marginTop:16}}
              onClick={() => { setShowManageCategories(false); setShowAddCategory(true) }}>
              + Yangi kategoriya
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const USER_ID = 'default'
const DEFAULT_PROJECTS = [{ id: 1, name: 'Asosiy uy', icon: '🏠' }]

export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [{ data: proj, error: projErr }, { data: exp, error: expErr }] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', USER_ID).order('id'),
      supabase.from('expenses').select('*').eq('user_id', USER_ID).order('date', { ascending: false }),
    ])

    if (projErr) console.error('projects fetch error:', projErr)
    if (expErr) console.error('expenses fetch error:', expErr)

    if (proj && proj.length === 0) {
      const { data: created, error: seedErr } = await supabase
        .from('projects')
        .insert(DEFAULT_PROJECTS.map(p => ({ ...p, user_id: USER_ID })))
        .select()
      if (seedErr) console.error('seed error:', seedErr)
      setProjects(created || DEFAULT_PROJECTS)
    } else {
      setProjects(proj || [])
    }

    setExpenses(exp || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function addExpense(expense) {
    // remove id so Supabase can auto-generate or we use a safe bigint
    const { id, rawText, ...rest } = expense
    const row = { ...rest, raw_text: rawText || null, user_id: USER_ID, date: new Date().toISOString() }
    const { data, error } = await supabase.from('expenses').insert(row).select().single()
    if (error) { console.error('addExpense error:', error); return }
    if (data) setExpenses(prev => [data, ...prev])
  }

  async function editExpense(id, updates) {
    const { rawText, ...rest } = updates
    const { data, error } = await supabase.from('expenses').update(rest).eq('id', id).select().single()
    if (error) { console.error('editExpense error:', error); return }
    if (data) setExpenses(prev => prev.map(e => e.id === id ? data : e))
  }

  async function deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) { console.error('deleteExpense error:', error); return }
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  async function addProject(name, icon) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ name, icon, user_id: USER_ID })
      .select()
      .single()
    if (error) { console.error('addProject error:', error); return null }
    if (data) setProjects(prev => [...prev, data])
    return data
  }

  async function deleteProject(id) {
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) { console.error('deleteProject error:', error); return }
    setProjects(prev => prev.filter(p => p.id !== id))
    setExpenses(prev => prev.filter(e => e.project_id !== id))
  }

  return { expenses, projects, loading, addExpense, editExpense, deleteExpense, addProject, deleteProject }
}

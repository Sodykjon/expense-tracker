import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabase'

const USER_ID = 'default'
const DEFAULT_PROJECTS = [{ name: 'Asosiy uy', icon: '🏠' }]

export const BUILT_IN_CATEGORIES = [
  { id: 'materiallar', name: 'Materiallar', icon: '🧱', color: '#60a5fa', builtIn: true },
  { id: 'usta',        name: 'Usta haqi',   icon: '👷', color: '#fb923c', builtIn: true },
  { id: 'asboblar',   name: 'Asboblar',    icon: '🔧', color: '#34d399', builtIn: true },
  { id: 'yuk',        name: 'Yuk tashish', icon: '🚚', color: '#a78bfa', builtIn: true },
  { id: 'boshqa',     name: 'Boshqa',      icon: '📦', color: '#f472b6', builtIn: true },
]

export function useExpenses() {
  const [expenses, setExpenses] = useState([])
  const [projects, setProjects] = useState([])
  const [customCategories, setCustomCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
    const [{ data: proj, error: projErr }, { data: exp, error: expErr }, { data: cats, error: catsErr }] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', USER_ID).order('id'),
      supabase.from('expenses').select('*').eq('user_id', USER_ID).order('date', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', USER_ID).order('id').then(r => r).catch(() => ({ data: [], error: null })),
    ])

    if (projErr) console.error('projects fetch error:', projErr)
    if (expErr) console.error('expenses fetch error:', expErr)
    if (catsErr) console.error('categories fetch error:', catsErr)

    if (proj && proj.length === 0) {
      const { data: created } = await supabase.from('projects')
        .insert(DEFAULT_PROJECTS.map(p => ({ ...p, user_id: USER_ID }))).select()
      setProjects(created || [])
    } else {
      setProjects(proj || [])
    }

    setExpenses(exp || [])
    setCustomCategories(cats || [])
    } catch (err) {
      console.error('fetchAll error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  useEffect(() => {
    const channel = supabase
      .channel('realtime-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, payload => {
        if (payload.eventType === 'INSERT') setExpenses(prev => [payload.new, ...prev])
        if (payload.eventType === 'UPDATE') setExpenses(prev => prev.map(e => e.id === payload.new.id ? payload.new : e))
        if (payload.eventType === 'DELETE') setExpenses(prev => prev.filter(e => e.id !== payload.old.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, payload => {
        if (payload.eventType === 'INSERT') setProjects(prev => [...prev, payload.new])
        if (payload.eventType === 'UPDATE') setProjects(prev => prev.map(p => p.id === payload.new.id ? payload.new : p))
        if (payload.eventType === 'DELETE') setProjects(prev => prev.filter(p => p.id !== payload.old.id))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, payload => {
        if (payload.eventType === 'INSERT') setCustomCategories(prev => [...prev, payload.new])
        if (payload.eventType === 'DELETE') setCustomCategories(prev => prev.filter(c => c.id !== payload.old.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function addExpense(expense) {
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
    const { data, error } = await supabase.from('projects')
      .insert({ name, icon, user_id: USER_ID }).select().single()
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

  async function addCategory(name, icon, color) {
    const { data, error } = await supabase.from('categories')
      .insert({ name, icon, color, user_id: USER_ID }).select().single()
    if (error) { console.error('addCategory error:', error); return null }
    if (data) setCustomCategories(prev => [...prev, data])
    return data
  }

  async function deleteCategory(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) { console.error('deleteCategory error:', error); return }
    setCustomCategories(prev => prev.filter(c => c.id !== id))
  }

  return {
    expenses, projects, customCategories, loading,
    addExpense, editExpense, deleteExpense,
    addProject, deleteProject,
    addCategory, deleteCategory,
  }
}

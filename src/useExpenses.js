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
    const [{ data: proj }, { data: exp }] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', USER_ID).order('id'),
      supabase.from('expenses').select('*').eq('user_id', USER_ID).order('date', { ascending: false }),
    ])

    if (proj && proj.length === 0) {
      // seed default project on first load
      const { data: created } = await supabase.from('projects').insert(
        DEFAULT_PROJECTS.map(p => ({ ...p, user_id: USER_ID }))
      ).select()
      setProjects(created || DEFAULT_PROJECTS)
    } else {
      setProjects(proj || [])
    }

    setExpenses(exp || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function addExpense(expense) {
    const row = { ...expense, user_id: USER_ID }
    const { data } = await supabase.from('expenses').insert(row).select().single()
    if (data) setExpenses(prev => [data, ...prev])
  }

  async function editExpense(id, updates) {
    const { data } = await supabase.from('expenses').update(updates).eq('id', id).select().single()
    if (data) setExpenses(prev => prev.map(e => e.id === id ? data : e))
  }

  async function deleteExpense(id) {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  async function addProject(name, icon) {
    const id = Date.now()
    const { data } = await supabase.from('projects').insert({ id, name, icon, user_id: USER_ID }).select().single()
    if (data) setProjects(prev => [...prev, data])
    return data
  }

  async function deleteProject(id) {
    await supabase.from('projects').delete().eq('id', id)
    setProjects(prev => prev.filter(p => p.id !== id))
    setExpenses(prev => prev.filter(e => e.project_id !== id))
  }

  return { expenses, projects, loading, addExpense, editExpense, deleteExpense, addProject, deleteProject }
}

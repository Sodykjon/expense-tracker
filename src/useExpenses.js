import { useState, useEffect } from 'react'

const EXPENSES_KEY = 'expenses_v1'
const PROJECTS_KEY = 'projects_v1'

const DEFAULT_PROJECTS = [
  { id: 1, name: 'Asosiy uy', icon: '🏠' },
]

export function useExpenses() {
  const [expenses, setExpenses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(EXPENSES_KEY)) || [] } catch { return [] }
  })

  const [projects, setProjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || DEFAULT_PROJECTS } catch { return DEFAULT_PROJECTS }
  })

  useEffect(() => { localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses)) }, [expenses])
  useEffect(() => { localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)) }, [projects])

  function addExpense(expense) {
    setExpenses(prev => [{ ...expense, id: Date.now(), date: new Date().toISOString() }, ...prev])
  }

  function editExpense(id, updates) {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
  }

  function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  function addProject(name, icon) {
    const project = { id: Date.now(), name, icon }
    setProjects(prev => [...prev, project])
    return project
  }

  function deleteProject(id) {
    setProjects(prev => prev.filter(p => p.id !== id))
    setExpenses(prev => prev.filter(e => e.projectId !== id))
  }

  return { expenses, addExpense, editExpense, deleteExpense, projects, addProject, deleteProject }
}

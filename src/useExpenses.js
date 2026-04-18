import { useState, useEffect } from 'react'

const KEY = 'expenses_v1'

export function useExpenses() {
  const [expenses, setExpenses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(expenses))
  }, [expenses])

  function addExpense(expense) {
    setExpenses(prev => [
      { ...expense, id: Date.now(), date: new Date().toISOString() },
      ...prev,
    ])
  }

  function deleteExpense(id) {
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  return { expenses, addExpense, deleteExpense }
}

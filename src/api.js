import { supabase } from './supabase'

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function fetchExpenses() {
  const res = await fetch('/api/expenses', { headers: await authHeaders() })
  if (!res.ok) throw new Error('Failed to fetch expenses')
  return res.json()
}

export async function createExpense(expense) {
  const res = await fetch('/api/expenses', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(expense),
  })
  if (!res.ok) throw new Error('Failed to create expense')
  return res.json()
}

export async function updateExpense(id, fields) {
  const res = await fetch(`/api/expenses/${id}`, {
    method: 'PATCH',
    headers: await authHeaders(),
    body: JSON.stringify(fields),
  })
  if (!res.ok) throw new Error('Failed to update expense')
  return res.json()
}

export async function deleteExpense(id) {
  const res = await fetch(`/api/expenses/${id}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!res.ok) throw new Error('Failed to delete expense')
}

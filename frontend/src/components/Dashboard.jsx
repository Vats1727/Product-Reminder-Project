import React, { useEffect, useState } from 'react'
import './mapping.css'
import TableControls from './TableControls'
import { toast } from 'react-toastify'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Dashboard() {
  const [days, setDays] = useState(30)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({ customerId: '', type: '', source: '' })
  const [reminders, setReminders] = useState([])

  useEffect(() => { loadLists(); fetchReminders() }, [])

  async function loadLists() {
    try {
      const [cs, ps] = await Promise.all([fetch(`${API}/api/customers`), fetch(`${API}/api/products`)])
      const [cd, pd] = await Promise.all([cs.json(), ps.json()])
      setCustomers(cd)
      setProducts(pd)
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchReminders() {
    try {
      const params = new URLSearchParams({ days: String(days) })
      if (filters.customerId) params.set('customerId', filters.customerId)
      if (filters.type) params.set('type', filters.type)
      if (filters.source) params.set('source', filters.source)
      const res = await fetch(`${API}/api/reminders?${params.toString()}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setReminders(data.reminders || [])
    } catch (err) {
      console.error('Failed to load reminders', err)
      toast.error('Failed to load reminders')
    }
  }

  function formatRemaining(expiry) {
    if (!expiry) return ''
    const now = new Date()
    const end = new Date(expiry)
    if (end < now) return 'Expired'

    let years = end.getFullYear() - now.getFullYear()
    let months = end.getMonth() - now.getMonth()
    let days = end.getDate() - now.getDate()

    if (days < 0) {
      // borrow days from previous month of end
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0)
      days += prevMonth.getDate()
      months -= 1
    }
    if (months < 0) {
      months += 12
      years -= 1
    }

    const parts = []
    if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`)
    if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`)
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
    return parts.length ? parts.join(', ') : 'Today'
  }

  return (
    <div className="page-content">
      <div className="page-header"><h2>Dashboard</h2></div>
      <section>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <label>Days ahead
            <input className="mapping-date-input" type="number" value={days} onChange={e => setDays(Number(e.target.value))} style={{ width: 120 }} />
          </label>
          <label>Customer
            <select value={filters.customerId} onChange={e => setFilters(f => ({ ...f, customerId: e.target.value }))}>
              <option value="">All</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </label>
          <label>Type
            <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}>
              <option value="">All</option>
              <option value="One-time">One-time</option>
              <option value="Recurring">Recurring</option>
            </select>
          </label>
          <label>Source
            <select value={filters.source} onChange={e => setFilters(f => ({ ...f, source: e.target.value }))}>
              <option value="">All</option>
              <option value="In-house">In-house</option>
              <option value="3rd Party">3rd Party</option>
            </select>
          </label>
          <button className="btn-primary" onClick={fetchReminders}>Apply</button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="table-header-row"><th>#</th><th>Customer</th><th>Product</th><th>Expiry</th><th>Due Period</th><th>Details</th></tr>
            </thead>
            <tbody>
              {reminders.length === 0 ? <tr><td colSpan={6} className="empty-row">No reminders</td></tr> : reminders.map((r, i) => (
                <tr key={i}>
                  <td>{i+1}</td>
                  <td>{r.customer?.name}</td>
                  <td>{r.product?.productName}</td>
                  <td>{new Date(r.expiry).toISOString().slice(0,10)}</td>
                  <td>{formatRemaining(r.expiry)}</td>
                  <td>Amount: ${r.product?.amount} | Type: {r.product?.type} | Source: {r.product?.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

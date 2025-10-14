import React, { useEffect, useState, useMemo } from 'react'
import './mapping.css'
import TableControls from './TableControls'
import { toast } from 'react-toastify'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function Dashboard() {
  const [mappings, setMappings] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('customer')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

  useEffect(() => { loadMappings() }, [])

  async function loadMappings() {
    try {
      const res = await fetch(`${API}/api/mappings`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setMappings(data)
    } catch (err) {
      console.error('Failed to load mappings', err)
      toast.error('Failed to load mappings')
    }
  }

  function formatRemaining(mapping) {
    // Calculate due period from mapping/product
    const now = new Date()
    let expiry = null
    const p = mapping.productId
    const start = mapping.dateAssigned ? new Date(mapping.dateAssigned) : null
    if (!start || !p) return ''
    if ((mapping.type || p.type) === 'One-time') {
      expiry = start
    } else {
      // Recurring: add count * period
      let count = mapping.count || p.count || 1
      let period = mapping.period || p.period || 'Months'
      expiry = new Date(start)
      if (period === 'Days') expiry.setDate(expiry.getDate() + count)
      else if (period === 'Months') expiry.setMonth(expiry.getMonth() + count)
      else if (period === 'Years') expiry.setFullYear(expiry.getFullYear() + count)
    }
    if (expiry < now) return 'Expired'
    let years = expiry.getFullYear() - now.getFullYear()
    let months = expiry.getMonth() - now.getMonth()
    let days = expiry.getDate() - now.getDate()
    if (days < 0) { const prevMonth = new Date(expiry.getFullYear(), expiry.getMonth(), 0); days += prevMonth.getDate(); months -= 1 }
    if (months < 0) { months += 12; years -= 1 }
    const parts = []
    if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`)
    if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`)
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
    return parts.length ? parts.join(', ') : 'Today'
  }

  const sortOptions = [
    { value: 'customer', label: 'Customer' },
    { value: 'product', label: 'Product' },
    { value: 'expiry', label: 'Due Period' }
  ]

  const processedMappings = useMemo(() => {
    const q = (searchQuery || '').toLowerCase()
    return mappings
      .filter(m => {
        if (!q) return true
        return (m.customerId?.name || '').toLowerCase().includes(q) || (m.productId?.productName || '').toLowerCase().includes(q) || (m.remarks || '').toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (!sortBy) return 0
        let A, B
        if (sortBy === 'customer') {
          A = (a.customerId?.name || '').toLowerCase()
          B = (b.customerId?.name || '').toLowerCase()
        } else if (sortBy === 'product') {
          A = (a.productId?.productName || '').toLowerCase()
          B = (b.productId?.productName || '').toLowerCase()
        } else if (sortBy === 'expiry') {
          A = formatRemaining(a)
          B = formatRemaining(b)
        } else {
          A = ''
          B = ''
        }
        return A.localeCompare(B) * (sortOrder === 'asc' ? 1 : -1)
      })
  }, [mappings, searchQuery, sortBy, sortOrder])

  const paginatedMappings = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedMappings.slice(start, start + pageSize)
  }, [processedMappings, currentPage, pageSize])

  const handleSort = (newSortBy, newSortOrder) => { setSortBy(newSortBy || sortBy); setSortOrder(newSortOrder || sortOrder); setCurrentPage(1) }
  const handleSearch = (q) => { setSearchQuery(q); setCurrentPage(1) }
  const handlePageChange = (p) => setCurrentPage(p)

  return (
    <div className="page-content">
      <div className="page-header"><h2>Dashboard</h2></div>
      <section>
        <TableControls
          searchQuery={searchQuery}
          onSearchChange={handleSearch}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSort}
          sortOptions={sortOptions}
          totalItems={processedMappings.length}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
        <div className="table-container">
          <table className="table">
            <thead>
              <tr className="table-header-row">
                <th>#</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Expiry</th>
                <th>Due Period</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMappings.length === 0 ? (
                <tr><td colSpan={6} className="empty-row">No mapped products</td></tr>
              ) : (
                paginatedMappings.map((m, i) => {
                  const p = m.productId || {}
                  return (
                    <tr key={m._id}>
                      <td>{(currentPage - 1) * pageSize + i + 1}</td>
                      <td>{m.customerId?.name}</td>
                      <td>{p.productName}</td>
                      <td>{m.dateAssigned ? new Date(m.dateAssigned).toISOString().slice(0,10) : ''}</td>
                      <td>{formatRemaining(m)}</td>
                      <td>Amount: ${m.amount || p.amount} | Type: {m.type || p.type} | Source: {m.source || p.source}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

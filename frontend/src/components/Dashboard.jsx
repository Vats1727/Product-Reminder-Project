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
  const [duePeriodFilter, setDuePeriodFilter] = useState('')

  useEffect(() => { loadMappings() }, [])
    useEffect(() => {
      loadMappings()
      const handler = () => loadMappings()
      window.addEventListener('mappingChanged', handler)
      return () => window.removeEventListener('mappingChanged', handler)
    }, [])

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

  // choose start date: prefer product.datePurchased, fallback to mapping.dateAssigned
  function getStartDate(mapping) {
  const subs = mapping.subscriptions || []
  if (subs.length) {
    const latestSub = subs.reduce((latest, current) => {
      const currentStart = new Date(current.datePurchased || current.dateAssigned)
      const latestStart = latest ? new Date(latest.datePurchased || latest.dateAssigned) : null
      return !latestStart || currentStart > latestStart ? current : latest
    }, null)
    return new Date(latestSub.datePurchased || latestSub.dateAssigned)
  }
  const p = mapping.productId || {}
  return mapping.dateAssigned ? new Date(mapping.dateAssigned) : (p.datePurchased ? new Date(p.datePurchased) : null)
}

  function getExpiryDate(mapping) {
  const subs = mapping.subscriptions || []
  if (subs.length) {
    // Get the latest subscription expiry
    const latestSub = subs.reduce((latest, current) => {
      const currentExpiry = new Date(current.expiresAt)
      const latestExpiry = latest ? new Date(latest.expiresAt) : null
      return !latestExpiry || currentExpiry > latestExpiry ? current : latest
    }, null)
    return new Date(latestSub.expiresAt)
  }

  // fallback to mapping/product logic
  const start = getStartDate(mapping)
  const p = mapping.productId || {}
  if (!start) return null
  if ((mapping.type || p.type) === 'One-time') return new Date(start)
  const count = Number(mapping.count ?? p.count ?? 1)
  const period = mapping.period || p.period || 'Months'
  const expiry = new Date(start)
  if (period === 'Months') expiry.setMonth(expiry.getMonth() + count)
  else if (period === 'Years') expiry.setFullYear(expiry.getFullYear() + count)
  return expiry
}


  function getDuePeriodFromExpiry(expiry) {
    const now = new Date()
    if (!expiry) return ''
    if (expiry < now) return 'Over-Due'
    let years = expiry.getFullYear() - now.getFullYear()
    let months = expiry.getMonth() - now.getMonth()
    let days = expiry.getDate() - now.getDate()
    if (days < 0) { const prevMonth = new Date(expiry.getFullYear(), expiry.getMonth(), 0); days += prevMonth.getDate(); months -= 1 }
    if (months < 0) { months += 12; years -= 1 }
    if (years > 0) return 'Years'
    if (months > 0) return 'Months'
    if (days > 0) return 'Days'
    return '-'
  }

  function getOrdinalSuffix(n) {
    if (!n && n !== 0) return ''
    const j = n % 10, k = n % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
  }

  function formatDuePeriod(purchase, expiry) {
    if (!purchase || !expiry) return ''
    const start = new Date(purchase)
    const end = new Date(expiry)
    if (end < start) return 'Over-Due'
    // Calculate total months and days difference
    let totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    let days = end.getDate() - start.getDate()
    if (days < 0) {
      totalMonths -= 1
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0)
      days += prevMonth.getDate()
    }
    let years = Math.floor(totalMonths / 12)
    let months = totalMonths % 12
    const parts = []
    if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`)
    if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`)
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`)
    return parts.length ? parts.join(', ') : '-'
  }

  function getDuePeriodValue(mapping) {
    const now = new Date()
    const expiry = getExpiryDate(mapping)
    if (!expiry) return Infinity
    if (expiry < now) return -1 // Over-Due
    return expiry.getTime() - now.getTime()
  }

  const sortOptions = [
    { value: 'customer', label: 'Customer' },
    { value: 'product', label: 'Product' },
    { value: 'expiry', label: 'Due Period' },
    { value: 'One-time', label: 'One-time' },
    { value: 'Recurring', label: 'Recurring' }
  ]

  function formatDate(d) {
    if (!d) return ''
    const dt = new Date(d)
    if (isNaN(dt)) return ''
    const dd = String(dt.getDate()).padStart(2, '0')
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const yyyy = dt.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  }

  const processedMappings = useMemo(() => {
    const q = (searchQuery || '').toLowerCase()
    return mappings
      .filter(m => {
        if (!q) return true
        return (m.customerId?.name || '').toLowerCase().includes(q) || (m.productId?.productName || '').toLowerCase().includes(q) || (m.remarks || '').toLowerCase().includes(q)
      })
      .filter(m => {
        if (!duePeriodFilter) return true
        const period = getDuePeriod(m)
        return period === duePeriodFilter
      })
      .sort((a, b) => {
        if (!sortBy) return 0
        let A, B
        if (sortBy === 'customer') {
          A = (a.customerId?.name || '').toLowerCase()
          B = (b.customerId?.name || '').toLowerCase()
          return A.localeCompare(B) * (sortOrder === 'asc' ? 1 : -1)
        } else if (sortBy === 'product') {
          A = (a.productId?.productName || '').toLowerCase()
          B = (b.productId?.productName || '').toLowerCase()
          return A.localeCompare(B) * (sortOrder === 'asc' ? 1 : -1)
        } else if (sortBy === 'expiry') {
          A = getDuePeriodValue(a)
          B = getDuePeriodValue(b)
          return (A - B) * (sortOrder === 'asc' ? 1 : -1)
        } else if (sortBy === 'One-time' || sortBy === 'Recurring') {
          // Sort by matching product/mapping type. Matching items come first in 'asc', last in 'desc'.
          const target = sortBy
          const aType = (a.type || a.productId?.type || '').toString()
          const bType = (b.type || b.productId?.type || '').toString()
          const aMatch = aType === target ? 0 : 1
          const bMatch = bType === target ? 0 : 1
          return (aMatch - bMatch) * (sortOrder === 'asc' ? 1 : -1)
        } else {
          return 0
        }
      })
  }, [mappings, searchQuery, sortBy, sortOrder, duePeriodFilter])

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
                <th>No.</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Purchase</th>
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
                  const subs = m.subscriptions || []
                  const latest = subs.length ? subs[subs.length - 1] : null
                  const expiry = latest ? new Date(latest.expiresAt) : getExpiryDate(m)
                  const purchase = latest ? latest.datePaid : (p.datePurchased || m.dateAssigned)
                  return (
                    <tr key={m._id}>
                      <td>{(currentPage - 1) * pageSize + i + 1}</td>
                      <td>{m.customerId?.name}</td>
                      <td>{p.productName}</td>
                      <td>{formatDate(purchase)}</td>
                      <td>{formatDate(expiry)}</td>
                      <td>{formatDuePeriod(purchase, expiry)}</td>
                      <td>
                        {latest ? (
                          <span>
                            <strong>{latest.ordinal}{getOrdinalSuffix(latest.ordinal)} subscription</strong><br/>
                            Paid: Rs.{latest.unitType === 'Years' ? latest.units * 12 * (m.amount || p.amount || 0) : latest.units * (m.amount || p.amount || 0)} for {latest.units} {latest.unitType}<br/>
                            Type: {m.type || p.type} | Source: {m.source || p.source}
                          </span>
                        ) : (
                          <>Amount: Rs.{m.amount || p.amount} | Type: {m.type || p.type} | Source: {m.source || p.source}</>
                        )}
                      </td>
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

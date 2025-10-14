import React, { useEffect, useState, useMemo } from 'react'
import TableControls from './TableControls'
import './table-controls.css'
import { toast } from 'react-toastify'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function CustomerProductMapping() {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [mappings, setMappings] = useState([])
  const [form, setForm] = useState({
    customerId: '',
    productId: '',
    remarks: '',
    dateAssigned: ''
  })
  
  // Table controls
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('customer')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const sortOptions = [
    { value: 'customer', label: 'Customer' },
    { value: 'product', label: 'Product' },
    { value: 'remarks', label: 'Remarks' }
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
        const A = sortBy === 'customer' ? (a.customerId?.name || '').toLowerCase() : sortBy === 'product' ? (a.productId?.productName || '').toLowerCase() : (a.remarks || '').toLowerCase()
        const B = sortBy === 'customer' ? (b.customerId?.name || '').toLowerCase() : sortBy === 'product' ? (b.productId?.productName || '').toLowerCase() : (b.remarks || '').toLowerCase()
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
  const handlePageSizeChange = (s) => { setPageSize(s); setCurrentPage(1) }

  // inline edit state for remarks
  const [editingMapId, setEditingMapId] = useState(null)
  const [editingRemarks, setEditingRemarks] = useState('')
  const [editingRemarksDate, setEditingRemarksDate] = useState('')

  function formatDateDDMMYYYY(d) {
    if (!d) return ''
    const dt = new Date(d)
    if (isNaN(dt)) return ''
    const dd = String(dt.getDate()).padStart(2, '0')
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const yyyy = dt.getFullYear()
    return `${dd}-${mm}-${yyyy}`
  }

  function toInputDateValue(d) {
    if (!d) return ''
    const dt = new Date(d)
    if (isNaN(dt)) return ''
    return dt.toISOString().slice(0,10)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [customersRes, productsRes, mappingsRes] = await Promise.all([
        fetch(`${API}/api/customers`),
        fetch(`${API}/api/products`),
        fetch(`${API}/api/mappings`)
      ])

      if (customersRes.ok && productsRes.ok && mappingsRes.ok) {
        const [customersData, productsData, mappingsData] = await Promise.all([
          customersRes.json(),
          productsRes.json(),
          mappingsRes.json()
        ])

        setCustomers(customersData)
        setProducts(productsData)
        setMappings(mappingsData)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
      toast.error('Failed to load data')
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.customerId || !form.productId) {
      return toast.error('Please select both customer and product')
    }

    try {
      const res = await fetch(`${API}/api/mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: form.customerId, productId: form.productId, remarks: form.remarks, dateAssigned: form.dateAssigned })
      })

      if (res.ok) {
        const newMapping = await res.json()
        setMappings([newMapping, ...mappings])
  setForm({ customerId: '', productId: '', remarks: '', dateAssigned: '' })
        toast.success('Mapping created successfully')
      } else {
        const error = await res.text()
        throw new Error(error)
      }
    } catch (err) {
      console.error('Failed to create mapping:', err)
      toast.error(err.message || 'Failed to create mapping')
    }
  }

  async function handleUpdateRemarks(mappingId, remarks) {
    try {
      const res = await fetch(`${API}/api/mappings/${mappingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks, dateAssigned: editingRemarksDate })
      })

      if (res.ok) {
        const updatedMapping = await res.json()
        setMappings(prev => prev.map(m => 
          m._id === mappingId ? updatedMapping : m
        ))
        toast.success('Remarks updated')
      } else {
        throw new Error('Failed to update remarks')
      }
    } catch (err) {
      console.error('Failed to update remarks:', err)
      toast.error('Failed to update remarks')
    }
  }

  async function handleDelete(mappingId) {
    if (!window.confirm('Are you sure you want to remove this mapping?')) return

    try {
      const res = await fetch(`${API}/api/mappings/${mappingId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setMappings(prev => prev.filter(m => m._id !== mappingId))
        toast.success('Mapping removed')
      } else {
        throw new Error('Failed to delete mapping')
      }
    } catch (err) {
      console.error('Failed to delete mapping:', err)
      toast.error('Failed to delete mapping')
    }
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Customer-Product Mapping</h2>
      </div>

      <section>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Customer
            <select 
              value={form.customerId} 
              onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
            >
              <option value="">-- Select Customer --</option>
              {customers.map((c, index) => (
                <option key={c._id} value={c._id}>
                  {index + 1}. {c.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Product
            <select 
              value={form.productId} 
              onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
            >
              <option value="">-- Select Product --</option>
              {products.map((p, index) => (
                <option key={p._id} value={p._id}>
                  {index + 1}. {p.productName}
                </option>
              ))}
            </select>
          </label>

          <label>
            Remarks
            <textarea
              value={form.remarks}
              onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
              placeholder="Enter any remarks..."
              rows={3}
            />
          </label>

          <label>
            Date Assigned
            <input type="date" value={form.dateAssigned} onChange={e => setForm(f => ({ ...f, dateAssigned: e.target.value }))} />
          </label>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Create Mapping
            </button>
          </div>
        </form>

        <div className="table-container" style={{ marginTop: '2rem' }}>
          <TableControls
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSort}
            sortOptions={sortOptions}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            totalItems={processedMappings.length}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />

          <table className="table">
            <thead>
              <tr className="table-header-row">
                <th>No.</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Product Details</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMappings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-row">No mappings found</td>
                </tr>
              ) : (
                paginatedMappings.map((m, index) => (
                  <tr key={m._id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{m.customerId?.name}</td>
                    <td>{m.productId?.productName}</td>
                    <td>
                      <div>Amount: ${m.productId?.amount}</div>
                      <div>Type: {m.productId?.type}</div>
                      <div>Source: {m.productId?.source}</div>
                      {m.productId?.type === 'Recurring' && (
                        <div>Period: {m.productId?.count} {m.productId?.period}</div>
                      )}
                    </td>
                    <td>
                      {editingMapId === m._id ? (
                        <>
                          <textarea value={editingRemarks} onChange={e => setEditingRemarks(e.target.value)} rows={2} />
                          <div style={{ marginTop: 6 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>
                              Date Assigned
                              <input type="date" value={editingRemarksDate} onChange={e => setEditingRemarksDate(e.target.value)} />
                            </label>
                            <button className="btn-primary" onClick={async () => {
                              await handleUpdateRemarks(m._id, editingRemarks)
                              setEditingMapId(null)
                            }}>Save</button>
                            <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={() => setEditingMapId(null)}>Cancel</button>
                          </div>
                        </>
                      ) : (
                        <div>
                          <div style={{ whiteSpace: 'pre-wrap' }}>{m.remarks}</div>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>{m.dateAssigned ? formatDateDDMMYYYY(m.dateAssigned) : ''}</div>
                        </div>
                      )}
                    </td>
                    <td>
                      <button className="btn-ghost" style={{ marginRight: 8 }} onClick={() => { setEditingMapId(m._id); setEditingRemarks(m.remarks || ''); setEditingRemarksDate(toInputDateValue(m.dateAssigned)); }}>Edit</button>
                      <button className="btn-ghost" onClick={() => handleDelete(m._id)}>DELETE</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
  // State for editing subscription index in history
import React, { useEffect, useState, useMemo } from 'react'
import TableControls from './TableControls'
import './table-controls.css'
import { toast } from 'react-toastify'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function CustomerProductMapping() {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [mappings, setMappings] = useState([])
  const [editingSubscription, setEditingSubscription] = useState(null)
  const [form, setForm] = useState({
    customerId: '',
    productId: '',
    remarks: '',
    dateAssigned: '',
    amount: '',
    type: 'One-time',
    count: 1,
    period: 'Months',
    source: 'In-house'
  })
  
  // State for editing product details in mapping
  const [editingProductDetails, setEditingProductDetails] = useState(null)
  
  // Table controls
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('customer')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Subscription/payments state
  const [payMonths, setPayMonths] = useState({})
  const [payUnitType, setPayUnitType] = useState({})
  const [showHistory, setShowHistory] = useState({})

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

  function getOrdinalSuffix(n) {
    if (!n && n !== 0) return ''
    const j = n % 10, k = n % 100
    if (j === 1 && k !== 11) return 'st'
    if (j === 2 && k !== 12) return 'nd'
    if (j === 3 && k !== 13) return 'rd'
    return 'th'
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

    // Validate date is not in future
    if (form.dateAssigned) {
      const selectedDate = new Date(form.dateAssigned)
      selectedDate.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // Set to end of today
      
      if (selectedDate > today) {
        return toast.error('Date assigned cannot be in the future')
      }
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
          window.dispatchEvent(new Event('mappingChanged'))
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
    // Validate date is not in future
    if (editingRemarksDate) {
      const selectedDate = new Date(editingRemarksDate)
      selectedDate.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(23, 59, 59, 999) // Set to end of today
      
      if (selectedDate > today) {
        toast.error('Date assigned cannot be in the future')
        return
      }
    }

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
          window.dispatchEvent(new Event('mappingChanged'))
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
              style={{resize: 'none', width: '220px', height:'10px', color:'black'}}
            />
          </label>

          <label>
            Date Assigned
            <input 
              type="date" 
              value={form.dateAssigned} 
              onChange={e => setForm(f => ({ ...f, dateAssigned: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
            />
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
                <th>Subscription</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMappings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-row">No mappings found</td>
                </tr>
              ) : (
                paginatedMappings.map((m, index) => (
                  <tr key={m._id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{m.customerId?.name}</td>
                    <td>{m.productId?.productName}</td>
                    <td>
                      {editingProductDetails === m._id ? (
                        <div className="edit-product-details">
                          <div>
                            <label>Amount: Rs.
                              <input
                                type="number"
                                value={m.amount || m.productId?.amount}
                                onChange={e => setMappings(prev => 
                                  prev.map(mp => mp._id === m._id ? 
                                    {...mp, amount: e.target.value} : mp
                                  )
                                )}
                              />
                            </label>
                          </div>
                          <div>
                            <label>Type:
                              <select
                                value={m.type || m.productId?.type}
                                onChange={e => {
                                  const newType = e.target.value;
                                  setMappings(prev => 
                                    prev.map(mp => mp._id === m._id ? 
                                      {...mp, type: newType} : mp
                                    )
                                  )
                                }}
                              >
                                <option>One-time</option>
                                <option>Recurring</option>
                              </select>
                            </label>
                          </div>
                          <div>
                            <label>Source:
                              <select
                                value={m.source || m.productId?.source}
                                onChange={e => setMappings(prev => 
                                  prev.map(mp => mp._id === m._id ? 
                                    {...mp, source: e.target.value} : mp
                                  )
                                )}
                              >
                                <option>In-house</option>
                                <option>3rd Party</option>
                              </select>
                            </label>
                          </div>
                          {(m.type || m.productId?.type) === 'Recurring' && (
                            <>
                              <div>
                                <label>Count:
                                  <input
                                    type="number"
                                    value={m.count || m.productId?.count}
                                    onChange={e => setMappings(prev => 
                                      prev.map(mp => mp._id === m._id ? 
                                        {...mp, count: e.target.value} : mp
                                      )
                                    )}
                                  />
                                </label>
                              </div>
                              <div>
                                <label>Period:
                                  <select
                                    value={m.period || m.productId?.period}
                                    onChange={e => setMappings(prev => 
                                      prev.map(mp => mp._id === m._id ? 
                                        {...mp, period: e.target.value} : mp
                                      )
                                    )}
                                  >
                                    <option>Days</option>
                                    <option>Months</option>
                                    <option>Years</option>
                                  </select>
                                </label>
                              </div>
                            </>
                          )}
                          <div className="edit-actions" style={{ marginTop: '10px' }}>
                            <button 
                              className="btn-primary" 
                              onClick={async () => {
                                const updatedData = {
                                  amount: m.amount || m.productId?.amount,
                                  type: m.type || m.productId?.type,
                                  source: m.source || m.productId?.source,
                                  count: m.count || m.productId?.count,
                                  period: m.period || m.productId?.period
                                };
                                
                                try {
                                  const res = await fetch(`${API}/api/mappings/${m._id}/details`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(updatedData)
                                  });
                                  
                                  if (res.ok) {
                                    toast.success('Product details updated');
                                    setEditingProductDetails(null);
                                  } else {
                                    throw new Error('Failed to update product details');
                                  }
                                } catch (err) {
                                  console.error('Error updating product details:', err);
                                  toast.error('Failed to update product details');
                                }
                              }}
                            >
                              Save
                            </button>
                            <button 
                              className="btn-ghost" 
                              onClick={() => {
                                setEditingProductDetails(null);
                                // Reset any unsaved changes
                                loadData();
                              }}
                              style={{ marginLeft: '8px' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div>Amount: Rs.{m.amount || m.productId?.amount}</div>
                          <div>Type: {m.type || m.productId?.type}</div>
                          <div>Source: {m.source || m.productId?.source}</div>
                          {(m.type || m.productId?.type) === 'Recurring' && (
                            <div>Period: {m.count || m.productId?.count} {m.period || m.productId?.period}</div>
                          )}
                          <button 
                            className="btn-ghost" 
                            onClick={() => setEditingProductDetails(m._id)}
                            style={{ marginTop: '8px' }}
                          >
                            Edit Details
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      {/* Subscription cell */}
                      {m.subscriptions && m.subscriptions.length ? (
                        (() => {
                          const last = m.subscriptions[m.subscriptions.length - 1]
                          return (
                            <div>
                              <div style={{ fontSize: 13 }}><strong>{last.ordinal}{getOrdinalSuffix(last.ordinal)} subscription</strong></div>
                              <div style={{ fontSize: 12, color: '#333' }}>Paid: {last.amount || (m.amount || m.productId?.amount)} for {last.months} mo</div>
                              <div style={{ fontSize: 12, color: '#666' }}>Expires: {last.expiresAt ? formatDateDDMMYYYY(last.expiresAt) : ''}</div>
                            </div>
                          )
                        })()
                      ) : (
                        <div style={{ fontSize: 12, color: '#666' }}>No subscriptions</div>
                      )}

                      <div style={{ marginTop: 8 }}>
                        <label style={{ fontSize: 12 }}>Units
                          <input type="number" value={payMonths[m._id] || 0} onChange={e => setPayMonths(prev => ({ ...prev, [m._id]: Number(e.target.value) }))} style={{ width: 60, marginLeft: 8 }} />
                        </label>
                        <label style={{ fontSize: 12, marginLeft: 8 }}>Unit type
                          <select value={payUnitType[m._id] || 'Months'} onChange={e => setPayUnitType(prev => ({ ...prev, [m._id]: e.target.value }))} style={{ marginLeft: 8 }}>
                            <option>Months</option>
                            <option>Years</option>
                          </select>
                        </label>
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <button className="btn-primary" 
                          disabled={Number(payMonths[m._id] || 0) <= 0 || Number(m.amount || m.productId?.amount || 0) <= 0}
                          onClick={async () => {
                          const units = Number(payMonths[m._id] || 0)
                          const unitType = payUnitType[m._id] || 'Months'
                          const perUnit = Number(m.amount || m.productId?.amount || 0)
                          const total = units * perUnit
                          if (!perUnit || perUnit <= 0) { toast.error('Invalid product amount'); return }
                          if (units <= 0) { toast.error('Units must be greater than 0'); return }
                          if (!window.confirm(`Record payment of Rs.${total} for ${units} ${unitType}(s)?`)) return
                          try {
                            const res = await fetch(`${API}/api/mappings/${m._id}/pay`, {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ units, unitType, amount: total })
                            })
                            if (res.ok) {
                              const updated = await res.json()
                              setMappings(prev => prev.map(x => x._id === updated._id ? updated : x))
                              window.dispatchEvent(new Event('mappingChanged'))
                              toast.success('Payment recorded')
                            } else {
                              const err = await res.text()
                              throw new Error(err || 'Payment failed')
                            }
                          } catch (err) {
                            console.error('Payment error', err)
                            toast.error(err.message || 'Failed to record payment')
                          }
                        }}>Pay</button>
                        <span style={{ marginLeft: 8, fontSize: 13 }}>
                          Total: Rs.{
                            (() => {
                              const units = Number(payMonths[m._id] || 0)
                              const perUnit = Number(m.amount || m.productId?.amount || 0)
                              const unitType = payUnitType[m._id] || 'Months'
                              if (unitType === 'Years') return (units * 12 * perUnit).toFixed(2)
                              return (units * perUnit).toFixed(2)
                            })()
                          }
                        </span>

                        <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={() => setShowHistory(prev => ({ ...prev, [m._id]: !prev[m._id] }))}>
                          {showHistory[m._id] ? 'Hide History' : `History (${(m.subscriptions||[]).length})`}
                        </button>
                      </div>

                      {showHistory[m._id] && (
                        <div style={{ marginTop: 8, fontSize: 13 }}>
                          {(m.subscriptions || []).map((s, idx) => {
                            const isEditing = editingSubscription === `${m._id}_${idx}`;
                            const perUnit = Number(m.amount || m.productId?.amount || 0);
                            const calcAmount = s.unitType === 'Years' ? s.units * 12 * perUnit : s.units * perUnit;
                            return (
                              <div key={idx} style={{ padding: '6px 0', borderBottom: '1px dashed #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                  <strong>{s.ordinal}{getOrdinalSuffix(s.ordinal)}:</strong> Rs.{calcAmount} for {s.units} {s.unitType}
                                  <div style={{ color: '#666' }}>Paid: {formatDateDDMMYYYY(s.datePaid)} — Expires: {formatDateDDMMYYYY(s.expiresAt)}</div>
                                </div>
                                <div>
                                  {isEditing ? (
                                    <span>
                                      <input type="number" min={1} defaultValue={s.units} id={`edit-units-${m._id}-${idx}`} style={{ width: 50 }} />
                                      <select defaultValue={s.unitType} id={`edit-unitType-${m._id}-${idx}`} style={{ marginLeft: 8 }}>
                                        <option>Months</option>
                                        <option>Years</option>
                                      </select>
                                      <span style={{ marginLeft: 8, fontSize: 13 }}>
                                        Total: Rs.{(() => {
                                          const units = Number(document.getElementById(`edit-units-${m._id}-${idx}`)?.value || s.units);
                                          const unitType = document.getElementById(`edit-unitType-${m._id}-${idx}`)?.value || s.unitType;
                                          if (unitType === 'Years') return (units * 12 * perUnit).toFixed(2);
                                          return (units * perUnit).toFixed(2);
                                        })()}
                                      </span>
                                      <button className="btn-primary" style={{ marginLeft: 8 }} onClick={async () => {
                                        const units = Number(document.getElementById(`edit-units-${m._id}-${idx}`)?.value || s.units);
                                        const unitType = document.getElementById(`edit-unitType-${m._id}-${idx}`)?.value || s.unitType;
                                        const amount = unitType === 'Years' ? units * 12 * perUnit : units * perUnit;
                                        try {
                                          const res = await fetch(`${API}/api/mappings/${m._id}/subscription/${idx}`, {
                                            method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ units, unitType, amount })
                                          })
                                          if (res.ok) {
                                            const updated = await res.json()
                                            setMappings(prev => prev.map(x => x._id === updated._id ? updated : x))
                                            window.dispatchEvent(new Event('mappingChanged'))
                                            toast.success('Subscription updated')
                                            setEditingSubscription(null)
                                          } else {
                                            throw new Error('Failed to update subscription')
                                          }
                                        } catch (err) {
                                          toast.error('Failed to update subscription')
                                        }
                                      }}>Save</button>
                                      <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={() => setEditingSubscription(null)}>Cancel</button>
                                    </span>
                                  ) : (
                                    <>
                                      {/* <button className="btn-ghost" style={{ marginRight: 8 }} onClick={() => setEditingSubscription(`${m._id}_${idx}`)}>Edit</button> */}
                                      <button className="btn-ghost" onClick={async () => {
                                        if (!window.confirm('Delete this subscription?')) return
                                        try {
                                          const res = await fetch(`${API}/api/mappings/${m._id}/subscription/${idx}`, {
                                            method: 'DELETE'
                                          })
                                          if (res.ok) {
                                            const updated = await res.json()
                                            setMappings(prev => prev.map(x => x._id === updated._id ? updated : x))
                                            window.dispatchEvent(new Event('mappingChanged'))
                                            toast.success('Subscription deleted')
                                          } else {
                                            throw new Error('Failed to delete subscription')
                                          }
                                        } catch (err) {
                                          toast.error('Failed to delete subscription')
                                        }
                                      }}>Delete</button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                    <td>
                      {editingMapId === m._id ? (
                        <>
                          <textarea value={editingRemarks} onChange={e => setEditingRemarks(e.target.value)} rows={2} />
                          <div style={{ marginTop: 6 }}>
                            <label style={{ display: 'block', marginBottom: 6 }}>
                              Date Assigned
                              <input 
                                type="date" 
                                value={editingRemarksDate} 
                                onChange={e => setEditingRemarksDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                              />
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
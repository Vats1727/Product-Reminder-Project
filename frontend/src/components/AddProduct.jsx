import React, { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import TableControls from './TableControls'
import './table-controls.css'

const CUSTOMER_KEY = 'ss_customers'
const PRODUCT_KEY = 'ss_products'
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function fetchCustomers() {
  try {
    const res = await fetch(`${API}/api/customers`)
    if (res.ok) return (await res.json()).map(c => ({ id: c._id || c.id, name: c.name, email: c.email }))
  } catch (e) {}
  try { return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || '[]') } catch { return [] }
}

async function fetchProducts() {
  try {
    const res = await fetch(`${API}/api/products`)
    if (res.ok) {
      const data = await res.json()
      // Normalize: if product.customers populated, use first customer's _id as customerId
      return data.map(p => ({
        id: p._id || p.id,
        productName: p.productName,
        amount: p.amount,
        type: p.type,
        count: p.count,
        period: p.period,
        source: p.source,
        datePurchased: p.datePurchased,
        customerId: Array.isArray(p.customers) && p.customers.length ? (p.customers[0]._id || p.customers[0].id) : p.customerId || ''
      }))
    }
  } catch (e) {}
  try { return JSON.parse(localStorage.getItem(PRODUCT_KEY) || '[]') } catch { return [] }
}

export default function AddProduct() {
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ productName: '', amount: '', type: 'One-time', count: 1, period: 'Months', source: 'In-house' })

  useEffect(() => {
    let mounted = true
    Promise.all([fetchCustomers(), fetchProducts()]).then(([cs, ps]) => {
      if (!mounted) return
      setCustomers(cs)
      setProducts(ps)
    })
    return () => { mounted = false }
  }, [])

  // Table controls state
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('productName')
  const [sortOrder, setSortOrder] = useState('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const sortOptions = [
    { value: 'productName', label: 'Product Name' },
    { value: 'amount', label: 'Amount' },
    { value: 'type', label: 'Type' },
    { value: 'source', label: 'Source' }
  ]

  const filteredProducts = useMemo(() => {
    const q = (searchQuery || '').toLowerCase()
    return products
      .filter(p => {
        if (!q) return true
        return p.productName?.toLowerCase().includes(q) || p.type?.toLowerCase().includes(q) || String(p.amount || '').includes(q) || (p.source || '').toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (!sortBy) return 0
        if (sortBy === 'amount') return (Number(a.amount) - Number(b.amount)) * (sortOrder === 'asc' ? 1 : -1)
        const A = String(a[sortBy] || '').toLowerCase()
        const B = String(b[sortBy] || '').toLowerCase()
        return A.localeCompare(B) * (sortOrder === 'asc' ? 1 : -1)
      })
  }, [products, searchQuery, sortBy, sortOrder])

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredProducts.slice(start, start + pageSize)
  }, [filteredProducts, currentPage, pageSize])

  const handleSort = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy || sortBy)
    setSortOrder(newSortOrder || sortOrder)
    setCurrentPage(1)
  }

  const handleSearch = (q) => { setSearchQuery(q); setCurrentPage(1) }
  const handlePageChange = (p) => setCurrentPage(p)
  const handlePageSizeChange = (s) => { setPageSize(s); setCurrentPage(1) }

  function validate(f) {
    if (!f.productName?.trim()) return 'Product name is required'
    if (!f.amount || Number(f.amount) <= 0) return 'Enter a valid amount'
    if (f.type === 'Recurring' && (!f.count || Number(f.count) <= 0)) return 'Recurring count must be at least 1'
    return null
  }

  async function reload() {
    const [cs, ps] = await Promise.all([fetchCustomers(), fetchProducts()])
    setCustomers(cs)
    setProducts(ps)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate(form)
    if (err) return toast.error(err)

    const payload = { ...form }
    // ensure amount/count numeric and date as ISO if present
    payload.amount = Number(payload.amount)
    payload.count = Number(payload.count)
    if (payload.datePurchased === '') delete payload.datePurchased

    try {
      let res
      if (editingId) {
        res = await fetch(`${API}/api/products/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      } else {
        res = await fetch(`${API}/api/products`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      }
      if (res.ok) {
        const saved = await res.json()
        // update products in-place
        setProducts(prev => {
          const normalized = { id: saved._id || saved.id, productName: saved.productName, amount: saved.amount, type: saved.type, count: saved.count, period: saved.period, source: saved.source, datePurchased: saved.datePurchased, customerId: Array.isArray(saved.customers) && saved.customers.length ? (saved.customers[0]._id || saved.customers[0].id) : '' }
          if (editingId) return prev.map(p => p.id === editingId ? normalized : p)
          return [normalized, ...prev]
        })
        setForm({ ...form, productName: '', amount: '', datePurchased: '', type: 'One-time', count: 1, period: 'Months', source: 'In-house' })
        setEditingId(null)
        return toast.success('Product saved')
      }
      const text = await res.text()
      throw new Error(text || 'Server error')
    } catch (err) {
      console.warn('Server error, saving locally', err)
      // fallback to local
      try {
        const list = JSON.parse(localStorage.getItem(PRODUCT_KEY) || '[]')
        if (editingId) {
          const idx = list.findIndex(p => p.id === editingId)
          if (idx !== -1) list[idx] = { ...list[idx], ...form }
        } else {
          list.unshift({ id: Date.now().toString(), ...form })
        }
        localStorage.setItem(PRODUCT_KEY, JSON.stringify(list))
        setProducts(list)
        toast.success('Saved locally')
      } catch (e) {
        console.error('Local save failed', e)
        toast.error('Failed to save')
      }
    }
  }

  function handleEdit(p) {
    // find the full product object from products array
    const product = products.find(x => x.id === p.id) || p
    setForm({ customerId: product.customerId || '', productName: product.productName || '', amount: product.amount || '', datePurchased: product.datePurchased ? new Date(product.datePurchased).toISOString().slice(0,10) : '', type: product.type || 'One-time', count: product.count || 1, period: product.period || 'Months', source: product.source || 'In-house' })
    setEditingId(product.id)
  }

  function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return
    ;(async () => {
      // If id doesn't look like a Mongo ObjectId, treat as local-only
      const isObjectId = /^[a-fA-F0-9]{24}$/.test(id)
      if (!isObjectId) {
        try {
          const list = JSON.parse(localStorage.getItem(PRODUCT_KEY) || '[]').filter(p => p.id !== id)
          localStorage.setItem(PRODUCT_KEY, JSON.stringify(list))
          setProducts(list)
          toast.success('Product deleted (local)')
        } catch (e) {
          console.error('Local delete failed', e)
          toast.error('Failed to delete product')
        }
        return
      }

      try {
        const res = await fetch(`${API}/api/products/${id}`, { method: 'DELETE' })
        if (res.ok) {
          setProducts(ps => ps.filter(p => p.id !== id))
          try { const list = JSON.parse(localStorage.getItem(PRODUCT_KEY) || '[]').filter(p => p.id !== id); localStorage.setItem(PRODUCT_KEY, JSON.stringify(list)) } catch (e) {}
          toast.success('Product deleted')
        } else {
          const text = await res.text().catch(() => '')
          console.warn('Server delete failed', text)
          try { const list = JSON.parse(localStorage.getItem(PRODUCT_KEY) || '[]').filter(p => p.id !== id); localStorage.setItem(PRODUCT_KEY, JSON.stringify(list)); setProducts(list); toast.success('Product deleted (local)') } catch (e) { toast.error('Failed to delete product') }
        }
      } catch (err) {
        console.warn('Network error during delete, falling back to local', err)
        try { const list = JSON.parse(localStorage.getItem(PRODUCT_KEY) || '[]').filter(p => p.id !== id); localStorage.setItem(PRODUCT_KEY, JSON.stringify(list)); setProducts(list); toast.success('Product deleted (local)') } catch (e) { toast.error('Failed to delete product') }
      }
    })()
  }

  return (
    <div className="page-content">
      <div className="page-header"><h2>Add Product</h2></div>
      <section>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Product Name
            <input value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} placeholder="Enter product name" />
          </label>

          <label>Amount
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Enter amount" />
          </label>

          <label>Type
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
              <option>One-time</option>
              <option>Recurring</option>
            </select>
          </label>

          {form.type === 'Recurring' && (
            <>
              <label>Recurring Count
                <input type="number" value={form.count} onChange={e => setForm(f => ({ ...f, count: e.target.value }))} />
              </label>
              <label>Period
                <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
                  <option>Days</option>
                  <option>Months</option>
                  <option>Quarters</option>
                  <option>Years</option>
                </select>
              </label>
            </>
          )}

          <label>Source
            <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
              <option>In-house</option>
              <option>3rd Party</option>
            </select>
          </label>

          <div className="form-actions">
            <button type="submit" className="btn-primary">{editingId ? 'Update Product' : 'Add Product'}</button>
            {editingId && <button type="button" className="btn-ghost" onClick={() => { setForm({ customerId: form.customerId, productName: '', amount: '', datePurchased: '', type: 'One-time', count: 1, period: 'Months', source: 'In-house' }); setEditingId(null) }}>Cancel</button>}
          </div>
        </form>

        <div className="table-container">
          <TableControls
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSort}
            sortOptions={sortOptions}
            pageSize={pageSize}
            onPageSizeChange={handlePageSizeChange}
            totalItems={filteredProducts.length}
            currentPage={currentPage}
            onPageChange={handlePageChange}
          />
          <table className="table">
            <thead>
              <tr className="table-header-row"><th>No.</th><th>Product Name</th><th>Amount</th><th>Type</th><th>Source</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr><td colSpan={6} className="empty-row">No products found</td></tr>
              ) : (
                paginatedProducts.map((p, index) => (
                  <tr key={p.id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{p.productName}</td>
                    <td>{p.amount}</td>
                    <td>{p.type}{p.type === 'Recurring' ? ` (${p.count} ${p.period})` : ''}</td>
                    <td>{p.source}</td>
                    <td>
                      <button className="btn-ghost" style={{ marginRight: 8 }} onClick={() => handleEdit(p)}>Edit</button>
                      <button className="btn-ghost" onClick={() => handleDelete(p.id)}>Delete</button>
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

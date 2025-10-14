import React, { useEffect, useState, useMemo } from 'react'
import { toast } from 'react-toastify'
import TableControls from './TableControls'
import './table-controls.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function fetchProducts() {
  try {
    const res = await fetch(`${API}/api/products`)
    if (res.ok) {
      const data = await res.json()
      return data.map(p => ({
        id: p._id || p.id,
        productName: p.productName,
        amount: p.amount,
        type: p.type,
        count: p.count,
        period: p.period,
        source: p.source
      }))
    }
  } catch (e) {}
  return []
}

export default function AddProduct() {
  const [products, setProducts] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    productName: '',
    amount: '',
    type: 'One-time',
    count: 1,
    period: 'Months',
    source: 'In-house'
  })

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

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const data = await fetchProducts()
      setProducts(data)
    } catch (err) {
      console.error('Failed to load products:', err)
      toast.error('Failed to load products')
    }
  }

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const searchLower = searchQuery.toLowerCase()
        return (
          product.productName.toLowerCase().includes(searchLower) ||
          product.type.toLowerCase().includes(searchLower) ||
          product.source.toLowerCase().includes(searchLower)
        )
      })
      .sort((a, b) => {
        let comparison = 0
        if (sortBy === 'amount') {
          comparison = Number(a[sortBy]) - Number(b[sortBy])
        } else {
          comparison = String(a[sortBy]).localeCompare(String(b[sortBy]))
        }
        return sortOrder === 'asc' ? comparison : -comparison
      })
  }, [products, searchQuery, sortBy, sortOrder])

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    const end = start + pageSize
    return filteredProducts.slice(start, end)
  }, [filteredProducts, currentPage, pageSize])

  function validate(f) {
    if (!f.productName?.trim()) return 'Product name is required'
    if (!f.amount || Number(f.amount) <= 0) return 'Enter a valid amount'
    if (f.type === 'Recurring' && (!f.count || Number(f.count) <= 0)) return 'Recurring count must be at least 1'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const err = validate(form)
    if (err) return toast.error(err)

    try {
      const payload = { ...form }
      payload.amount = Number(payload.amount)
      payload.count = Number(payload.count)

      let res
      if (editingId) {
        res = await fetch(`${API}/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch(`${API}/api/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      if (res.ok) {
        await loadProducts()
        setForm({
          productName: '',
          amount: '',
          type: 'One-time',
          count: 1,
          period: 'Months',
          source: 'In-house'
        })
        setEditingId(null)
        toast.success(editingId ? 'Product updated' : 'Product added')
      } else {
        const error = await res.text()
        throw new Error(error || 'Failed to save product')
      }
    } catch (err) {
      console.error('Failed to save product:', err)
      toast.error(err.message || 'Failed to save product')
    }
  }

  function handleEdit(p) {
    setForm({
      productName: p.productName || '',
      amount: p.amount || '',
      type: p.type || 'One-time',
      count: p.count || 1,
      period: p.period || 'Months',
      source: p.source || 'In-house'
    })
    setEditingId(p.id)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this product?')) return

    try {
      const res = await fetch(`${API}/api/products/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id))
        toast.success('Product deleted')
      } else {
        throw new Error('Failed to delete product')
      }
    } catch (err) {
      console.error('Failed to delete product:', err)
      toast.error('Failed to delete product')
    }
  }

  const handleSort = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy || sortBy)
    setSortOrder(newSortOrder || sortOrder)
    setCurrentPage(1)
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>Add Product</h2>
      </div>

      <section>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>Product Name
            <input 
              value={form.productName} 
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} 
              placeholder="Enter product name" 
            />
          </label>

          <label>Amount
            <input 
              type="number" 
              value={form.amount} 
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} 
              placeholder="Enter amount" 
            />
          </label>

          <label>Type
            <select 
              value={form.type} 
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              <option>One-time</option>
              <option>Recurring</option>
            </select>
          </label>

          {form.type === 'Recurring' && (
            <>
              <label>Recurring Count
                <input 
                  type="number" 
                  value={form.count} 
                  onChange={e => setForm(f => ({ ...f, count: e.target.value }))} 
                />
              </label>
              <label>Period
                <select 
                  value={form.period} 
                  onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                >
                  <option>Days</option>
                  <option>Months</option>
                  
                  <option>Years</option>
                </select>
              </label>
            </>
          )}

          <label>Source
            <select 
              value={form.source} 
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            >
              <option>In-house</option>
              <option>3rd Party</option>
            </select>
          </label>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingId ? 'Update Product' : 'Add Product'}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="btn-ghost" 
                onClick={() => {
                  setForm({
                    productName: '',
                    amount: '',
                    type: 'One-time',
                    count: 1,
                    period: 'Months',
                    source: 'In-house'
                  })
                  setEditingId(null)
                }}
              >
                Cancel
              </button>
            )}
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
              <tr className="table-header-row">
                <th>No.</th>
                <th>Product Name</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty-row">No products found</td>
                </tr>
              ) : (
                paginatedProducts.map((p, index) => (
                  <tr key={p.id}>
                    <td>{(currentPage - 1) * pageSize + index + 1}</td>
                    <td>{p.productName}</td>
                    <td>${p.amount}</td>
                    <td>{p.type}{p.type === 'Recurring' ? ` (${p.count} ${p.period})` : ''}</td>
                    <td>{p.source}</td>
                    <td>
                      <button 
                        className="btn-ghost" 
                        style={{ marginRight: 8 }} 
                        onClick={() => handleEdit(p)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-ghost" 
                        onClick={() => handleDelete(p.id)}
                      >
                        Delete
                      </button>
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
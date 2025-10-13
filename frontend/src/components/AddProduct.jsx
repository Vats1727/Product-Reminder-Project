import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const CUSTOMER_KEY = 'ss_customers'
const PRODUCT_KEY = 'ss_products'

function loadCustomers() {
	try { return JSON.parse(localStorage.getItem(CUSTOMER_KEY) || '[]') } catch { return [] }
}
function loadProducts() {
	try { return JSON.parse(localStorage.getItem(PRODUCT_KEY) || '[]') } catch { return [] }
}

export default function AddProduct() {
	const [customers, setCustomers] = useState([])
	const [products, setProducts] = useState([])
	const [editingId, setEditingId] = useState(null)
	const [form, setForm] = useState({ 
		customerId: '', 
		productName: '',
		amount: '', 
		type: 'One-time', 
		count: 1, 
		period: 'Months', 
		source: 'In-house' 
	})

  useEffect(() => {
		const cs = loadCustomers()
		setCustomers(cs)
		const ps = loadProducts()
		setProducts(ps)
		if (cs.length && !form.customerId) setForm(f => ({ ...f, customerId: cs[0].id }))
	}, [])

	function validate(f) {
		if (!f.customerId) return 'Select a customer'
		if (!f.productName?.trim()) return 'Product name is required'
		if (!f.amount || Number(f.amount) <= 0) return 'Enter a valid amount'
		if (f.type === 'Recurring' && (!f.count || Number(f.count) <= 0)) return 'Recurring count must be at least 1'
		return null
	}

	function handleSubmit(e) {
		e.preventDefault()
		const err = validate(form)
		if (err) return toast.error(err)

		try {
			const list = loadProducts()
			
			if (editingId) {
				// Update existing product
				const index = list.findIndex(p => p.id === editingId)
				if (index === -1) throw new Error('Product not found')
				list[index] = { 
					...list[index], 
					...form, 
					amount: Number(form.amount), 
					count: Number(form.count) 
				}
				localStorage.setItem(PRODUCT_KEY, JSON.stringify(list))
				setProducts(list)
				setEditingId(null)
				toast.success('Product updated')
			} else {
				// Add new product
				const id = Date.now().toString()
				const item = { id, ...form, amount: Number(form.amount), count: Number(form.count) }
				list.push(item)
				localStorage.setItem(PRODUCT_KEY, JSON.stringify(list))
				setProducts(list)
				toast.success('Product added')
			}
			
			setForm(f => ({ 
				...f, 
				productName: '',
				amount: '', 
				type: 'One-time', 
				count: 1, 
				period: 'Months', 
				source: 'In-house' 
			}))
		} catch (err) {
			console.error(err)
			toast.error(editingId ? 'Failed to update product' : 'Failed to save product')
		}
	}

	function editProduct(product) {
		setForm({ 
			customerId: product.customerId,
			productName: product.productName,
			amount: product.amount.toString(),
			type: product.type,
			count: product.count,
			period: product.period,
			source: product.source
		})
		setEditingId(product.id)
	}

	function removeProduct(id) {
		if (!window.confirm('Delete this product?')) return
		try {
			const list = loadProducts().filter(p => p.id !== id)
			localStorage.setItem(PRODUCT_KEY, JSON.stringify(list))
			setProducts(list)
			toast.success('Product deleted')
		} catch (err) {
			console.error(err)
			toast.error('Failed to delete product')
		}
	}

		return (
			<div className="page-content">
				<div className="page-header">
					<h2>Add Product</h2>
					{/* <div className="top-actions">
						<button className="btn-action">Add Product</button>
					</div> */}
				</div>

				<section>
					<form className="form-grid" onSubmit={handleSubmit}>
						<label>
							Customer
							<select value={form.customerId} onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}>
								<option value="">-- select customer --</option>
								{customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
							</select>
						</label>

						<label>
							Product Name
							<input 
								placeholder="Enter product name"
								value={form.productName}
								onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
							/>
						</label>

						<label>
							Amount
							<input 
								type="number" 
								placeholder="Enter amount"
								value={form.amount} 
								onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
							/>
						</label>

						<label>
							Type
							<select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
								<option>One-time</option>
								<option>Recurring</option>
							</select>
						</label>

						{form.type === 'Recurring' && (
							<>
								<label>
									Recurring Count
									<input 
										type="number" 
										placeholder="Number of recurrences"
										value={form.count} 
										onChange={e => setForm(f => ({ ...f, count: e.target.value }))}
									/>
								</label>

								<label>
									Period
									<select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}>
										<option>Days</option>
										<option>Months</option>
										<option>Quarters</option>
										<option>Years</option>
									</select>
								</label>
							</>
						)}

						<label>
							Source
							<select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
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
										setForm(f => ({
											...f,
											productName: '',
											amount: '',
											type: 'One-time',
											count: 1,
											period: 'Months',
											source: 'In-house'
										}))
										setEditingId(null)
									}}
								>
									Cancel
								</button>
							)}
						</div>
					</form>

					<div className="table-container">
						<table className="table">
							<thead>
								<tr className="table-header-row">
									<th>ID</th>
									<th>Customer</th>
									<th>Product Name</th>
									<th>Amount</th>
									<th>Type</th>
									<th>Source</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{products.length === 0 ? (
									<tr>
										<td colSpan="7" className="empty-row">No products found</td>
									</tr>
								) : (
									products.map(p => (
										<tr key={p.id}>
											<td>{p.id}</td>
											<td>{customers.find(c => c.id === p.customerId)?.name || '—'}</td>
											<td>{p.productName}</td>
											<td>{p.amount}</td>
											<td>{p.type}{p.type === 'Recurring' ? ` (${p.count} ${p.period})` : ''}</td>
											<td>{p.source}</td>
											<td>
												<button 
													className="btn-ghost" 
													style={{ marginRight: 8 }} 
													onClick={() => editProduct(p)}
												>
													Edit
												</button>
												<button 
													className="btn-ghost" 
													onClick={() => removeProduct(p.id)}
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
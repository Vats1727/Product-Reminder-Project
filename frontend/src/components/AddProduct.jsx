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
	const [form, setForm] = useState({ customerId: '', amount: '', type: 'One-time', count: 1, period: 'Months', source: 'In-house' })

	useEffect(() => {
		const cs = loadCustomers()
		setCustomers(cs)
		const ps = loadProducts()
		setProducts(ps)
		if (cs.length && !form.customerId) setForm(f => ({ ...f, customerId: cs[0].id }))
	}, [])

	function validate(f) {
		if (!f.customerId) return 'Select a customer'
		if (!f.amount || Number(f.amount) <= 0) return 'Enter a valid amount'
		if (f.type === 'Recurring' && (!f.count || Number(f.count) <= 0)) return 'Recurring count must be at least 1'
		return null
	}

	function onSubmit(e) {
		e.preventDefault()
		const err = validate(form)
		if (err) return toast.error(err)

		try {
			const list = loadProducts()
			const id = Date.now().toString()
			const item = { id, ...form, amount: Number(form.amount), count: Number(form.count) }
			list.push(item)
			localStorage.setItem(PRODUCT_KEY, JSON.stringify(list))
			setProducts(list)
			toast.success('Product added')
			setForm({ ...form, amount: '', type: 'One-time', count: 1, period: 'Months', source: 'In-house' })
		} catch (err) {
			console.error(err)
			toast.error('Failed to save product')
		}
	}

	return (
		<div className="page-content">
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
				<h2>Add Product</h2>
			</div>

			<section>
				<form className="form-grid" onSubmit={onSubmit} style={{ marginBottom: 18 }}>
					<label>
						Customer
						<select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
							<option value="">-- select --</option>
							{customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
						</select>
					</label>

					<label>
						Amount
						<input placeholder="Amount" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
					</label>

					<label>
						Type
						<select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
							<option>One-time</option>
							<option>Recurring</option>
						</select>
					</label>

					{form.type === 'Recurring' && (
						<>
							<label>
								Recurring count
								<input placeholder="Recurring count" type="number" value={form.count} onChange={e => setForm({ ...form, count: e.target.value })} />
							</label>

							<label>
								Period
								<select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })}>
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
						<select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>
							<option>In-house</option>
							<option>3rd Party</option>
						</select>
					</label>

					<div style={{ alignSelf: 'end' }}>
						<button className="btn-primary" type="submit">Add Product</button>
					</div>
				</form>

				<table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr>
							<th style={{ textAlign: 'left', padding: 8 }}>Id</th>
							<th style={{ textAlign: 'left', padding: 8 }}>Customer</th>
							<th style={{ textAlign: 'left', padding: 8 }}>Amount</th>
							<th style={{ textAlign: 'left', padding: 8 }}>Type</th>
							<th style={{ textAlign: 'left', padding: 8 }}>Source</th>
						</tr>
					</thead>
					<tbody>
						{products.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 18 }}>No products found</td></tr>}
						{products.map(p => (
							<tr key={p.id}>
								<td style={{ padding: 8 }}>{p.id}</td>
								<td style={{ padding: 8 }}>{customers.find(c => c.id === p.customerId)?.name || '—'}</td>
								<td style={{ padding: 8 }}>{p.amount}</td>
								<td style={{ padding: 8 }}>{p.type}{p.type === 'Recurring' ? ` (${p.count} ${p.period})` : ''}</td>
								<td style={{ padding: 8 }}>{p.source}</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</div>
	)
}
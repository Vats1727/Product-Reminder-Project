import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const STORAGE_KEY = 'ss_customers'
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

async function loadCustomers() {
	// Try server first
	try {
		const res = await fetch(`${API}/api/customers`)
		if (res.ok) {
			const data = await res.json()
			// map Mongo _id -> id for compatibility with the UI
			return data.map(c => ({ id: c._id || c.id, name: c.name, email: c.email, phone: c.phone, products: c.products }))
		}
	} catch (e) {
		// fall through to localStorage
	}

	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
	} catch (e) {
		console.error('Failed parsing customers from localStorage', e)
		return []
	}
}

export default function AddCustomer() {
	const [form, setForm] = useState({ name: '', email: '', phone: '' })
	const [customers, setCustomers] = useState([])
	const [editingId, setEditingId] = useState(null)

	useEffect(() => {
		let mounted = true
		loadCustomers().then(list => { if (mounted) setCustomers(list) })
		return () => { mounted = false }
	}, [])

	function validate(f) {
		if (!f.name || !f.email || !f.phone) return 'Please fill all fields'
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return 'Invalid email'
		if (!/^\+?[0-9\-\s]{7,20}$/.test(f.phone)) return 'Invalid phone'
		return null
	}

	async function handleSubmit(e) {
		e.preventDefault()
		const err = validate(form)
		if (err) return toast.error(err)

		try {
			// Try server
			const payload = { name: form.name, email: form.email, phone: form.phone }
			const res = await fetch(`${API}/api/customers`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
			if (res.ok) {
				const saved = await res.json()
				// refresh list from server
				const list = await loadCustomers()
				setCustomers(list)
				setForm({ name: '', email: '', phone: '' })
				setEditingId(null)
				toast.success(editingId ? 'Customer updated' : 'Customer added')
				return
			}

			// fallback to localStorage if server returns non-ok
			console.warn('Server returned error creating customer, falling back to localStorage')
		} catch (err) {
			console.warn('Server unreachable, falling back to localStorage', err)
		}

		// LocalStorage fallback
		try {
			const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
			if (editingId) {
				const index = list.findIndex(c => c.id === editingId)
				if (index === -1) throw new Error('Customer not found')
				list[index] = { ...list[index], ...form }
				localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
				setCustomers(list)
				setEditingId(null)
				toast.success('Customer updated (local)')
			} else {
				const id = Date.now().toString()
				const newCustomer = { id, ...form }
				list.push(newCustomer)
				localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
				setCustomers(list)
				toast.success('Customer added (local)')
			}
			setForm({ name: '', email: '', phone: '' })
		} catch (err) {
			console.error(err)
			toast.error(editingId ? 'Failed to update customer' : 'Failed to save customer')
		}
	}

	function editCustomer(customer) {
		setForm({ name: customer.name, email: customer.email, phone: customer.phone })
		setEditingId(customer.id)
	}

	function removeCustomer(id) {
		if (!window.confirm('Delete this customer?')) return
		try {
			const list = loadCustomers().filter((c) => c.id !== id)
			localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
			setCustomers(list)
			toast.success('Customer deleted')
		} catch (err) {
			console.error(err)
			toast.error('Failed to delete customer')
		}
	}

		return (
			<div className="page-content">
				<div className="page-header">
					<h2>Add Customer</h2>

				</div>

				<section>
					<form className="form-grid" onSubmit={handleSubmit}>
						<label>
							Name
							<input 
								placeholder="Enter name" 
								value={form.name} 
								onChange={e => setForm(f => ({ ...f, name: e.target.value }))} 
							/>
						</label>

						<label>
							Email
							<input 
								placeholder="Enter email" 
								value={form.email} 
								onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
							/>
						</label>

						<label>
							Phone
							<input 
								placeholder="Enter phone" 
								value={form.phone} 
								onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} 
							/>
						</label>

						<div className="form-actions">
							<button type="submit" className="btn-primary">
								{editingId ? 'Update Customer' : 'Add Customer'}
							</button>
							{editingId && (
								<button 
									type="button" 
									className="btn-ghost" 
									onClick={() => {
										setForm({ name: '', email: '', phone: '' })
										setEditingId(null)
									}}
								>
									Cancel
								</button>
							)}
						</div>
					</form>

						<table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
							<thead>
								<tr className="table-header-row">
									<th>Customer Id</th>
									<th>Name</th>
									<th>Email</th>
									<th>Phone</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{customers.length === 0 && (
									<tr><td colSpan={5} className="empty-row">No customers found</td></tr>
								)}
								{customers.map((c) => (
									<tr key={c.id}>
										<td>{c.id}</td>
										<td>{c.name}</td>
										<td>{c.email}</td>
										<td>{c.phone}</td>
										<td>
											<button 
												className="btn-ghost" 
												style={{ marginRight: 8 }} 
												onClick={() => editCustomer(c)}
											>
												Edit
											</button>
											<button 
												className="btn-ghost" 
												onClick={() => removeCustomer(c.id)}
											>
												Delete
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
			</section>
		</div>
	)
}
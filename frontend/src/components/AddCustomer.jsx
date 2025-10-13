import React, { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const STORAGE_KEY = 'ss_customers'

function loadCustomers() {
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

	useEffect(() => {
		setCustomers(loadCustomers())
	}, [])

	function validate(f) {
		if (!f.name || !f.email || !f.phone) return 'Please fill all fields'
		if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return 'Invalid email'
		if (!/^\+?[0-9\-\s]{7,20}$/.test(f.phone)) return 'Invalid phone'
		return null
	}

	function addCustomer(e) {
		e.preventDefault()
		const err = validate(form)
		if (err) return toast.error(err)

		try {
			const list = loadCustomers()
			const id = Date.now().toString()
			const newCustomer = { id, ...form }
			list.push(newCustomer)
			localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
			setCustomers(list)
			setForm({ name: '', email: '', phone: '' })
			toast.success('Customer added')
		} catch (err) {
			console.error(err)
			toast.error('Failed to save customer')
		}
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
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
				<h2>Add Customer</h2>
			</div>

			<section>
				<form className="form-grid" onSubmit={addCustomer} style={{ marginBottom: 18 }}>
					<label>
						Name
						<input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
					</label>

					<label>
						Email
						<input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
					</label>

					<label>
						Phone
						<input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
					</label>

					<div style={{ alignSelf: 'end' }}>
						<button className="btn-primary" type="submit">Add Customer</button>
					</div>
				</form>

				<table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
					<thead>
						<tr>
							<th style={{ textAlign: 'left', padding: 8 }}>Customer Id</th>
							<th style={{ textAlign: 'left', padding: 8 }}>Name</th>
							<th style={{ textAlign: 'left', padding: 8 }}>Email</th>
							<th style={{ textAlign: 'left', padding: 8 }}>Phone</th>
							<th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
						</tr>
					</thead>
					<tbody>
						{customers.length === 0 && (
							<tr><td colSpan={5} style={{ textAlign: 'center', padding: 18 }}>No customers found</td></tr>
						)}
						{customers.map((c) => (
							<tr key={c.id}>
								<td style={{ padding: 8 }}>{c.id}</td>
								<td style={{ padding: 8 }}>{c.name}</td>
								<td style={{ padding: 8 }}>{c.email}</td>
								<td style={{ padding: 8 }}>{c.phone}</td>
								<td style={{ padding: 8 }}>
									<button className="btn-ghost" onClick={() => removeCustomer(c.id)}>Delete</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</section>
		</div>
	)
}
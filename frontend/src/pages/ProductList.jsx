import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductList = ({ refreshKey }) => {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', price: '', expiryDate: '', reminderDaysBefore: '' });

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/products", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Could not fetch products");
    }
  };

  useEffect(() => {
    fetchProducts();
    // refetch when refreshKey changes
  }, [refreshKey]);

  const startEdit = (p) => {
    setEditingId(p._id);
    setEditForm({ name: p.name, price: p.price ?? '', expiryDate: new Date(p.expiryDate).toISOString().slice(0,10), reminderDaysBefore: p.reminderDaysBefore });
  };

  const cancelEdit = () => { setEditingId(null); setEditForm({}); };

  const submitEdit = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/products/${id}`, editForm, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Product updated');
      setEditingId(null);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Update failed');
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Product deleted');
      fetchProducts();
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="panel">
      <h2>Your Products</h2>
      {message && <p className="muted">{message}</p>}
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Expiry Date</th>
            <th>Reminder Days</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              {editingId === p._id ? (
                <>
                  <td><input className="input-full" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></td>
                  <td><input className="input-small" type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} /></td>
                  <td><input className="input-medium" type="date" value={editForm.expiryDate} onChange={e => setEditForm({...editForm, expiryDate: e.target.value})} /></td>
                  <td><input className="input-small" type="number" value={editForm.reminderDaysBefore} onChange={e => setEditForm({...editForm, reminderDaysBefore: e.target.value})} /></td>
                  <td className="actions-col">
                    <button className="btn" onClick={() => submitEdit(p._id)} style={{marginRight:8}}>Save</button>
                    <button className="btn ghost" onClick={cancelEdit}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  <td>{p.name}</td>
                  <td>{p.price != null ? `₹ ${Number(p.price).toFixed(2)}` : '—'}</td>
                  <td>{new Date(p.expiryDate).toLocaleDateString()}</td>
                  <td>{p.reminderDaysBefore}</td>
                  <td>
                    <button className="btn" onClick={() => startEdit(p)} style={{marginRight:8}}>Edit</button>
                    <button className="btn ghost" onClick={() => deleteProduct(p._id)}>Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductList;

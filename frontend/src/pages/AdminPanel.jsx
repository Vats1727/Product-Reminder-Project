import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AdminPanel = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const apiUrl = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000';

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const [uRes, pRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (uRes.ok) setUsers(await uRes.json());
        if (pRes.ok) setProducts(await pRes.json());
      } catch (err) {
        console.error('Admin fetch error', err);
      } finally { setLoading(false); }
    };
    fetchAll();
  }, []);

  // group products by user id (or 'unassigned') for quick lookup
  const grouped = React.useMemo(() => {
    const map = {};
    for (const p of products) {
      const uid = p.user?._id || 'unassigned';
      if (!map[uid]) map[uid] = [];
      map[uid].push(p);
    }
    return map;
  }, [products]);

  const [openUser, setOpenUser] = useState(null);

  const sendReminder = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/admin/products/${productId}/send`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) alert('Reminder sent'); else alert('Failed to send');
    } catch (err) { console.error(err); alert('Error'); }
  };

  const deleteProduct = async (productId) => {
    if (!confirm('Delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/admin/products/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { alert('Deleted');
        // refresh lists
        const [uRes, pRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (uRes.ok) setUsers(await uRes.json());
        if (pRes.ok) setProducts(await pRes.json());
      } else alert('Delete failed');
    } catch (err) { console.error(err); alert('Error'); }
  };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h3>Admin Panel</h3>
        <button className="btn ghost" onClick={onClose}>Close</button>
      </div>

      {loading && <p className="muted">Loading...</p>}

      <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:12}}>
        <div className="panel">
          <h4>Users ({users.length})</h4>
          <table className="table">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Products</th></tr></thead>
            <tbody>
              {users.map(u => (
                <React.Fragment key={u._id}>
                  <tr>
                    <td>{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>{u.role || 'user'}</td>
                    <td>
                      <button className="btn small-btn" onClick={() => setOpenUser(openUser === u._id ? null : u._id)}>
                        {grouped[u._id]?.length || 0} products
                      </button>
                    </td>
                  </tr>
                  {openUser === u._id && (
                    <tr>
                      <td colSpan={4} style={{padding:12}}>
                        <div style={{display:'grid',gap:8}}>
                          { (grouped[u._id] || []).map(p => (
                            <div key={p._id} style={{display:'flex',justifyContent:'space-between',padding:'8px 12px',background:'#fbfbfe',borderRadius:6,alignItems:'center'}}>
                              <div>
                                <strong>{p.name}</strong>
                                <div className="muted" style={{fontSize:12}}>{p.price ? `₹ ${p.price}` : ''} • expires {new Date(p.expiryDate).toLocaleDateString()}</div>
                              </div>
                              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                                <div className="muted" style={{fontSize:12,marginRight:8}}>{p.due ? 'Due' : `${p.daysUntilExpiry}d`}</div>
                                <button className="btn small-btn" onClick={() => sendReminder(p._id)}>Send</button>
                                <button className="btn ghost small-btn" onClick={() => deleteProduct(p._id)}>Delete</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel">
          <h4>Unassigned / All Products ({products.length})</h4>
          <div style={{maxHeight:420,overflow:'auto'}}>
            <table className="table">
              <thead><tr><th>Product</th><th>User</th><th>Price</th><th>Expiry</th><th>DaysUntil</th><th>Due</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.user ? `${p.user.fullName} (${p.user.email})` : '—'}</td>
                    <td>{p.price}</td>
                    <td>{new Date(p.expiryDate).toLocaleDateString()}</td>
                    <td>{p.daysUntilExpiry}</td>
                    <td>{p.due ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

import React, { useEffect, useState, useMemo } from 'react';
import { toast } from 'react-toastify';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

const AdminPanel = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openUser, setOpenUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dueFilter, setDueFilter] = useState('all');

  const apiUrl = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:5000';

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const [uRes, pRes] = await Promise.all([
          fetch(`${apiUrl}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/api/admin/products`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (!mounted) return;
        if (!uRes.ok) throw new Error(`Users fetch failed: ${uRes.status}`);
        if (!pRes.ok) throw new Error(`Products fetch failed: ${pRes.status}`);
        const uData = await uRes.json();
        const pData = await pRes.json();
        setUsers(uData || []);
        setProducts(pData || []);
      } catch (err) {
        console.error('AdminPanel fetch error', err);
        toast.error(err.message || 'Failed to load admin data');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

  const grouped = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const uid = p.user?._id || 'unknown';
      if (!map[uid]) map[uid] = [];
      map[uid].push(p);
    });
    return map;
  }, [products]);

  const filteredProducts = (userId) => {
    const list = grouped[userId] || [];
    return list
      .map((p) => {
        const now = new Date();
        const msBefore = (p.reminderDaysBefore || 0) * 24 * 60 * 60 * 1000;
        const reminderDate = new Date(new Date(p.expiryDate).getTime() - msBefore);
        const daysUntilExpiry = Math.ceil((new Date(p.expiryDate) - now) / (24*60*60*1000));
        const due = now >= new Date(reminderDate.getFullYear(), reminderDate.getMonth(), reminderDate.getDate());
        return { ...p, daysUntilExpiry, due };
      })
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(p => (dueFilter === 'all') || (dueFilter === 'due' && p.due) || (dueFilter === 'notdue' && !p.due));
  };

  const sendReminder = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/admin/products/${productId}/send`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      const data = await res.json();
      toast.success('Reminder sent');
      // update product lastReminderSent locally
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, lastReminderSent: new Date().toISOString() } : p));
    } catch (err) {
      console.error('sendReminder error', err);
      toast.error(err.message || 'Failed to send reminder');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiUrl}/api/admin/products/${productId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }
      toast.success('Product deleted');
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      console.error('deleteProduct error', err);
      toast.error(err.message || 'Failed to delete product');
    }
  };

  return (
    <div className="panel admin-panel">
      <div className="admin-header">
        <h2>Admin Panel</h2>
        {/* <div>
          <button onClick={onClose} className="btn ghost">Close</button>
        </div> */}
      </div>

      {loading ? (
        <p className="muted">Loading...</p>
      ) : (
        <>
          <div className="admin-controls">
            <div className="search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)} className="select-filter">
              <option value="all">All Products</option>
              <option value="due">Due Only</option>
              <option value="notdue">Not Due</option>
            </select>
          </div>

          <div className="users-list">
            {users.map((u) => (
              <div key={u._id} className="user-card">
                <button className="user-toggle" onClick={() => setOpenUser(openUser === u._id ? null : u._id)}>
                  <div>
                    <div className="user-name">{u.fullName}</div>
                    <div className="muted user-email">{u.email}</div>
                  </div>
                  <div className="user-meta">
                    <span className="tag">{grouped[u._id]?.length || 0} products</span>
                    {openUser === u._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {openUser === u._id && (
                  <div className="user-products">
                    {filteredProducts(u._id).length > 0 ? (
                      <div className="products-scroll">
                        {filteredProducts(u._id).map((p) => (
                          <div key={p._id} className="product-item">
                            <div>
                              <div className="product-name">{p.name}</div>
                              <div className="muted">Expires on {new Date(p.expiryDate).toLocaleDateString()} • {p.due ? <span className="due">Due</span> : `${p.daysUntilExpiry} days left`}</div>
                            </div>
                            <div className="product-actions">
                              <button onClick={() => sendReminder(p._id)} className="btn">Send</button>
                              <button onClick={() => deleteProduct(p._id)} className="btn ghost">Delete</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="muted">No products found.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminPanel;

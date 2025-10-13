import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductList from "./ProductList.jsx";
import AddProduct from "./AddProduct.jsx";
import AdminPanel from "./AdminPanel.jsx";

const Dashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [adding, setAdding] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [dueReminders, setDueReminders] = useState([]);
  const [notifyStatus, setNotifyStatus] = useState(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [notifications, setNotifications] = useState([]);

  const apiUrl = (import.meta.env && import.meta.env.VITE_API_URL) || "http://localhost:5000";

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${apiUrl}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data);
      // auto-open admin panel if user is admin
      if (res.data && (res.data.isAdmin || res.data.role === 'admin')) {
        setShowAdmin(true);
      }
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Could not fetch user");
    }
  };

  // fetch user and set notification permission on mount
  useEffect(() => {
    (async () => {
      try {
        console.log('Dashboard: fetching user');
        await fetchUser();
      } catch (err) {
        console.error('Dashboard init error', err);
      }
    })();
    // request notification permission
    if (typeof Notification !== 'undefined') {
      setNotifyStatus(Notification.permission);
    }
  }, []);

  // start due-reminder polling after user is loaded (skip for admins)
  useEffect(() => {
    if (!user) return; // wait until user is loaded
    if (user.isAdmin || user.role === 'admin') return; // admin doesn't use user-specific due endpoint

    let mounted = true;
    const fetchDue = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${apiUrl}/api/products/due`, { headers: { Authorization: `Bearer ${token}` } });
        if (!mounted) return;
        if (!res.ok) {
          const txt = await res.text();
          console.warn('Due reminders fetch failed', res.status, txt);
          return;
        }
        const data = await res.json();
        setDueReminders(data);
        // show browser notifications for new due reminders
        try {
          const shown = JSON.parse(localStorage.getItem('shownReminders') || '[]');
          const newOnes = data.filter(d => !shown.includes(d._id));
          newOnes.forEach(d => {
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification('Product reminder', { body: `${d.name} expires on ${new Date(d.expiryDate).toLocaleDateString()}` });
            }
          });
          const merged = Array.from(new Set([...shown, ...data.map(d => d._id)]));
          localStorage.setItem('shownReminders', JSON.stringify(merged));
        } catch (e) { console.warn('notification error', e); }
      } catch (err) {
        console.error('Failed to fetch due reminders', err);
      }
    };

    // run immediately and then every 60s
    fetchDue();
    const interval = setInterval(fetchDue, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, [user]);

  // Real-time sockets removed; reminders are delivered via polling/notifications

  const handleCreated = () => {
    setRefreshKey(k => k + 1);
    setAdding(false);
  };

  return (
    <div className="app-center">
      <div className="card" style={{width:'100%'}}>
        <div className="topbar" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h2>Dashboard</h2>
          <div className="header-actions">
            {/* {user && user.role === 'admin' && (
              <button onClick={() => setShowAdmin(s => !s)} className="btn" style={{marginRight:8}}>{showAdmin ? 'Close Admin' : 'Admin Panel'}</button>
            )} */}
            <button onClick={() => setAdding(a => !a)} className="btn" style={{marginRight:8}}>{adding ? 'Close' : 'Add Product'}</button>
            <button onClick={() => { localStorage.removeItem('token'); if (onLogout) onLogout(); }} className="btn ghost">Logout</button>
          </div>
        </div>

        <div style={{ marginBottom: 12 }}>
          {notifyStatus === 'unsupported' && <small>Browser notifications not supported.</small>}
          {notifyStatus === 'granted' && <small>Notifications enabled.</small>}
          {notifyStatus === 'denied' && <small>Notifications denied — enable in browser settings.</small>}
          {notifyStatus === 'default' && (
            <button className="btn" onClick={() => {
              if (typeof Notification !== 'undefined') {
                Notification.requestPermission().then(p => setNotifyStatus(p));
              }
            }}>Enable notifications</button>
          )}
        </div>

        {message && <p className="muted">{message}</p>}

        <div className="dash-grid">
          <aside className="sidebar">
            {user ? (
              <div className="panel user-info">
                <h3>User Details</h3>
                <p><strong>Name:</strong> {user.fullName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                {/* <p><strong>Phone:</strong> {user.phone}</p> */}
              </div>
            ) : (
              <div className="panel">Loading user...</div>
            )}

            {dueReminders.length > 0 && (
              <div className="panel" style={{marginTop:12}}>
                <h4>Due reminders</h4>
                <ul className="notify-list">
                  {dueReminders.map(d => (
                    <li key={d._id} className="notify-item">{d.name} — expires {new Date(d.expiryDate).toLocaleDateString()}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          <main className="main-col">
            {showAdmin ? (
              <AdminPanel onClose={() => setShowAdmin(false)} />
            ) : (
            <>
            {/* <div className="panel" style={{marginBottom:12}}>
              <h4>Notifications</h4>
              {notifications.length === 0 ? (
                <p className="muted">No realtime notifications yet.</p>
              ) : (
                <ul className="notify-list">
                  {notifications.map((n, i) => (
                    <li key={i} className="notify-item">{n.product} — sent to {n.to}</li>
                  ))}
                </ul>
              )}
            </div> */}

            {adding && (
              <div className="panel" style={{marginBottom:12}}>
                <h4>Add product</h4>
                <div style={{display:'flex',justifyContent:'center'}}>
                  <AddProduct onCreated={handleCreated} />
                </div>
              </div>
            )}

            <h3 style={{marginTop:16}}>Your Products</h3>
            <ProductList refreshKey={refreshKey} />
            </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

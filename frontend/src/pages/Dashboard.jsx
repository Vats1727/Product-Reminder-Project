import React, { useEffect, useState } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import ProductList from "./ProductList.jsx";
import AddProduct from "./AddProduct.jsx";

const Dashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [adding, setAdding] = useState(false);
  const [dueReminders, setDueReminders] = useState([]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/users/me", { headers: { Authorization: `Bearer ${token}` } });
      setUser(res.data);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Could not fetch user");
    }
  };

  useEffect(() => {
    fetchUser();
    // request notification permission once
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().then(() => {});
    }

    let mounted = true;

    const fetchDue = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:5000/api/products/due', { headers: { Authorization: `Bearer ${token}` } });
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          setDueReminders(data);
          // show notifications for new items
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
        }
      } catch (err) {
        console.error('Failed to fetch due reminders', err);
      }
    };

    fetchDue();
    const interval = setInterval(fetchDue, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const handleCreated = () => {
    // refresh products list and show it
    setRefreshKey((k) => k + 1);
    setAdding(false);
  };

  return (
    <div style={{ maxWidth: "900px", margin: "20px auto", fontFamily: "Arial" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Dashboard</h2>
        <div>
          <button onClick={() => setAdding((a) => !a)} style={{ marginRight: "8px" }}>{adding ? "Close" : "Add Product"}</button>
          <button onClick={() => { localStorage.removeItem('token'); if (onLogout) onLogout(); }}>Logout</button>
        </div>
      </div>

      {message && <p>{message}</p>}

      {user ? (
        <div style={{ border: "1px solid #eee", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
          <h3>User Details</h3>
          <p><strong>Name:</strong> {user.fullName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phone}</p>
          <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>
      ) : (
        <p>Loading user...</p>
      )}

      {adding && <AddProduct onCreated={handleCreated} />}

      {dueReminders.length > 0 && (
        <div style={{ background: '#fff3cd', padding: '12px', border: '1px solid #ffeeba', marginBottom: '16px' }}>
          <h4>Due reminders</h4>
          <ul>
            {dueReminders.map(d => (
              <li key={d._id}>{d.name} — expires {new Date(d.expiryDate).toLocaleDateString()}</li>
            ))}
          </ul>
        </div>
      )}

      <ProductList refreshKey={refreshKey} />
    </div>
  );
};

export default Dashboard;

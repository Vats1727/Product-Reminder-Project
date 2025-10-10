import React, { useEffect, useState } from "react";
import axios from "axios";
import ProductList from "./ProductList.jsx";
import AddProduct from "./AddProduct.jsx";

const Dashboard = ({ onLogout }) => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [adding, setAdding] = useState(false);

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

      <ProductList refreshKey={refreshKey} />
    </div>
  );
};

export default Dashboard;

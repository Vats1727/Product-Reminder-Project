import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductList = ({ refreshKey }) => {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState("");

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

  return (
    <div style={{ maxWidth: "700px", margin: "30px auto", fontFamily: "Arial" }}>
      <h2>Your Products</h2>
      {message && <p>{message}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Name</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Expiry Date</th>
            <th style={{ border: "1px solid #ddd", padding: "8px" }}>Reminder Days</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{p.name}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{new Date(p.expiryDate).toLocaleDateString()}</td>
              <td style={{ border: "1px solid #ddd", padding: "8px" }}>{p.reminderDaysBefore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProductList;

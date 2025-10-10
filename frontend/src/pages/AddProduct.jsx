import React, { useState } from "react";
import axios from "axios";

const AddProduct = ({ onCreated }) => {
  const [form, setForm] = useState({ name: "", description: "", purchaseDate: "", expiryDate: "", reminderDaysBefore: 15 });
  const [message, setMessage] = useState("");

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/products", form, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Product created");
      setTimeout(() => onCreated(), 800);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Error creating product");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "30px auto", fontFamily: "Arial" }}>
      <h3>Add Product</h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
        <input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <label>Purchase Date</label>
        <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} required />
        <label>Expiry Date</label>
        <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} required />
        <label>Reminder Days Before</label>
        <input name="reminderDaysBefore" type="number" value={form.reminderDaysBefore} onChange={handleChange} />
        <button type="submit" style={{ marginTop: "12px", padding: "8px", background: "#5f9341", color: "white", border: "none" }}>Create</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default AddProduct;

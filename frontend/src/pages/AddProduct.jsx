import React, { useState } from "react";
import axios from "axios";

const AddProduct = ({ onCreated }) => {
  const [form, setForm] = useState({ name: "", description: "", price: "", purchaseDate: "", expiryDate: "", reminderDaysBefore: 15 });
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
    <div className="panel" style={{maxWidth:540,margin:'0 auto'}}>
      <h3>Add Product</h3>
      <form onSubmit={handleSubmit} className="form">
  <label>Product name</label>
  <input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} required />
  <label>Price</label>
  <input name="price" type="number" placeholder="Price (e.g. 199.99)" value={form.price} onChange={handleChange} required />
        <label>Description</label>
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <label>Purchase Date</label>
        <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} required />
        <label>Expiry Date</label>
        <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} required />
        <label>Reminder Days Before</label>
        <input name="reminderDaysBefore" type="number" value={form.reminderDaysBefore} onChange={handleChange} />
        <div style={{marginTop:8}}>
          <button type="submit" className="btn">Create</button>
        </div>
      </form>
      {message && <p className="muted">{message}</p>}
    </div>
  );
};

export default AddProduct;

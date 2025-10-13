import React, { useState } from "react";
import axios from "axios";

const AddProduct = ({ onCreated }) => {
  const [form, setForm] = useState({ name: "", description: "", price: "", purchaseDate: "", expiryDate: "", reminderDaysBefore: 15 });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const val = e.target.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  const validate = () => {
    const errors = [];
    if (!form.name || String(form.name).trim().length < 2) errors.push('Name is required (min 2 characters)');
    if (form.price === '' || form.price === null || Number.isNaN(Number(form.price))) errors.push('Price is required');
    else if (Number(form.price) <= 0) errors.push('Price must be greater than 0');
    if (!form.purchaseDate) errors.push('Purchase date is required');
    if (!form.expiryDate) errors.push('Expiry date is required');
    if (form.purchaseDate && form.expiryDate) {
      const pd = new Date(form.purchaseDate);
      const ed = new Date(form.expiryDate);
      if (ed <= pd) errors.push('Expiry date must be after purchase date');
    }
    const reminder = Number(form.reminderDaysBefore || 0);
    if (Number.isNaN(reminder) || reminder < 0) errors.push('Reminder days must be 0 or a positive number');
    if (form.expiryDate && !Number.isNaN(reminder)) {
      const pd = new Date(form.purchaseDate || Date.now());
      const ed = new Date(form.expiryDate);
      const daysBetween = Math.ceil((ed - pd) / (24*60*60*1000));
      if (reminder >= daysBetween) errors.push('Reminder days must be less than total days until expiry');
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (errors.length > 0) {
      // Use alert for validation messages so they are obvious
      window.alert(errors.join('\n'));
      return;
    }
    try {
      setSubmitting(true);
      const token = localStorage.getItem("token");
      const payload = {
        name: String(form.name).trim(),
        description: form.description || '',
        price: Number(form.price),
        purchaseDate: form.purchaseDate,
        expiryDate: form.expiryDate,
        reminderDaysBefore: Number(form.reminderDaysBefore || 0)
      };
      await axios.post("http://localhost:5000/api/products", payload, { headers: { Authorization: `Bearer ${token}` } });
      // Inform user via alert so it's obvious
      window.alert('Product created');
      setTimeout(() => onCreated && onCreated(), 600);
    } catch (err) {
      console.error(err);
      window.alert(err.response?.data?.message || "Error creating product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{maxWidth:540,margin:'0 auto'}}>
      <h3>Add Product</h3>
      <form onSubmit={handleSubmit} className="form" noValidate>
        <label>Product name</label>
        <input name="name" placeholder="Product Name" value={form.name} onChange={handleChange} />

        <label>Price</label>
        <input name="price" type="number" placeholder="Price (e.g. 199.99)" value={form.price} onChange={handleChange} />

        <label>Description</label>
        <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} />

        <label>Purchase Date</label>
        <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} />

        <label>Expiry Date</label>
        <input name="expiryDate" type="date" value={form.expiryDate} onChange={handleChange} />

        <label>Reminder Days Before</label>
        <input name="reminderDaysBefore" type="number" value={form.reminderDaysBefore} onChange={handleChange} />

        <div style={{marginTop:8}}>
          <button type="submit" className="btn" disabled={submitting}>{submitting ? 'Creating...' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;

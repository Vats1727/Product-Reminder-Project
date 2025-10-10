import React, { useState } from "react";
import axios from "axios";

function Signup({ onSignupSuccess }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const errs = {};
    if (!/^[a-zA-Z ]{3,}$/.test(formData.fullName))
      errs.fullName = "Full Name must be at least 3 letters and only letters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = "Invalid email format";
    if (!/^\d{10}$/.test(formData.phone))
      errs.phone = "Phone must be 10 digits";
    if (!/^(?=.*\d).{6,}$/.test(formData.password))
      errs.password = "Password must be at least 6 chars and contain a number";
    if (formData.password !== formData.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/users/signup", formData);
      setMessage(res.data.message);
      setTimeout(() => onSignupSuccess(), 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error occurred");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          style={styles.input}
          required
        />
        {errors.fullName && <small style={styles.error}>{errors.fullName}</small>}

        <input
          name="email"
          type="email"
          placeholder="Mail ID"
          value={formData.email}
          onChange={handleChange}
          style={styles.input}
          required
        />
        {errors.email && <small style={styles.error}>{errors.email}</small>}

        <input
          name="phone"
          type="text"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          style={styles.input}
          required
        />
        {errors.phone && <small style={styles.error}>{errors.phone}</small>}

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          style={styles.input}
          required
        />
        {errors.password && <small style={styles.error}>{errors.password}</small>}

        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          style={styles.input}
          required
        />
        {errors.confirmPassword && <small style={styles.error}>{errors.confirmPassword}</small>}

        <button type="submit" style={styles.button}>Register</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

const styles = {
  container: { width: "300px", margin: "100px auto", textAlign: "center", fontFamily: "Arial" },
  form: { display: "flex", flexDirection: "column" },
  input: { margin: "8px 0", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" },
  button: { padding: "10px", borderRadius: "5px", border: "none", background: "#5f9341", color: "white" },
  error: { color: "red", fontSize: "12px", marginBottom: "5px" }
};

export default Signup;

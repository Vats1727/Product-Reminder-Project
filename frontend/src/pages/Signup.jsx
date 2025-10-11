import React, { useState } from "react";
import axios from "axios";

function Signup({ onSignupSuccess, goToLogin }) {
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
    <div style={{display:'flex',justifyContent:'center',padding:24}}>
      <div className="card" style={{maxWidth:920,width:'100%'}}>
        <div className="auth-grid">
          <div className="auth-panel" style={{padding:28}}>
            <div className="brand"><h1>Product Reminder</h1></div>
            <p className="muted">Create your account to receive product expiry reminders by email.</p>
          </div>
          <div className="auth-panel">
            <h2>Sign up</h2>
            <form onSubmit={handleSubmit} className="form">
              <label>Full name</label>
              <input name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="input-full" required />
              {errors.fullName && <small className="muted" style={{color:'var(--danger)'}}>{errors.fullName}</small>}

              <label>Email</label>
              <input name="email" type="email" placeholder="Mail ID" value={formData.email} onChange={handleChange} className="input-full" required />
              {errors.email && <small className="muted" style={{color:'var(--danger)'}}>{errors.email}</small>}

              <label>Phone</label>
              <input name="phone" type="text" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="input-full" required />
              {errors.phone && <small className="muted" style={{color:'var(--danger)'}}>{errors.phone}</small>}

              <label>Password</label>
              <input name="password" type="password" placeholder="Password" value={formData.password} onChange={handleChange} className="input-full" required />
              {errors.password && <small className="muted" style={{color:'var(--danger)'}}>{errors.password}</small>}

              <label>Confirm</label>
              <input name="confirmPassword" type="password" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="input-full" required />
              {errors.confirmPassword && <small className="muted" style={{color:'var(--danger)'}}>{errors.confirmPassword}</small>}

                <div style={{marginTop:12,display:'flex',justifyContent:'flex-start',gap:8,alignItems:'center'}}>
                  <button type="submit" className="btn">Create account</button>
                </div>
            </form>
            {message && <p className="muted" style={{marginTop:8}}>{message}</p>}
            <div style={{marginTop:10}}>
              {typeof goToLogin === 'function' ? (
                <button className="btn ghost" onClick={() => goToLogin()}>Go to Login</button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
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

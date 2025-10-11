import React, { useState } from "react";
import axios from "axios";

const Login = ({ onLoginSuccess, goToSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/users/login", {
        email,
        password,
      });
      setMessage(res.data.message);

      // store token if needed
      localStorage.setItem("token", res.data.token);
      console.log("User Info:", res.data.user);
      // notify parent
      if (typeof onLoginSuccess === "function") onLoginSuccess();

    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div style={{display:'flex',justifyContent:'center',padding:24}}>
      <div className="card" style={{maxWidth:920,width:'100%'}}>
        <div className="auth-grid">
          <div className="auth-panel" style={{padding:28}}>
            <div className="brand"><h1>Product Reminder</h1></div>
            <p className="muted">Sign in to manage your products and reminders.</p>
          </div>
          <div className="auth-panel">
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className="form">
              <label>Email</label>
              <input className="input-full" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <label>Password</label>
              <input className="input-full" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <div style={{marginTop:12,display:'flex',gap:8}}>
                  <button type="submit" className="btn">Login</button>
                  {typeof goToSignup === 'function' ? (
                    <button type="button" className="btn ghost" onClick={() => goToSignup()}>Go to Signup</button>
                  ) : null}
                </div>
            </form>
            {message && <p className="muted" style={{marginTop:8}}>{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from "react";
import axios from "axios";

function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/users/login", formData);
      setMessage(res.data.message);
      localStorage.setItem("authToken", res.data.token);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error occurred");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          name="email"
          type="email"
          placeholder="Email"
          onChange={handleChange}
          style={styles.input}
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          onChange={handleChange}
          style={styles.input}
          required
        />
        <button type="submit" style={styles.button}>Login</button>
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
};

export default Login;

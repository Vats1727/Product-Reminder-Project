import React, { useState } from "react";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import ProductList from "./pages/ProductList.jsx";
import AddProduct from "./pages/AddProduct.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function App() {
  // if token exists, show products
  const token = localStorage.getItem("token");
  const [page, setPage] = useState(token ? "dashboard" : "signup");

  return (
    <div>
      {page === "signup" ? (
        <Signup onSignupSuccess={() => setPage("login")} goToLogin={() => setPage('login')} />
      ) : page === "login" ? (
        <Login onLoginSuccess={() => setPage("dashboard")} goToSignup={() => setPage('signup')} />
      ) : page === "dashboard" ? (
        <Dashboard onLogout={() => setPage("login")} />
      ) : null}
    </div>
  );
}

const styles = {
  navBtn: {
    padding: "8px 15px",
    margin: "5px",
    background: "#5f9341",
    color: "white",
    border: "none",
    borderRadius: "5px",
  },
};

export default App;

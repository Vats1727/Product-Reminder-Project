import React, { useState } from "react";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";

function App() {
  const [page, setPage] = useState("signup");

  return (
    <div>
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        {page === "login" && (
          <button onClick={() => setPage("signup")} style={styles.navBtn}>
            Go to Signup
          </button>
        )}
        {page === "signup" && (
          <button onClick={() => setPage("login")} style={styles.navBtn}>
            Go to Login
          </button>
        )}
      </div>

      {page === "signup" ? (
        <Signup onSignupSuccess={() => setPage("login")} />
      ) : (
        <Login />
      )}
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

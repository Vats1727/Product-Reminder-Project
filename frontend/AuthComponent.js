// frontend/AuthComponent.js
import React, { useState } from 'react';

function AuthComponent() {
  const [user, setUser] = useState({ email: '', password: '' });

  const handleLogin = () => {
    alert(`Logging in with ${user.email}`);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>User Authentication</h2>
      <input
        type="email"
        placeholder="Email"
        value={user.email}
        onChange={(e) => setUser({ ...user, email: e.target.value })}
        style={{ margin: '5px', padding: '8px' }}
      />
      <br />
      <input
        type="password"
        placeholder="Password"
        value={user.password}
        onChange={(e) => setUser({ ...user, password: e.target.value })}
        style={{ margin: '5px', padding: '8px' }}
      />
      <br />
      <button onClick={handleLogin} style={{ padding: '10px 20px' }}>
        Login
      </button>
    </div>
  );
}





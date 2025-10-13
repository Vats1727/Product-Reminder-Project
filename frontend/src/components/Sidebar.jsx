import React from 'react'


export default function Sidebar({ onNavigate }) {
return (
<aside className="sidebar">


<nav className="nav">
<button className="nav-btn" onClick={() => onNavigate('customers')}>Add Customer</button>
<button className="nav-btn" onClick={() => onNavigate('products')}>Add Product</button>
</nav>


<div className="version">v1.0.0</div>
</aside>
)
}
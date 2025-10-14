import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './sidebar.css'

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation()
  const isActive = path => location.pathname === path

  const toggleCollapse = () => setCollapsed && setCollapsed(!collapsed)

  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>
      <nav className="nav-list">
        <Link to="/add-customer" className={`nav-item ${isActive('/add-customer') ? 'active' : ''}`}>
          <span className="nav-icon">👥</span>
          <span>Customer</span>
        </Link>
        <Link to="/add-product" className={`nav-item ${isActive('/add-product') ? 'active' : ''}`}>
          <span className="nav-icon">📦</span>
          <span>Product</span>
        </Link>
        <Link to="/map-products" className={`nav-item ${isActive('/map-products') ? 'active' : ''}`}>
          <span className="nav-icon">🔗</span>
          <span>Map Products</span>
        </Link>
      </nav>
      <button className="collapse-button" onClick={toggleCollapse}>
        ➡️
      </button>
    </aside>
  )
}
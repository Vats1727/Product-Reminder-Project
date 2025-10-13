import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './sidebar.css'

export default function Sidebar() {
  const location = useLocation()
  const isActive = path => location.pathname === path

  return (
    <aside className="app-sidebar">
      <nav className="nav-list">
        <Link to="/add-customer" className={`nav-item ${isActive('/add-customer') ? 'active' : ''}`}>
          <span className="nav-icon"></span>
          Add Customer
        </Link>
        <Link to="/add-product" className={`nav-item ${isActive('/add-product') ? 'active' : ''}`}>
          <span className="nav-icon"></span>
          Add Product
        </Link>
      </nav>
    </aside>
  )
}
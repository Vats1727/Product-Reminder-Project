import React, { useState } from 'react'
import Sidebar from './Sidebar'

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className={`admin-root${collapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}

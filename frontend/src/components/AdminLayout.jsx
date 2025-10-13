import React from 'react'
import Sidebar from './Sidebar'

export default function AdminLayout({ children }) {
  return (
    <div className="admin-root">
      <Sidebar />
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}

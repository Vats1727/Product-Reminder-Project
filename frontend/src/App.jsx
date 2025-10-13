import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

import Sidebar from './components/Sidebar'
import AddCustomer from './components/AddCustomer'
import AddProduct from './components/AddProduct'

export default function App() {
  return (
    <BrowserRouter>
      <div className="admin-root">
        <Sidebar />
        <main className="admin-main">
          <Routes>
            <Route path="/add-customer" element={<AddCustomer />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/" element={<Navigate to="/add-customer" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="light"
      />
    </BrowserRouter>
  )
}

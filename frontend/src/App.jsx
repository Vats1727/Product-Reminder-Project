import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

import AdminLayout from './components/AdminLayout'
import AddCustomer from './components/AddCustomer'
import AddProduct from './components/AddProduct'

export default function App() {
  return (
    <BrowserRouter>
      <AdminLayout>
        <Routes>
          <Route path="/add-customer" element={<AddCustomer />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/" element={<Navigate to="/add-customer" replace />} />
        </Routes>
      </AdminLayout>
      <ToastContainer position="top-right" />
    </BrowserRouter>
  )
}

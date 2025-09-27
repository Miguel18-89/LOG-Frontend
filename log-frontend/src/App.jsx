import './App.css'
import Login from "./components/Login"
import SignUp from "./components/SignUp"
import Home from "./components/Home"
import { useState } from 'react';
import { useEffect } from 'react';
import { Routes, Route } from "react-router-dom"
import PrivateRoute from './components/PrivateRoute';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import EditUser from './components/EditUser';


function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/Home" element={<PrivateRoute><Home /></PrivateRoute>} />
        <Route path="/ForgotPassword" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/EditUser" element={<EditUser />} />

      </Routes>
    </>
  )
}

export default App
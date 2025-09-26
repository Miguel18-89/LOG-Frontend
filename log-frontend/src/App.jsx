import './App.css'
import Login from "./components/Login"
import SignUp from "./components/SignUp"
import { useState } from 'react';
import { useEffect } from 'react';
import { Routes, Route } from "react-router-dom"

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/components/SignUp" element={<SignUp />} />
      </Routes>
    </>
  )
}

export default App
//import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';

function App() {
  return (
    <BrowserRouter >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage/>} />
        <Route path="/register" element={<AuthPage/>} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
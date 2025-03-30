//import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CardPage from './pages/CardPage';
import Landing from './pages/Landing';

function App() {
  return (
    <BrowserRouter >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cards" element={<CardPage />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
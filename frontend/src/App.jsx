import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Main from './pages/Main/Main';
import Products from './pages/Products/Products';
import Job from './pages/Job/Job';
import Basket from './pages/Basket/Basket';
import Login from './pages/Login/Login';
import Registration from './pages/Registration/Registration';
import Profile from './pages/Profile/Profile';
import AdminProducts from './pages/Admin/AdminProducts';
import AdminJobs from './pages/Admin/AdminJobs';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Main />} />
              <Route path="/products" element={<Products />} />
              <Route path="/jobs" element={<Job />} />
              <Route path="/basket" element={<Basket />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registration" element={<Registration />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/jobs" element={<AdminJobs />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

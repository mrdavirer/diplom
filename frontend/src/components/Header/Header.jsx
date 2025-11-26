import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import BasketPopup from '../Basket/BasketPopup';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const [isBasketOpen, setIsBasketOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          StroyStore
        </Link>
        
        <nav className="nav">
          <Link to="/products" className="nav-link">Продукты</Link>
          <Link to="/jobs" className="nav-link">Вакансии</Link>
        </nav>

        <div className="header-actions">
          <button 
            className="basket-btn"
            onClick={() => setIsBasketOpen(true)}
          >
            Корзина
          </button>
          
          {user ? (
            <div className="user-menu">
              <Link to="/profile" className="nav-link">
                Профиль
              </Link>
              {user.role === 'admin' && (
                <>
                  <Link to="/admin/products" className="nav-link">Админ-Продукты</Link>
                  <Link to="/admin/jobs" className="nav-link">Админ-Вакансии</Link>
                </>
              )}
              <button onClick={handleLogout} className="logout-btn">
                Выйти
              </button>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="nav-link">Войти</Link>
              <Link to="/registration" className="btn btn-primary">Регистрация</Link>
            </div>
          )}
        </div>
      </div>

      {isBasketOpen && (
        <BasketPopup onClose={() => setIsBasketOpen(false)} />
      )}
    </header>
  );
};

export default Header;

import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [basket, setBasket] = useState([]);
  const [loading, setLoading] = useState(true);

  // Базовый URL для API
  const API_URL = 'http://localhost:3001/api';

  useEffect(() => {
    checkAuth();
    loadBasket();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // В реальном приложении здесь бы был запрос для проверки токена
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const loadBasket = () => {
    const savedBasket = localStorage.getItem('basket');
    if (savedBasket) {
      try {
        setBasket(JSON.parse(savedBasket));
      } catch (error) {
        console.error('Error loading basket:', error);
        localStorage.removeItem('basket');
      }
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password
      });

      const { token, user: userData } = response.data;
      
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка при входе';
      return { success: false, error: message };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/register`, {
        username,
        email,
        password
      });

      const { token, user: userData } = response.data;
      
      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка при регистрации';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    setBasket([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('basket');
  };

  const addToBasket = (product) => {
    const existingItem = basket.find(item => item.id === product.id);
    let newBasket;
    
    if (existingItem) {
      newBasket = basket.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      newBasket = [...basket, { ...product, quantity: 1 }];
    }
    
    setBasket(newBasket);
    localStorage.setItem('basket', JSON.stringify(newBasket));
  };

  const removeFromBasket = (productId) => {
    const newBasket = basket.filter(item => item.id !== productId);
    setBasket(newBasket);
    localStorage.setItem('basket', JSON.stringify(newBasket));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromBasket(productId);
      return;
    }
    
    const newBasket = basket.map(item =>
      item.id === productId ? { ...item, quantity } : item
    );
    
    setBasket(newBasket);
    localStorage.setItem('basket', JSON.stringify(newBasket));
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const value = {
    user,
    basket,
    loading,
    login,
    register,
    logout,
    addToBasket,
    removeFromBasket,
    updateQuantity,
    getAuthHeader,
    API_URL
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

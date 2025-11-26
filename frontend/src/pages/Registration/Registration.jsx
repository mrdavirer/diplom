import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Registration.css';

const Registration = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      setLoading(false);
      return;
    }

    if (formData.username.length < 3) {
      setError('Логин должен содержать минимум 3 символа');
      setLoading(false);
      return;
    }

    try {
      const result = await register(formData.username, formData.email, formData.password);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-card">
          <h1>Регистрация</h1>
          
          <form onSubmit={handleSubmit} className="registration-form">
            <div className="form-group">
              <label className="form-label">Логин (минимум 3 символа)</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                required
                minLength="3"
                placeholder="Придумайте логин"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Введите ваш email"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Пароль (минимум 6 символов)</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Придумайте пароль"
                minLength="6"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Подтверждение пароля</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Повторите пароль"
                minLength="6"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit" 
              className="btn btn-primary registration-btn"
              disabled={loading}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
          
          <div className="registration-footer">
            <p>Уже есть аккаунт? <Link to="/login" className="link">Войти</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;

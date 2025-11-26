import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
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

    try {
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Ошибка при входе в систему');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h1>Вход в аккаунт</h1>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Логин</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Введите ваш логин"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Пароль</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="form-input"
                required
                placeholder="Введите ваш пароль"
              />
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <button 
              type="submit" 
              className="btn btn-primary login-btn"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
          
          <div className="login-footer">
            <p>Нет аккаунта? <Link to="/registration" className="link">Зарегистрироваться</Link></p>
          </div>

          <div className="test-accounts">
            <h3>Тестовые аккаунты:</h3>
            <p><strong>Админ:</strong> admin / password</p>
            <p><strong>Пользователь:</strong> user1 / password</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

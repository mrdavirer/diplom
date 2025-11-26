import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleLogout = () => {
    logout();
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    alert('Пароль успешно изменен!');
    setShowChangePassword(false);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  if (!user) {
    return (
      <div className="profile-page">
        <div className="container">
          <h1>Профиль</h1>
          <p>Пожалуйста, войдите в систему</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        <h1>Профиль пользователя</h1>
        
        <div className="profile-content">
          <div className="profile-card">
            <div className="profile-header">
              <div className="avatar">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <h2>{user.username}</h2>
                <p className="user-email">{user.email}</p>
                <p className="user-role">
                  {user.role === 'admin' ? 'Администратор' : 'Пользователь'}
                </p>
              </div>
            </div>
            
            <div className="profile-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowChangePassword(true)}
              >
                Сменить пароль
              </button>
              
              <button 
                className="btn btn-primary logout-btn"
                onClick={handleLogout}
              >
                Выйти из аккаунта
              </button>
            </div>
          </div>
          
          {user.role === 'user' && (
            <div className="user-stats">
              <h3>Моя активность</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">0</div>
                  <div className="stat-label">Созданные вакансии</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">0</div>
                  <div className="stat-label">Отклики на вакансии</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">0</div>
                  <div className="stat-label">Заказы</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {showChangePassword && (
          <div className="modal-overlay" onClick={() => setShowChangePassword(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Смена пароля</h2>
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label className="form-label">Текущий пароль</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Новый пароль</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    required
                    minLength="6"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Подтверждение пароля</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    className="form-input"
                    required
                    minLength="6"
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowChangePassword(false)}
                  >
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Сменить пароль
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

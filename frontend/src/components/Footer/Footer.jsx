import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>StroyStore</h3>
          <p>Ваш надежный партнер в строительстве</p>
        </div>
        
        <div className="footer-section">
          <h4>Контакты</h4>
          <p>Email: info@stroystore.ru</p>
          <p>Телефон: +7 (999) 999-99-99</p>
        </div>
        
        <div className="footer-section">
          <h4>Адрес</h4>
          <p>г. Москва, ул. Строителей, д. 1</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2024 StroyStore. Все права защищены.</p>
      </div>
    </footer>
  );
};

export default Footer;

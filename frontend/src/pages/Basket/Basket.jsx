import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Basket.css';

const Basket = () => {
  const { basket, removeFromBasket, updateQuantity, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const total = basket.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (basket.length === 0) {
      alert('Корзина пуста');
      return;
    }
    
    if (!user) {
      alert('Пожалуйста, войдите в систему для оформления заказа');
      navigate('/login');
      return;
    }
    
    alert('Заказ оформлен! В реальном приложении здесь будет переход к оплате.');
  };

  const handleIncrease = (productId, currentQuantity) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const handleDecrease = (productId, currentQuantity) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  if (basket.length === 0) {
    return (
      <div className="basket-page">
        <div className="container">
          <div className="basket-header">
            <h1>Корзина</h1>
          </div>
          <div className="empty-basket">
            <div className="empty-icon"></div>
            <h2>Ваша корзина пуста</h2>
            <p>Добавьте товары из каталога, чтобы сделать заказ</p>
            <Link to="/products" className="btn btn-primary">
              Перейти к покупкам
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="basket-page">
      <div className="container">
        <div className="basket-header">
          <h1>Корзина</h1>
          <div className="basket-stats">
            <span className="items-count">{totalItems} товар(ов)</span>
          </div>
        </div>

        <div className="basket-layout">
          <div className="basket-items-section">
            <div className="section-header">
              <h2>Товары в корзине</h2>
            </div>
            
            <div className="basket-items">
              {basket.map(item => (
                <div key={item.id} className="basket-item">
                  <div className="item-image">
                    <img src={item.image || '/placeholder-product.jpg'} alt={item.name} />
                  </div>
                  
                  <div className="item-details">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>
                    <div className="item-meta">
                      <span className="item-category">{item.category}</span>
                    </div>
                  </div>
                  
                  <div className="item-controls">
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={() => handleDecrease(item.id, item.quantity)}
                        disabled={item.quantity <= 1}
                      >
                        −
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => handleIncrease(item.id, item.quantity)}
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="price-section">
                      <div className="item-price">{item.price} ₽</div>
                      <div className="item-total">{item.price * item.quantity} ₽</div>
                    </div>
                    
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromBasket(item.id)}
                      title="Удалить из корзины"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="basket-summary-section">
            <div className="summary-card">
              <h3>Ваш заказ</h3>
              
              <div className="summary-details">
                <div className="summary-row">
                  <span>Товары ({totalItems} шт.)</span>
                  <span>{total} ₽</span>
                </div>
                
                <div className="summary-row">
                  <span>Доставка</span>
                  <span className="free">Бесплатно</span>
                </div>
                
                <div className="summary-divider"></div>
                
                <div className="summary-row total">
                  <span>Итого</span>
                  <span className="total-price">{total} ₽</span>
                </div>
              </div>
              
              <button 
                className="btn btn-primary checkout-btn"
                onClick={handleCheckout}
              >
                Оформить заказ
              </button>
              
              <div className="delivery-info">
                <h4>Бесплатная доставка</h4>
                <p>Доставим ваш заказ в течение 2-3 дней</p>
              </div>
              
              <Link to="/products" className="continue-shopping">
                ← Продолжить покупки
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Basket;

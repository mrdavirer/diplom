import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './BasketPopup.css';

const BasketPopup = ({ onClose }) => {
  const { basket, removeFromBasket, updateQuantity } = useContext(AuthContext);
  const navigate = useNavigate();

  const total = basket.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = basket.reduce((sum, item) => sum + item.quantity, 0);

  const handleGoToBasket = () => {
    onClose();
    navigate('/basket');
  };

  const handleIncrease = (productId, currentQuantity) => {
    updateQuantity(productId, currentQuantity + 1);
  };

  const handleDecrease = (productId, currentQuantity) => {
    if (currentQuantity > 1) {
      updateQuantity(productId, currentQuantity - 1);
    }
  };

  return (
    <div className="basket-popup-overlay" onClick={onClose}>
      <div className="basket-popup" onClick={e => e.stopPropagation()}>
        <div className="basket-popup-header">
          <h3>Корзина ({totalItems})</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="basket-popup-content">
          {basket.length === 0 ? (
            <div className="empty-basket-popup">
              <div className="empty-icon">���</div>
              <p>Корзина пуста</p>
            </div>
          ) : (
            <>
              <div className="basket-popup-items">
                {basket.map(item => (
                  <div key={item.id} className="basket-popup-item">
                    <img src={item.image || '/placeholder-product.jpg'} alt={item.name} />
                    <div className="item-info-popup">
                      <h4>{item.name}</h4>
                      <div className="item-controls-popup">
                        <div className="quantity-controls-popup">
                          <button 
                            onClick={() => handleDecrease(item.id, item.quantity)}
                            disabled={item.quantity <= 1}
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => handleIncrease(item.id, item.quantity)}>
                            +
                          </button>
                        </div>
                        <div className="price-popup">{item.price * item.quantity} ₽</div>
                      </div>
                    </div>
                    <button 
                      className="remove-btn-popup"
                      onClick={() => removeFromBasket(item.id)}
                    >
                      ���️
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="basket-popup-footer">
                <div className="popup-total">
                  <span>Итого:</span>
                  <span className="popup-total-price">{total} ₽</span>
                </div>
                <button className="btn btn-primary popup-checkout-btn" onClick={handleGoToBasket}>
                  Перейти к оформлению
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BasketPopup;

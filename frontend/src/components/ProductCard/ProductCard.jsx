import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { user, addToBasket } = useContext(AuthContext);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToBasket = () => {
    if (user) {
      addToBasket(product);
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } else {
      alert('Пожалуйста, войдите в систему чтобы добавить товар в корзину');
    }
  };

  return (
    <div className="product-card card">
      <img 
        src={product.image || '/placeholder-product.jpg'} 
        alt={product.name}
        className="product-image"
      />
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>
        <div className="product-price">{product.price} ₽</div>
        <button 
          className={`btn btn-primary ${isAdded ? 'added' : ''}`}
          onClick={handleAddToBasket}
          disabled={isAdded}
        >
          {isAdded ? 'Добавлено!' : 'В корзину'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;

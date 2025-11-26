import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

const AdminProducts = () => {
  const { user, getAuthHeader, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: ''
  });

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchProducts();
  }, [user, navigate]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
      setSelectedProducts(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      alert('Ошибка при загрузке товаров');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(
        `${API_URL}/products`,
        { ...productForm, price: parseFloat(productForm.price) },
        { headers: getAuthHeader() }
      );
      
      alert('Продукт успешно добавлен!');
      fetchProducts();
      resetForm();
    } catch (error) {
      alert('Ошибка: ' + (error.response?.data?.message || 'Неизвестная ошибка'));
    }
  };

  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set());
    } else {
      const allIds = new Set(products.map(product => product.id));
      setSelectedProducts(allIds);
    }
    setSelectAll(!selectAll);
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      alert('Выберите товары для удаления');
      return;
    }

    if (!window.confirm(`Вы уверены, что хотите удалить ${selectedProducts.size} товаров?`)) {
      return;
    }

    try {
      for (const productId of selectedProducts) {
        await axios.delete(`${API_URL}/products/${productId}`, {
          headers: getAuthHeader()
        });
      }
      
      alert(`Успешно удалено ${selectedProducts.size} товаров!`);
      fetchProducts();
    } catch (error) {
      alert('Ошибка при удалении: ' + (error.response?.data?.message || 'Неизвестная ошибка'));
    }
  };

  const handleSingleDelete = async (productId, productName) => {
    if (window.confirm(`Вы уверены, что хотите удалить товар "${productName}"?`)) {
      try {
        await axios.delete(`${API_URL}/products/${productId}`, {
          headers: getAuthHeader()
        });
        alert('Товар успешно удален!');
        fetchProducts();
      } catch (error) {
        alert('Ошибка при удалении: ' + (error.response?.data?.message || 'Неизвестная ошибка'));
      }
    }
  };

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      image: ''
    });
    setShowProductForm(false);
  };

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <div>
            <h1>Управление товарами</h1>
            <p className="admin-subtitle">Всего товаров: {products.length}</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowProductForm(true)}
          >
            Добавить товар
          </button>
        </div>

        {products.length > 0 && (
          <div className="bulk-actions-panel">
            <div className="bulk-info">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                Выбрать все
              </label>
              <span className="selected-count">
                Выбрано: {selectedProducts.size}
              </span>
            </div>
            
            {selectedProducts.size > 0 && (
              <div className="bulk-buttons">
                <button 
                  className="btn btn-danger bulk-delete-btn"
                  onClick={handleBulkDelete}
                >
                  Удалить выбранные ({selectedProducts.size})
                </button>
              </div>
            )}
          </div>
        )}

        <div className="admin-content">
          <div className="products-list">
            {loading ? (
              <div className="loading">Загрузка товаров...</div>
            ) : products.length === 0 ? (
              <div className="no-items">
                <p>Товары не найдены</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowProductForm(true)}
                >
                  Добавить первый товар
                </button>
              </div>
            ) : (
              <div className="admin-products-grid">
                {products.map(product => (
                  <div key={product.id} className="admin-product-card">
                    <div className="product-select">
                      <input
                        type="checkbox"
                        checked={selectedProducts.has(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="product-checkbox"
                      />
                    </div>
                    
                    <img src={product.image || '/placeholder-product.jpg'} alt={product.name} className="product-image" />
                    
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="product-description">{product.description}</p>
                      <p className="product-price">{product.price} ₽</p>
                      <p className="product-category">{product.category}</p>
                    </div>
                    
                    <div className="product-actions">
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleSingleDelete(product.id, product.name)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Модальное окно добавления товара */}
        {showProductForm && (
          <div className="modal-overlay" onClick={resetForm}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Добавление товара</h2>
              <form onSubmit={handleSubmitProduct}>
                <div className="form-group">
                  <label className="form-label">Название товара</label>
                  <input
                    type="text"
                    name="name"
                    value={productForm.name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Введите название товара"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Описание</label>
                  <textarea
                    name="description"
                    value={productForm.description}
                    onChange={handleInputChange}
                    className="form-input"
                    rows="3"
                    required
                    placeholder="Введите описание товара"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Цена</label>
                  <input
                    type="number"
                    name="price"
                    value={productForm.price}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    min="0"
                    step="0.01"
                    placeholder="Введите цену"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Категория</label>
                  <select
                    name="category"
                    value={productForm.category}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Выберите категорию</option>
                    <option value="Электроинструменты">Электроинструменты</option>
                    <option value="Измерительные инструменты">Измерительные инструменты</option>
                    <option value="Сверла и оснастка">Сверла и оснастка</option>
                    <option value="Ручные инструменты">Ручные инструменты</option>
                    <option value="Абразивные материалы">Абразивные материалы</option>
                    <option value="Инструменты для плитки">Инструменты для плитки</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">URL изображения</label>
                  <input
                    type="url"
                    name="image"
                    value={productForm.image}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Добавить товар
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

export default AdminProducts;

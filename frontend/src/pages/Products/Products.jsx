import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ProductCard from '../../components/ProductCard/ProductCard';
import axios from 'axios';
import './Products.css';

const Products = () => {
  const { user, getAuthHeader, API_URL } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = ['Все', 'Электроинструменты', 'Строительное оборудование', 'СИЗ', 'Ручные инструменты'];

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory && selectedCategory !== 'Все') params.category = selectedCategory;

      const response = await axios.get(`${API_URL}/products`, { params });
      setProducts(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Ошибка при загрузке товаров');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'Все' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="products-page">
      <div className="container">
        <h1>Все товары</h1>
        
        <div className="filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Поиск по названию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="category-filter">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              {categories.map(category => (
                <option key={category} value={category === 'Все' ? '' : category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading">Загрузка товаров...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="products-grid">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="no-products">
                <p>Товары не найдены</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;

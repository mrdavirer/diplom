import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Main.css';

const Main = () => {
  const [popularProducts, setPopularProducts] = useState([]);
  const [popularJobs, setPopularJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapLoading, setMapLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState({
    address: '',
    phone: '',
    email: '',
    workingHours: ''
  });

  useEffect(() => {
    fetchMainData();
    fetchShopInfo();
  }, []);

  const fetchMainData = async () => {
    try {
      const productsResponse = await axios.get('http://localhost:3001/api/products?limit=5');
      setPopularProducts(productsResponse.data.slice(0, 5));

      const jobsResponse = await axios.get('http://localhost:3001/api/jobs?limit=5');
      setPopularJobs(jobsResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching main page data:', error);
      setPopularProducts([]);
      setPopularJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchShopInfo = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/shop/location');
      if (response.data.success) {
        setShopInfo(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching shop info:', error);
      setShopInfo({
        address: 'г. Москва, ул. Строителей, д. 1',
        phone: '+7 (999) 999-99-99',
        email: 'info@stroystore.ru',
        workingHours: 'Ежедневно с 9:00 до 21:00'
      });
    } finally {
      setMapLoading(false);
    }
  };

  const handleOpenIn2GIS = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/shop/map-links');
      if (response.data.success) {
        window.open(response.data.data['2gis'], '_blank');
      }
    } catch (error) {
      console.error('Error getting map links:', error);
      const fallbackUrl = 'https://2gis.ru/moscow/firm/70000001032377759?m=37.48326799993517%2C55.614831077219144%2F16';
      window.open(fallbackUrl, '_blank');
    }
  };

  const handleOpenInYandex = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/shop/map-links');
      if (response.data.success) {
        window.open(response.data.data.yandex, '_blank');
      }
    } catch (error) {
      console.error('Error getting map links:', error);
      const fallbackUrl = 'https://yandex.ru/maps/?pt=37.48326799993517,55.614831077219144&z=16&l=map';
      window.open(fallbackUrl, '_blank');
    }
  };

  return (
    <div className="main-page">
      <section className="banner">
        <div className="banner-content">
          <h1>StroyStore - Все для строительства</h1>
          <p>Инструменты, материалы и специалисты в одном месте</p>
          <div className="banner-actions">
            <Link to="/jobs" className="btn btn-primary">Найти работу</Link>
            <Link to="/products" className="btn btn-secondary">Купить инструменты</Link>
          </div>
        </div>
      </section>

      <section className="popular-section">
        <div className="container">
          <h2>Популярные товары</h2>
          {loading ? (
            <div className="loading">Загрузка товаров...</div>
          ) : (
            <>
              <div className="products-grid">
                {popularProducts.map(product => (
                  <div key={product.id} className="product-item card">
                    <img src={product.image || '/placeholder-product.jpg'} alt={product.name} />
                    <h3>{product.name}</h3>
                    <p className="price">{product.price} ₽</p>
                  </div>
                ))}
              </div>
              <Link to="/products" className="btn btn-primary view-all-btn">
                Все товары
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="jobs-section">
        <div className="container">
          <h2>Популярные вакансии</h2>
          {loading ? (
            <div className="loading">Загрузка вакансий...</div>
          ) : (
            <>
              <div className="jobs-grid">
                {popularJobs.map(job => (
                  <div key={job.id} className="job-item card">
                    <h3>{job.title}</h3>
                    <p className="company">{job.company}</p>
                    <p className="salary">{job.salary}</p>
                  </div>
                ))}
              </div>
              <Link to="/jobs" className="btn btn-primary view-all-btn">
                Все вакансии
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="contacts-section">
        <div className="container">
          <div className="contacts-header">
            <h2>Наш магазин</h2>
            <p>Приходите к нам за качественными строительными материалами</p>
          </div>
          
          <div className="contacts-content">
            <div className="contacts-card">
              <div className="contacts-info">
                <div className="contact-main">
                  <h3>StroyStore</h3>
                  <p className="contact-tagline">Ваш надежный партнер в строительстве</p>
                </div>
                
                <div className="contact-details">
                  <div className="contact-item">
                    <div className="contact-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    <div className="contact-text">
                      <span className="contact-label">Адрес</span>
                      <span className="contact-value">{mapLoading ? 'Загрузка...' : shopInfo.address}</span>
                    </div>
                  </div>
                  
                  <div className="contact-item">
                    <div className="contact-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                    </div>
                    <div className="contact-text">
                      <span className="contact-label">Email</span>
                      <span className="contact-value">{shopInfo.email}</span>
                    </div>
                  </div>
                  
                  <div className="contact-item">
                    <div className="contact-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                      </svg>
                    </div>
                    <div className="contact-text">
                      <span className="contact-label">Телефон</span>
                      <span className="contact-value">{shopInfo.phone}</span>
                    </div>
                  </div>
                  
                  <div className="contact-item">
                    <div className="contact-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                      </svg>
                    </div>
                    <div className="contact-text">
                      <span className="contact-label">Часы работы</span>
                      <span className="contact-value">{shopInfo.workingHours}</span>
                    </div>
                  </div>
                </div>
                
                <div className="contact-actions">
                  <button className="btn btn-primary contact-btn" onClick={handleOpenIn2GIS}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    2GIS
                  </button>
                  <button className="btn btn-secondary contact-btn" onClick={handleOpenInYandex}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Яндекс Карты
                  </button>
                </div>
              </div>
            </div>
            
            <div className="map-card">
              <div className="map-preview">
                {mapLoading ? (
                  <div className="map-loading">
                    <div className="loading-spinner"></div>
                    <p>Загрузка карты...</p>
                  </div>
                ) : (
                  <>
                    <div className="map-overlay">
                      <div className="map-marker">
                        <div className="marker-dot"></div>
                        <div className="marker-pulse"></div>
                      </div>
                      <div className="map-address">
                        <strong>StroyStore</strong>
                        <span>{shopInfo.address}</span>
                      </div>
                    </div>
                    <div className="map-background">
                      <div className="map-grid">
                        <div className="grid-line"></div>
                        <div className="grid-line"></div>
                        <div className="grid-line"></div>
                      </div>
                      <div className="map-roads">
                        <div className="road horizontal"></div>
                        <div className="road vertical"></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div className="map-actions">
                <button className="map-action-btn primary" onClick={handleOpenIn2GIS}>
                  <span className="btn-text">Открыть в 2GIS</span>
                </button>
                <button className="map-action-btn secondary" onClick={handleOpenInYandex}>
                  <span className="btn-text">Яндекс Карты</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Main;

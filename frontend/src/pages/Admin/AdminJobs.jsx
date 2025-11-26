import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Admin.css';

const AdminJobs = () => {
  const { user, getAuthHeader, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pendingJobs, setPendingJobs] = useState([]);
  const [approvedJobs, setApprovedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchJobs();
  }, [user, navigate]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      const pendingResponse = await axios.get(`${API_URL}/admin/jobs`, {
        headers: getAuthHeader()
      });
      setPendingJobs(pendingResponse.data);
      
      const approvedResponse = await axios.get(`${API_URL}/jobs`);
      setApprovedJobs(approvedResponse.data);
      
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Ошибка при загрузке вакансий');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (jobId) => {
    try {
      await axios.put(
        `${API_URL}/admin/jobs/${jobId}/approve`,
        {},
        { headers: getAuthHeader() }
      );
      alert('Вакансия одобрена!');
      fetchJobs();
    } catch (error) {
      alert('Ошибка: ' + (error.response?.data?.message || 'Неизвестная ошибка'));
    }
  };

  const handleReject = async (jobId) => {
    if (window.confirm('Вы уверены, что хотите отклонить эту вакансию?')) {
      try {
        await axios.delete(`${API_URL}/admin/jobs/${jobId}`, {
          headers: getAuthHeader()
        });
        alert('Вакансия отклонена!');
        fetchJobs();
      } catch (error) {
        alert('Ошибка: ' + (error.response?.data?.message || 'Неизвестная ошибка'));
      }
    }
  };

  const handleDeleteApproved = async (jobId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту вакансию?')) {
      try {
        await axios.delete(`${API_URL}/admin/jobs/${jobId}`, {
          headers: getAuthHeader()
        });
        alert('Вакансия удалена!');
        fetchJobs();
      } catch (error) {
        alert('Ошибка: ' + (error.response?.data?.message || 'Неизвестная ошибка'));
      }
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-page">
        <div className="container">
          <h1>Доступ запрещен</h1>
          <p>У вас нет прав для доступа к этой странице.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1>Управление вакансиями</h1>
          <div className="admin-stats">
            <span>Ожидают: {pendingJobs.length}</span>
            <span>Одобрены: {approvedJobs.length}</span>
          </div>
        </div>

        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            На модерации ({pendingJobs.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Одобренные ({approvedJobs.length})
          </button>
        </div>

        <div className="admin-content">
          {loading ? (
            <div className="loading">Загрузка вакансий...</div>
          ) : (
            <>
              {activeTab === 'pending' && (
                <div className="pending-jobs">
                  <h2>Вакансии на модерации</h2>
                  
                  {pendingJobs.length === 0 ? (
                    <div className="no-items">
                      <p>Нет вакансий для модерации</p>
                    </div>
                  ) : (
                    pendingJobs.map(job => (
                      <div key={job.id} className="admin-item">
                        <div className="item-details">
                          <h3>{job.title}</h3>
                          <p className="company">{job.company}</p>
                          <p className="salary">{job.salary}</p>
                          <p className="category">{job.category}</p>
                          <p className="description">{job.description}</p>
                          <p className="author">Автор: {job.username}</p>
                        </div>
                        
                        <div className="item-actions">
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleApprove(job.id)}
                          >
                            Одобрить
                          </button>
                          <button 
                            className="btn btn-danger"
                            onClick={() => handleReject(job.id)}
                          >
                            Отклонить
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'approved' && (
                <div className="approved-jobs">
                  <h2>Одобренные вакансии</h2>
                  
                  {approvedJobs.length === 0 ? (
                    <div className="no-items">
                      <p>Нет одобренных вакансий</p>
                    </div>
                  ) : (
                    approvedJobs.map(job => (
                      <div key={job.id} className="admin-item">
                        <div className="item-details">
                          <h3>{job.title}</h3>
                          <p className="company">{job.company}</p>
                          <p className="salary">{job.salary}</p>
                          <p className="category">{job.category}</p>
                          <p className="description">{job.description}</p>
                          <p className="author">Автор: {job.username}</p>
                        </div>
                        
                        <div className="item-actions">
                          <button 
                            className="btn btn-danger"
                            onClick={() => handleDeleteApproved(job.id)}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminJobs;

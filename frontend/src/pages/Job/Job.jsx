import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import './Job.css';

const Job = () => {
  const { user, getAuthHeader, API_URL } = useContext(AuthContext);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    salary: '',
    category: '',
    company: ''
  });

  const categories = ['Все', 'Строительство', 'Отделка', 'Электрика', 'Сантехника', 'Проектирование'];

  useEffect(() => {
    fetchJobs();
  }, [searchTerm, selectedCategory]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory && selectedCategory !== 'Все') params.category = selectedCategory;

      const response = await axios.get(`${API_URL}/jobs`, { params });
      setJobs(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Ошибка при загрузке вакансий');
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitJob = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${API_URL}/jobs`,
        newJob,
        { headers: getAuthHeader() }
      );
      
      setJobs([...jobs, response.data]);
      setNewJob({
        title: '',
        description: '',
        salary: '',
        category: '',
        company: ''
      });
      setShowJobForm(false);
      alert('Вакансия отправлена на модерацию!');
    } catch (error) {
      alert('Ошибка при создании вакансии: ' + (error.response?.data?.message || 'Неизвестная ошибка'));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewJob(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || selectedCategory === 'Все' || job.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="job-page">
      <div className="container">
        <h1>Вакансии</h1>
        
        <div className="job-actions">
          <div className="filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Поиск по названию вакансии..."
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

          {user && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowJobForm(true)}
            >
              Создать вакансию
            </button>
          )}
        </div>

        {loading ? (
          <div className="loading">Загрузка вакансий...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <>
            <div className="jobs-grid">
              {filteredJobs.map(job => (
                <div key={job.id} className="job-card card">
                  <h3>{job.title}</h3>
                  <p className="company">{job.company}</p>
                  <p className="salary">{job.salary}</p>
                  <p className="category">{job.category}</p>
                  <p className="description">{job.description}</p>
                  {user && (
                    <button className="btn btn-secondary">
                      Откликнуться
                    </button>
                  )}
                </div>
              ))}
            </div>

            {filteredJobs.length === 0 && (
              <div className="no-jobs">
                <p>Вакансии не найдены</p>
              </div>
            )}
          </>
        )}

        {showJobForm && (
          <div className="modal-overlay" onClick={() => setShowJobForm(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h2>Создание вакансии</h2>
              <form onSubmit={handleSubmitJob}>
                <div className="form-group">
                  <label className="form-label">Название вакансии</label>
                  <input
                    type="text"
                    name="title"
                    value={newJob.title}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Компания</label>
                  <input
                    type="text"
                    name="company"
                    value={newJob.company}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Зарплата</label>
                  <input
                    type="text"
                    name="salary"
                    value={newJob.salary}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="80000 ₽"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Категория</label>
                  <select
                    name="category"
                    value={newJob.category}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  >
                    <option value="">Выберите категорию</option>
                    {categories.filter(cat => cat !== 'Все').map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Описание</label>
                  <textarea
                    name="description"
                    value={newJob.description}
                    onChange={handleInputChange}
                    className="form-input"
                    rows="4"
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowJobForm(false)}>
                    Отмена
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Создать вакансию
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

export default Job;

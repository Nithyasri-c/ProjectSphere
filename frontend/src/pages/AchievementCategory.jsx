import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { achievementsData, achievementCategories } from '../data/achievementsData';
import AchievementDetailModal from '../components/AchievementDetailModal';
import './AchievementCategory.css';

const AchievementCategory = () => {
    const { category } = useParams();
    const navigate = useNavigate();
    const [selectedAchievement, setSelectedAchievement] = useState(null);

    const categoryInfo = achievementCategories.find(cat => cat.id === category);
    const achievements = categoryInfo ? achievementsData[categoryInfo.key] : [];

    if (!categoryInfo) {
        return (
            <div className="category-not-found">
                <h2>Category Not Found</h2>
                <button className="btn btn-primary" onClick={() => navigate('/home')}>
                    Back to Home
                </button>
            </div>
        );
    }

    const handleAchievementClick = (achievement) => {
        setSelectedAchievement(achievement);
    };

    const handleCloseModal = () => {
        setSelectedAchievement(null);
    };

    return (
        <div className="achievement-category-page">
            {/* Hero Header */}
            <header className="category-hero" style={{
                '--hero-bg': categoryInfo.gradient,
                '--hero-img': `url(${categoryInfo.categoryImage})`
            }}>
                <div className="hero-content-wrapper">
                    <div className="hero-main-info">
                        <div className="breadcrumb">
                            <span onClick={() => navigate('/home')} className="breadcrumb-link">Home</span>
                            <span className="breadcrumb-separator">/</span>
                            <span onClick={() => navigate('/home#achievements')} className="breadcrumb-link">Achievements</span>
                            <span className="breadcrumb-separator">/</span>
                            <span className="breadcrumb-current">{categoryInfo.label}</span>
                        </div>

                        <div className="hero-title-group">
                            <div className="hero-icon-container">
                                <span className="hero-icon-large">{categoryInfo.icon}</span>
                            </div>
                            <div className="hero-text">
                                <h1 className="hero-title-main">{categoryInfo.label}</h1>
                            </div>
                        </div>
                    </div>

                    <div className="hero-stats-panel">
                        <div className="stat-box">
                            <span className="stat-value">{achievements.length}</span>
                            <span className="stat-label-large">Achievements</span>
                        </div>
                        <div className="hero-status-pill">
                            <span className="status-dot"></span>
                            Active Category
                        </div>
                    </div>
                </div>

                <div className="hero-overlay-refined"></div>

                <div className="hero-wave-refined">
                    <svg viewBox="0 0 1440 120" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 120V0C180 60 360 80 540 80C720 80 900 60 1080 40C1260 20 1440 40 1440 40V120H0Z" fill="white" />
                    </svg>
                </div>
            </header>

            {/* Achievements List */}
            <div className="achievements-list-container">
                <div className="achievements-grid">
                    {achievements.map((achievement, index) => (
                        <div
                            key={achievement.id}
                            className="achievement-card-horizontal"
                            style={{ animationDelay: `${index * 0.1}s` }}
                            onClick={() => handleAchievementClick(achievement)}
                        >
                            {achievement.images && achievement.images[0] && (
                                <div className="card-image-section">
                                    <div className="card-icon-wrapper">
                                        <img
                                            src={achievement.images[0]}
                                            alt=""
                                            className="card-status-icon"
                                            onError={(e) => {
                                                e.target.closest('.card-image-section').style.display = 'none';
                                            }}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="card-content-section">
                                <span className="card-date">{achievement.date || achievement.year}</span>
                                <h3 className="card-title">{achievement.title}</h3>
                                {achievement.description && (
                                    <p className="card-description">{achievement.description}</p>
                                )}
                                <div className="card-action">
                                    <button className="read-more-btn">
                                        <span>Read more</span>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="7" y1="17" x2="17" y2="7"></line>
                                            <polyline points="7 7 17 7 17 17"></polyline>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {achievements.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">{categoryInfo.icon}</div>
                        <h3>No Achievements Yet</h3>
                        <p>Check back later for updates in this category</p>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedAchievement && (
                <AchievementDetailModal
                    achievement={selectedAchievement}
                    category={categoryInfo}
                    onClose={handleCloseModal}
                />
            )}
        </div>
    );
};

export default AchievementCategory;

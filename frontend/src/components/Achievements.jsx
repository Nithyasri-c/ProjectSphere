import React from 'react';
import { useNavigate } from 'react-router-dom';
import { achievementsData, achievementCategories } from '../data/achievementsData';
import './Achievements.css';

const Achievements = () => {
    const navigate = useNavigate();

    const handleCategoryClick = (categoryId) => {
        navigate(`/achievements/${categoryId}`);
    };

    const [activeIndex, setActiveIndex] = React.useState(0);
    const sliderRef = React.useRef(null);

    const handleScroll = () => {
        if (sliderRef.current) {
            const scrollLeft = sliderRef.current.scrollLeft;
            const itemWidth = sliderRef.current.offsetWidth / (window.innerWidth < 768 ? 1.2 : 3);
            const index = Math.round(scrollLeft / itemWidth);
            setActiveIndex(index);
        }
    };

    React.useEffect(() => {
        const slider = sliderRef.current;
        if (slider) {
            slider.addEventListener('scroll', handleScroll);
            return () => slider.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const scrollSlider = (direction) => {
        if (sliderRef.current) {
            const scrollAmount = direction === 'left' ? -400 : 400;
            sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <section className="achievements-section">
            <div className="achievements-background">
                <div className="floating-orb orb-1"></div>
                <div className="floating-orb orb-2"></div>
                <div className="floating-orb orb-3"></div>
            </div>

            <div className="achievements-container">
                <div className="achievements-header">
                    <h2 className="achievements-title">
                        <span className="title-icon">🏆</span>
                        <span className="title-text">Our Achievements</span>
                    </h2>
                    <p className="achievements-subtitle">
                        Celebrating excellence across research, innovation, and education
                    </p>
                </div>

                <div className="category-slider-wrapper">
                    <button className="slider-nav-btn prev" onClick={() => scrollSlider('left')} aria-label="Previous">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>

                    <div className="category-grid slider-mode" ref={sliderRef}>
                        {achievementCategories.map((category, index) => {
                            const count = achievementsData[category.key]?.length || 0;
                            const categoryImage = category.categoryImage || '/achievements/placeholder.jpg';

                            return (
                                <div
                                    key={category.id}
                                    className="category-card slider-item"
                                    onClick={() => handleCategoryClick(category.id)}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="category-image-container">
                                        <img
                                            src={categoryImage}
                                            alt={category.label}
                                            className="category-image"
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                        <div className="category-overlay"></div>
                                    </div>

                                    <div className="category-content">
                                        <div className="category-icon-wrapper">
                                            <span className="category-icon" style={{ background: category.gradient }}>
                                                {category.icon}
                                            </span>
                                        </div>

                                        <h3 className="category-title">{category.label}</h3>
                                        <p className="category-description">{category.description}</p>

                                        <div className="category-footer">
                                            <div className="category-count">
                                                <span className="count-number">{count}</span>
                                                <span className="count-label">{count === 1 ? 'Achievement' : 'Achievements'}</span>
                                            </div>
                                            <div className="category-arrow">
                                                <span>Explore</span>
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="category-shine"></div>
                                </div>
                            );
                        })}
                    </div>

                    <button className="slider-nav-btn next" onClick={() => scrollSlider('right')} aria-label="Next">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>

                    <div className="slider-pagination">
                        {achievementCategories.map((_, dotIndex) => (
                            <span key={dotIndex} className={`pagination-dot ${dotIndex === activeIndex ? 'active' : ''}`}></span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Achievements;

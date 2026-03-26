import React, { useEffect } from 'react';
import './AchievementDetailModal.css';

const AchievementDetailModal = ({ achievement, category, onClose }) => {
    // Handle ESC key to close modal
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="achieve-modal-backdrop" onClick={onClose}>
            <div className="achieve-modal-container achieve-modal-container-large" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="achieve-modal-close-btn" onClick={onClose} aria-label="Close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 6L6 18M6 6l12 12" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                </button>

                {/* Modal Content */}
                <div className="achieve-modal-content">
                    {/* Details Section */}
                    <div className="achieve-modal-details-scroll">
                        <div className="achieve-modal-content-wrapper">
                            <div className="achieve-details-header">
                                <div className="achieve-category-badge" style={{ background: category.gradient }}>
                                    <span className="achieve-badge-icon">{category.icon}</span>
                                    <span className="achieve-badge-label">
                                        {category.label === 'Progress Tracking' ? 'Milestone Tracker' : category.label}
                                    </span>
                                </div>
                            </div>

                            <h2 className="achieve-modal-title">{achievement.title}</h2>

                            <div className="achieve-modal-meta-grid">
                                {achievement.date && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">📅</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Date</span>
                                            <span className="achieve-meta-value">{achievement.date || achievement.year}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.authors && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">👥</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Authors</span>
                                            <span className="achieve-meta-value">{achievement.authors}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.venue && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">📍</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Venue</span>
                                            <span className="achieve-meta-value">{achievement.venue}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.inventors && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">💡</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Inventors</span>
                                            <span className="achieve-meta-value">{achievement.inventors}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.status && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">✓</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Status</span>
                                            <span className="achieve-meta-value achieve-status-value">{achievement.status}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.institution && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">🏛️</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Institution</span>
                                            <span className="achieve-meta-value">{achievement.institution}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.fundingAgency && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">💰</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Funding Agency</span>
                                            <span className="achieve-meta-value">{achievement.fundingAgency}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.principalInvestigators && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">🔬</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Principal Investigators</span>
                                            <span className="achieve-meta-value">{achievement.principalInvestigators}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.duration && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">⏱️</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Duration</span>
                                            <span className="achieve-meta-value">{achievement.duration}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.amount && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">💵</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Amount</span>
                                            <span className="achieve-meta-value">{achievement.amount}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.recipient && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">🏆</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Recipient</span>
                                            <span className="achieve-meta-value">{achievement.recipient}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.students && achievement.students.length > 0 && (
                                    <div className="achieve-meta-item achieve-students-full-width">
                                        <span className="achieve-meta-icon">👨‍🎓</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Student Team Members</span>
                                            <div className="achieve-students-list">
                                                {achievement.students.map((student, idx) => (
                                                    <span key={idx} className="achieve-student-name">{student}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {achievement.organization && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">🏢</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Organization</span>
                                            <span className="achieve-meta-value">{achievement.organization}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.participants && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">👨‍🎓</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">Participants</span>
                                            <span className="achieve-meta-value">{achievement.participants}</span>
                                        </div>
                                    </div>
                                )}

                                {achievement.coe && (
                                    <div className="achieve-meta-item">
                                        <span className="achieve-meta-icon">🎯</span>
                                        <div className="achieve-meta-content">
                                            <span className="achieve-meta-label">COE</span>
                                            <span className="achieve-meta-value">{achievement.coe}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="achieve-description-section">
                                <h3 className="achieve-section-title">Description</h3>
                                <p className="achieve-description-text">{achievement.description}</p>
                            </div>

                            {achievement.details && (
                                <div className="achieve-additional-details">
                                    {achievement.details.abstract && (
                                        <div className="achieve-detail-block">
                                            <h4 className="achieve-detail-title">Abstract</h4>
                                            <p className="achieve-detail-text">{achievement.details.abstract}</p>
                                        </div>
                                    )}

                                    {achievement.details.objectives && (
                                        <div className="achieve-detail-block">
                                            <h4 className="achieve-detail-title">Objectives</h4>
                                            <ul className="achieve-detail-list">
                                                {achievement.details.objectives.map((obj, idx) => (
                                                    <li key={idx}>{obj}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {achievement.details.outcomes && (
                                        <div className="achieve-detail-block">
                                            <h4 className="achieve-detail-title">Outcomes</h4>
                                            <ul className="achieve-detail-list">
                                                {achievement.details.outcomes.map((outcome, idx) => (
                                                    <li key={idx}>{outcome}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {achievement.details.topics && (
                                        <div className="achieve-detail-block">
                                            <h4 className="achieve-detail-title">Topics Covered</h4>
                                            <ul className="achieve-detail-list">
                                                {achievement.details.topics.map((topic, idx) => (
                                                    <li key={idx}>{topic}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {achievement.details.keywords && (
                                        <div className="achieve-detail-block">
                                            <h4 className="achieve-detail-title">Keywords</h4>
                                            <div className="achieve-keywords-container">
                                                {achievement.details.keywords.map((keyword, idx) => (
                                                    <span key={idx} className="achieve-keyword-tag">{keyword}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {achievement.details.collaborators && (
                                        <div className="achieve-detail-block">
                                            <h4 className="achieve-detail-title">Collaborators</h4>
                                            <ul className="achieve-detail-list">
                                                {achievement.details.collaborators.map((collab, idx) => (
                                                    <li key={idx}>{collab}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AchievementDetailModal;

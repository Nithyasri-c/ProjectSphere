import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChatsListPanel.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const ChatsListPanel = ({ batches, isOpen, onClose, onSelectTeam }) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load chats when panel opens
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
    }
  }, [isOpen, batches]);

  if (!isOpen) return null;

  return (
    <div className="chats-overlay" onClick={onClose}>
      <div className="chats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chats-header">
          <h2>Team Messages</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {loading && <div className="chats-loading">Loading...</div>}

        <div className="chats-list">
          {batches.length === 0 ? (
            <div className="no-chats">No teams assigned yet</div>
          ) : (
            batches.map(batch => (
              <div key={batch._id} className="batch-chats-group">
                <h3 className="batch-name">{batch.batchName || 'Batch'}</h3>
                
                {/* Show team cards */}
                <div className="teams-in-batch">
                  <div
                    className="team-chat-item"
                    onClick={() => {
                      onSelectTeam({ batchId: batch._id, teamMemberId: batch.leaderStudentId?._id });
                      onClose();
                    }}
                  >
                    <div className="team-info">
                      <h4>{batch.teamName}</h4>
                      <p>{batch.leaderStudentId?.name || 'Team Leader'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatsListPanel;

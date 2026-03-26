import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import * as api from '../../services/api';
import ChatPanel from '../../components/ChatPanel';
import { generateChatReport, generateSummaryReport } from '../../utils/reportGenerator';
import usePolling from '../../utils/usePolling';
import CreateBatch from './CreateBatch';
import TeamMembers from './TeamMembers';
import COEList from './COEList';
import ProblemList from './ProblemList';
import ProjectDetails from './ProjectDetails';
import TimelineProgress from './TimelineProgress';
import './StudentDashboard.css';

function StudentDashboard() {
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(
    () => sessionStorage.getItem('studentActiveTab') || 'overview'
  );
  const [selectedCOE, setSelectedCOE] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatData, setChatData] = useState(null);
  const [summarizing, setSummarizing] = useState(false);

  const fetchBatch = useCallback(async () => {
    if (!batch) setLoading(true);
    try {
      const res = await api.getMyBatch();
      setBatch(res.data.data);
    } catch (error) {
      setBatch(null);
    } finally {
      setLoading(false);
    }
  }, [batch]);

  useEffect(() => {
    fetchBatch();
  }, [fetchBatch]);

  // Poll batch status every 20s so guide approval / rejection appears automatically
  usePolling(fetchBatch, 20000);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    sessionStorage.setItem('studentActiveTab', tab);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  // No batch created yet
  if (!batch) {
    return <CreateBatch onBatchCreated={fetchBatch} />;
  }

  // Check various states
  const hasOptedProblem = batch.optedProblemId;
  const isAllotted = batch.allotmentStatus === 'allotted';
  const isPending = batch.allotmentStatus === 'pending';

  // Count pending opted problems
  const pendingOptedCount = batch.optedProblems?.filter(o => o.status === 'pending')?.length || 0;

  // Can select if not allotted and has less than 3 pending selections
  const canSelectProblem = !isAllotted && pendingOptedCount < 3;

  const getStatusText = () => {
    if (isAllotted) return batch.status;
    if (pendingOptedCount > 0) return `Waiting for Guide Approval (${pendingOptedCount} pending)`;
    return 'Select a Problem Statement';
  };

  const getStatusClass = () => {
    if (isAllotted) return batch.status.toLowerCase().replace(' ', '-');
    if (pendingOptedCount > 0) return 'pending';
    return 'not-started';
  };

  const handleOpenChat = async () => {
    try {
      const leaderId = typeof batch.leaderStudentId === 'object'
        ? batch.leaderStudentId._id
        : batch.leaderStudentId;

      if (leaderId) {
        try {
          const response = await axios.get(`/api/chat/student/${batch._id}/${leaderId}`);
          setChatData(response.data.data);
        } catch (err) {
          // If chat doesn't exist yet, create a new one
          setChatData({
            _id: batch._id,
            batchId: batch,
            teamMemberId: { _id: leaderId, teamName: batch.teamName },
            guideId: batch.guideId,
            messages: []
          });
        }
      }
      setChatOpen(true);
    } catch (error) {
      console.error('Error opening chat:', error);
    }
  };

  const handleDownloadSummaryReport = async () => {
    if (!batch) return;
    setSummarizing(true);
    try {
      // Use the batch-specific summarize endpoint which handles missing ProjectEntry mapping
      await api.summarizeBatch(batch._id);

      // Fetch summaries for this specific batch
      const summaryRes = await api.getBatchSummaries(batch._id);
      const summaries = summaryRes.data.data;

      if (!summaries || summaries.length === 0) {
        alert('No chat history found to summarize. Please ensure you have exchanged messages with your guide (both student and guide must participate on the same day).');
        return;
      }

      // Export to PDF
      generateSummaryReport(summaries, batch.teamName);
    } catch (error) {
      console.error('Error generating summary report:', error);
      alert('Failed to generate summary report. Please check your internet connection or try again later.');
    } finally {
      setSummarizing(false);
    }
  };

  const handleChatLoaded = (data) => {
    setChatData(data);
  };

  const handleChatClose = () => {
    setChatOpen(false);
  };

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>👋 Welcome, Team {batch.teamName}</h1>
          <div className="status-info">
            <span className="status-label">Status:</span>
            <span className={`status-badge status-${getStatusClass()}`}>{getStatusText()}</span>
          </div>
        </div>
        <div className="header-right">
          {isAllotted && (
            <div className="header-actions">
              <button className="chat-btn" onClick={handleOpenChat} title="Chat with Guide">
                💬 Chat
              </button>
              <button
                className="report-btn"
                onClick={handleDownloadSummaryReport}
                disabled={summarizing}
                title="Download Summarized Report"
                style={{ marginLeft: '10px' }}
              >
                {summarizing ? '⌛...' : '📋 Report'}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => handleTabChange('overview')}>
          📊 Overview
        </button>
        <button className={`tab ${activeTab === 'team' ? 'active' : ''}`} onClick={() => handleTabChange('team')}>
          👥 Team Members
        </button>
        {canSelectProblem && (
          <button className={`tab ${activeTab === 'select' ? 'active' : ''}`} onClick={() => handleTabChange('select')}>
            🔍 Select Problem
          </button>
        )}
        {isAllotted && (
          <>
            <button className={`tab ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => handleTabChange('timeline')}>
              📅 Timeline &amp; Submissions
            </button>
          </>
        )}
      </div>

      <div className="tab-content">
        {activeTab === 'overview' && (
          <ProjectDetails batch={batch} isPending={isPending} isAllotted={isAllotted} />
        )}

        {activeTab === 'team' && (
          <TeamMembers batchId={batch._id} leader={batch.leaderStudentId} batchYear={batch.year} />
        )}

        {activeTab === 'select' && canSelectProblem && (
          selectedCOE ? (
            <ProblemList
              coeId={selectedCOE._id}
              coeName={selectedCOE.name}
              onBack={() => setSelectedCOE(null)}
              onProblemSelected={fetchBatch}
              batch={batch}
            />
          ) : (
            <COEList onCOESelect={setSelectedCOE} />
          )
        )}

        {activeTab === 'timeline' && isAllotted && (
          <TimelineProgress batchId={batch._id} />
        )}
      </div>

      <ChatPanel
        batchId={batch._id}
        teamMemberId={typeof batch.leaderStudentId === 'object' ? batch.leaderStudentId._id : batch.leaderStudentId}
        isOpen={chatOpen}
        onClose={handleChatClose}
        onChatLoaded={handleChatLoaded}
      />
    </div>
  );
}

export default StudentDashboard;


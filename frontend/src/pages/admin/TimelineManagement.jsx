import { useState, useEffect, useCallback } from "react";
import * as api from "../../services/api";
import usePolling from "../../utils/usePolling";

const TARGET_YEARS = ["all", "2nd", "3rd", "4th"];
const ALL_COLUMNS = [
  { key: "teamName", label: "Team Name" },
  { key: "teamMembers", label: "Team Members" },
  { key: "year", label: "Year" },
  { key: "branch", label: "Branch" },
  { key: "section", label: "Section" },
  { key: "coe", label: "COE", width: "100px" },
  { key: "guide", label: "Guide", width: "100px" },
  { key: "marks", label: "Marks" },
  { key: "guidesFeedback", label: "Guide's Feedback", width: "120px" },
  { key: "adminRemarks", label: "Admin Remarks", width: "120px" },
];

function TimelineManagement() {
  const [events, setEvents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    maxMarks: "",
    submissionRequirements: "",
    targetYear: "all",
    order: 0,
    isMarksEnabled: true,
  });

  // Pagination and lazy loading
  const [submissionPage, setSubmissionPage] = useState(1);
  const [submissionPagination, setSubmissionPagination] = useState({
    current: 1,
    total: 0,
    limit: 50,
    pages: 0
  });
  const [isLoadingMoreSubmissions, setIsLoadingMoreSubmissions] = useState(false);

  // Filters
  const [filterYear, setFilterYear] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterSection, setFilterSection] = useState("");

  // Admin remarks state
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [selectedSubmissionForRemark, setSelectedSubmissionForRemark] =
    useState(null);
  const [remarkText, setRemarkText] = useState("");
  const [expandedRemarkSubmission, setExpandedRemarkSubmission] =
    useState(null);
  const [expandedFeedbackSubmission, setExpandedFeedbackSubmission] =
    useState(null);
  const [selectedColumns, setSelectedColumns] = useState(
    ALL_COLUMNS.map((col) => col.key)
  );
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      let eventsData = [];

      try {
        const eventsRes = await api.getAllTimelineEvents();
        if (Array.isArray(eventsRes.data)) {
          eventsData = eventsRes.data;
        } else if (eventsRes.data?.data && Array.isArray(eventsRes.data.data)) {
          eventsData = eventsRes.data.data;
        }
      } catch (error) {
        console.error("Events fetch error:", error.message);
      }

      setEvents(eventsData);
      // Removed clearing of batches/submissions to avoid flickering during auto-poll
      if (loading) setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error.message);
      if (loading) setLoading(false);
    }
  }, [loading]);

  // Fetch batches lazily - only when event is selected
  const fetchBatchesForEvent = useCallback(async () => {
    try {
      const batchesRes = await api.getAllBatches();
      const batchesData = batchesRes.data?.data || batchesRes.data || [];
      setBatches(batchesData);
      return batchesData;
    } catch (error) {
      console.error("Batches fetch error:", error.message);
      return [];
    }
  }, []);

  // Fetch submissions for selected event with pagination
  const fetchSubmissionsForEvent = useCallback(async (eventId, page = 1) => {
    try {
      if (!eventId) return;

      if (page === 1) {
        if (submissions.length === 0) setIsLoadingMoreSubmissions(true);
      } else {
        setIsLoadingMoreSubmissions(true);
      }

      const submissionsRes = await api.getAllSubmissions({
        eventId,
        page,
        limit: 50
      });

      const newSubmissions = submissionsRes.data?.data || submissionsRes.data || [];
      const pagination = submissionsRes.data?.pagination || {
        current: page,
        total: 0,
        limit: 50,
        pages: 0
      };

      if (page === 1) {
        setSubmissions(newSubmissions);
      } else {
        // Append to existing submissions
        setSubmissions(prev => [...prev, ...newSubmissions]);
      }

      setSubmissionPagination(pagination);
      setSubmissionPage(page);
      setIsLoadingMoreSubmissions(false);
    } catch (error) {
      console.error("Submissions fetch error:", error.message);
      setIsLoadingMoreSubmissions(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEvent?._id) {
      const load = async () => {
        // If batches haven't been fetched yet, fetch them once for the dashboard session
        // or if explicitly empty
        if (batches.length === 0) {
          await fetchBatchesForEvent();
        }
        // Then fetch submissions
        await fetchSubmissionsForEvent(selectedEvent._id, 1);
      };
      load();
    }
  }, [selectedEvent?._id, fetchSubmissionsForEvent, fetchBatchesForEvent]); // Removed 'batches' from deps

  // Poll every 60s for new events/batches only (not submissions) - reduced from 25s
  usePolling(fetchEvents, 60000);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showColumnDropdown && !e.target.closest('.column-dropdown-container')) {
        setShowColumnDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColumnDropdown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submitting form with data:", formData);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      data.append(key, formData[key]);
    });

    try {
      if (editingEvent) {
        console.log("Updating event:", editingEvent._id);
        await api.updateTimelineEvent(editingEvent._id, data);
      } else {
        console.log("Creating new event");
        await api.createTimelineEvent(data);
      }
      console.log("Event saved successfully");
      setShowForm(false);
      setEditingEvent(null);
      setFormData({
        title: "",
        description: "",
        deadline: "",
        maxMarks: "",
        submissionRequirements: "",
        targetYear: "all",
        order: 0,
        isMarksEnabled: true,
      });
      fetchEvents();
    } catch (error) {
      console.error("Failed to save event:", error);
      console.error("Error response:", error.response);
      alert(error.response?.data?.message || "Failed to save event");
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || "",
      deadline: event.deadline.split("T")[0],
      maxMarks: event.maxMarks,
      submissionRequirements: event.submissionRequirements || "",
      targetYear: event.targetYear,
      order: event.order || 0,
      isMarksEnabled: event.isMarksEnabled !== undefined ? event.isMarksEnabled : true,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this timeline event?")) return;
    try {
      await api.deleteTimelineEvent(id);
      fetchEvents();
    } catch (error) {
      alert("Failed to delete");
    }
  };

  const getStatusBadge = (deadline) => {
    const now = new Date();
    const dl = new Date(deadline);
    const diff = (dl - now) / (1000 * 60 * 60 * 24);
    if (diff < 0)
      return (
        <span className="timeline-badge badge-danger">
          Past Due
        </span>
      );
    if (diff < 3)
      return (
        <span className="timeline-badge badge-warning">
          Due Soon
        </span>
      );
    return (
      <span className="timeline-badge badge-success">
        Upcoming
      </span>
    );
  };

  if (loading && events.length === 0) {
    return (
      <div style={{ padding: '20px' }}>
        {[1, 2, 3].map(i => (
          <div key={i} className="card" style={{ marginBottom: '15px', opacity: 0.5 }}>
            <div style={{ height: '18px', background: '#e2e8f0', borderRadius: '4px', width: '40%', marginBottom: '10px' }} />
            <div style={{ height: '12px', background: '#e2e8f0', borderRadius: '4px', width: '70%' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="flex-between" style={{ marginBottom: "20px" }}>
        <h2>📅 Timeline Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const defaultDate = tomorrow.toISOString().split("T")[0];
            setShowForm(true);
            setEditingEvent(null);
            setFormData({
              title: "",
              description: "",
              deadline: defaultDate,
              maxMarks: "",
              submissionRequirements: "",
              targetYear: "all",
              order: 0,
              isMarksEnabled: true,
            });
          }}
        >
          + Add Event
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <h3>{editingEvent ? "Edit Event" : "Create New Timeline Event"}</h3>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <div className="form-group">
                <label>Event Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Abstract Submission, PRC-1"
                  required
                />
              </div>
              <div className="form-group">
                <label>Deadline *</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  required
                />
                <small style={{ color: "#666", fontSize: "12px" }}>
                  Select a future date for the deadline
                </small>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%', marginTop: 'auto', paddingBottom: '10px' }}>
                <input
                  type="checkbox"
                  id="isMarksEnabled"
                  checked={formData.isMarksEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, isMarksEnabled: e.target.checked })
                  }
                  style={{ width: 'auto' }}
                />
                <label htmlFor="isMarksEnabled" style={{ margin: 0, cursor: 'pointer' }}>Enable Marks</label>
              </div>
              {formData.isMarksEnabled && (
                <div className="form-group">
                  <label>Maximum Marks *</label>
                  <input
                    type="number"
                    value={formData.maxMarks}
                    onChange={(e) =>
                      setFormData({ ...formData, maxMarks: e.target.value })
                    }
                    min="0"
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Target Year</label>
                <select
                  value={formData.targetYear}
                  onChange={(e) =>
                    setFormData({ ...formData, targetYear: e.target.value })
                  }
                >
                  {TARGET_YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y === "all" ? "All Years" : `${y} Year`}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Order (for sorting)</label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                placeholder="Brief description of this review stage"
              />
            </div>
            <div className="form-group">
              <label>Submission Requirements</label>
              <textarea
                value={formData.submissionRequirements}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    submissionRequirements: e.target.value,
                  })
                }
                rows={3}
                placeholder="What documents/files need to be submitted"
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="btn btn-primary">
                {editingEvent ? "Update" : "Create"} Event
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedEvent && (
        <div>
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedEvent(null)}
            style={{ marginBottom: "20px" }}
          >
            ← Back to Timeline
          </button>

          <div
            className="card"
            style={{ marginBottom: "20px", borderLeft: "4px solid #667eea" }}
          >
            <h2>{selectedEvent.title}</h2>
            <p style={{ color: "#666" }}>{selectedEvent.description}</p>
            <div style={{ display: "flex", gap: "20px", marginTop: "15px" }}>
              <span>
                <strong>📅 Deadline:</strong>{" "}
                {new Date(selectedEvent.deadline).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span>
                <strong>🎯 Max Marks:</strong> {selectedEvent.maxMarks}
              </span>
            </div>
          </div>

          {/* Filters & Download */}
          <div className="card" style={{ marginBottom: "20px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <h3>🔍 Filters</h3>
              <button
                className="btn btn-success"
                onClick={() => downloadReportAsCSV()}
              >
                📥 Download Report (CSV)
              </button>
            </div>
            <div
              style={{
                display: "flex",
                gap: "20px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <div className="form-group" style={{ margin: 0 }}>
                <label>Year</label>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                >
                  <option value="">All Years</option>
                  <option value="2nd">2nd Year</option>
                  <option value="3rd">3rd Year</option>
                  <option value="4th">4th Year</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Branch</label>
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                >
                  <option value="">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="ECE">ECE</option>
                  <option value="CSM">CSM</option>
                  <option value="EEE">EEE</option>
                  <option value="CSD">CSD</option>
                  <option value="ETM">ETM</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Section</label>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                >
                  <option value="">All Sections</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                </select>
              </div>
              <div className="form-group column-dropdown-container" style={{ margin: 0, position: "relative" }}>
                <label>Select Columns</label>
                <div
                  onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    cursor: "pointer",
                    background: "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    minWidth: "200px"
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#666" }}>
                    {selectedColumns.length} column{selectedColumns.length !== 1 ? 's' : ''} selected
                  </span>
                  <span style={{ fontSize: "12px" }}>{showColumnDropdown ? '▲' : '▼'}</span>
                </div>
                {showColumnDropdown && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: "4px",
                      background: "white",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                      zIndex: 1000,
                      minWidth: "200px",
                      maxHeight: "300px",
                      overflowY: "auto"
                    }}
                  >
                    {ALL_COLUMNS.map((col) => (
                      <label
                        key={col.key}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          cursor: "pointer",
                          fontSize: "13px",
                          borderBottom: "1px solid #f0f0f0",
                          background: selectedColumns.includes(col.key) ? "#f0f7ff" : "white"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f8f9fa"}
                        onMouseLeave={(e) => e.currentTarget.style.background = selectedColumns.includes(col.key) ? "#f0f7ff" : "white"}
                      >
                        <span>{col.label}</span>
                        <input
                          type="checkbox"
                          checked={selectedColumns.includes(col.key)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedColumns((prev) => [...prev, col.key]);
                            } else {
                              setSelectedColumns((prev) => prev.filter((k) => k !== col.key));
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setFilterYear("");
                  setFilterBranch("");
                  setFilterSection("");
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {isLoadingMoreSubmissions && submissions.length === 0 && (
            <div className="card" style={{ marginBottom: "20px", textAlign: "center", padding: "40px 20px" }}>
              <div style={{ fontSize: "18px", color: "#667eea", marginBottom: "10px" }}>⏳ Loading submissions...</div>
              <div style={{ fontSize: "13px", color: "#999" }}>This may take a moment if there are many submissions</div>
            </div>
          )}

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Team Members</th>
                  <th>Class</th>
                  <th style={{ width: "100px", maxWidth: "100px" }}>COE/RC</th>
                  <th style={{ width: "100px", maxWidth: "100px" }}>Research Area</th>
                  <th style={{ width: "100px", maxWidth: "100px" }}>Guide</th>
                  <th>Marks</th>
                  <th style={{ width: "120px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis" }}>Guide's Feedback</th>
                  <th style={{ width: "120px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis" }}>Remarks</th>
                  <th style={{ width: "60px" }}>File</th>
                </tr>
              </thead>
              <tbody>
                {submissions
                  .filter((sub) => {
                    // Handle both string and object formats for timelineEventId
                    const subEventId =
                      typeof sub.timelineEventId === "string"
                        ? sub.timelineEventId
                        : sub.timelineEventId?._id;
                    return subEventId === selectedEvent._id;
                  })
                  .filter((sub) => {
                    const batchId =
                      typeof sub.batchId === "string"
                        ? sub.batchId
                        : sub.batchId?._id;
                    const batch = batches.find((b) => b._id === batchId);
                    if (!batch) return false;
                    if (filterYear && batch.year !== filterYear) return false;
                    if (filterBranch && batch.branch !== filterBranch)
                      return false;
                    if (filterSection && batch.section !== filterSection)
                      return false;
                    return true;
                  })
                  .map((sub) => {
                    const batchId =
                      typeof sub.batchId === "string"
                        ? sub.batchId
                        : sub.batchId?._id;
                    const batch = batches.find((b) => b._id === batchId);
                    const latestVersion =
                      sub.versions?.[sub.versions.length - 1];
                    const latestAdminRemark =
                      sub.adminRemarks?.length > 0
                        ? sub.adminRemarks[sub.adminRemarks.length - 1]
                        : null;

                    // Debug: Log the batch data to see what we're getting
                    if (batch && batch.teamName) {
                      console.log(`📦 Batch ${batch.teamName}:`, {
                        leaderName: batch.leaderStudentId?.name,
                        leaderRollNumber: batch.leaderStudentId?.rollNumber,
                        leaderStudentIdFull: batch.leaderStudentId,
                        teamMembers: batch.teamMembers,
                      });
                    }

                    // Combine leader and team members
                    const leader = batch?.leaderStudentId;
                    const members = batch?.teamMembers || [];

                    return (
                      <tr key={sub._id}>
                        <td>
                          <strong>{batch?.teamName}</strong>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            {members.map((m, idx) => (
                              <div
                                key={idx}
                                style={{
                                  fontSize: "12px",
                                  color: "#4a5568",
                                  paddingLeft: "18px",
                                }}
                              >
                                • {m.rollNo}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          {batch?.year} {batch?.branch}-{batch?.section}
                        </td>
                        <td>{batch?.problemId?.coeId?.name || batch?.coeId?.name || batch?.coe?.name || "Not Assigned"}</td>
                        <td>{batch?.problemId?.researchArea || batch?.researchArea || "Not Assigned"}</td>
                        <td>
                          {batch?.guideId?.name ? (
                            <span
                              style={{ fontWeight: "500", color: "#2d3748" }}
                            >
                              👨‍🏫 {batch.guideId.name}
                            </span>
                          ) : (
                            <span
                              style={{ color: "#718096", fontStyle: "italic" }}
                            >
                              Not Assigned
                            </span>
                          )}
                        </td>
                        <td>
                          {sub.marks !== null
                            ? `${sub.marks}/${selectedEvent.maxMarks}`
                            : "-"}
                        </td>
                        <td>
                          <div
                            style={{
                              width: "120px",
                              maxWidth: "120px",
                              minHeight: "60px",
                              display: "flex",
                              alignItems: "center",
                              overflow: "hidden"
                            }}
                          >
                            {sub.comments && sub.comments.length > 0 ? (
                              <div
                                style={{
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  padding: "8px",
                                  background: "#e8f4f8",
                                  borderRadius: "4px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  width: "100%",
                                  borderLeft: "3px solid #0ea5e9",
                                }}
                                onClick={() =>
                                  setExpandedFeedbackSubmission(sub._id)
                                }
                                title="Click to expand"
                              >
                                <strong>👨‍🏫:</strong>{" "}
                                {sub.comments[sub.comments.length - 1].comment.substring(0, 50)}...
                                <br />
                                <small style={{ color: "#666" }}>
                                  {new Date(
                                    sub.comments[sub.comments.length - 1].createdAt
                                  ).toLocaleDateString("en-IN")}
                                </small>
                              </div>
                            ) : (
                              <span style={{ color: "#999", fontSize: "12px" }}>
                                No feedback
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div
                            style={{
                              width: "120px",
                              maxWidth: "120px",
                              minHeight: "60px",
                              display: "flex",
                              alignItems: "center",
                              overflow: "hidden"
                            }}
                          >
                            {latestAdminRemark ? (
                              <div
                                style={{
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  padding: "8px",
                                  background: "#f0f0f0",
                                  borderRadius: "4px",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  width: "100%",
                                }}
                                onClick={() =>
                                  setExpandedRemarkSubmission(sub._id)
                                }
                                title="Click to expand"
                              >
                                <strong>Admin:</strong>{" "}
                                {latestAdminRemark.remark.substring(0, 50)}...
                                <br />
                                <small style={{ color: "#999" }}>
                                  {new Date(
                                    latestAdminRemark.createdAt
                                  ).toLocaleDateString("en-IN")}
                                </small>
                              </div>
                            ) : (
                              <button
                                className="btn btn-secondary"
                                style={{
                                  fontSize: "11px",
                                  padding: "5px 10px",
                                  width: "100%"
                                }}
                                onClick={() => {
                                  setSelectedSubmissionForRemark(sub);
                                  setShowRemarkModal(true);
                                }}
                              >
                                + Add Remark
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          {sub.versions && sub.versions.length > 0 ? (
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              {sub.versions[sub.versions.length - 1]?.driveLink && (
                                <a
                                  href={sub.versions[sub.versions.length - 1].driveLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Click to open Google Drive file"
                                  style={{ fontSize: '18px', cursor: 'pointer' }}
                                >
                                  📁
                                </a>
                              )}
                              {sub.versions[sub.versions.length - 1]?.fileUrl && (
                                <a
                                  href={sub.versions[sub.versions.length - 1].fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Click to open uploaded file"
                                  style={{ fontSize: '18px', cursor: 'pointer' }}
                                >
                                  📥
                                </a>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#999', fontSize: '12px' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {
            submissionPagination.pages > 1 && (
              <div style={{
                marginTop: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px"
              }}>
                <div style={{ fontSize: "14px", color: "#666" }}>
                  Showing {submissions.length} of {submissionPagination.total} submissions
                  {submissionPagination.pages > 1 && ` | Page ${submissionPagination.current} of ${submissionPagination.pages}`}
                </div>
                {submissionPagination.current < submissionPagination.pages && (
                  <button
                    className="btn btn-primary"
                    onClick={() => fetchSubmissionsForEvent(selectedEvent._id, submissionPage + 1)}
                    disabled={isLoadingMoreSubmissions}
                  >
                    {isLoadingMoreSubmissions ? "⏳ Loading..." : `📥 Load More (${submissionPagination.limit} submissions)`}
                  </button>
                )}
              </div>
            )
          }
        </div >
      )
      }

      {
        !selectedEvent && events.length === 0 ? (
          <div className="card empty-state">
            <h3>❌ No Timeline Events</h3>
            <p>Create timeline events for Abstract Review, PRC-1, PRC-2, etc.</p>
          </div>
        ) : !selectedEvent ? (
          <div className="timeline-container">
            {events.map((event, idx) => (
              <div
                key={event._id}
                className="card timeline-event"
                style={{ borderLeft: "4px solid #667eea", marginBottom: "15px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "18px",
                        marginBottom: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          background: "#667eea",
                          color: "white",
                          borderRadius: "50%",
                          width: "36px",
                          height: "36px",
                          minWidth: "36px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "bold",
                          fontSize: "16px",
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: '350px' }}>
                        <h3 style={{ margin: '0 0 4px 0', wordBreak: 'break-word', lineHeight: '1.4', fontSize: '17px', fontWeight: '700' }}>{event.title}</h3>
                        <div className="title-badges" style={{ marginBottom: '4px' }}>
                          {getStatusBadge(event.deadline)}
                        </div>
                        <p style={{ color: "#666", margin: "0", lineHeight: '1.5', fontSize: '13px' }}>
                          {event.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setSelectedEvent(event)}
                    >
                      👥 View Teams
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleEdit(event)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(event._id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "12px",
                    marginTop: "12px",
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    lineHeight: '1.5',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', marginBottom: '3px' }}>📅 Deadline:</strong>
                    <span style={{ fontSize: '13px', lineHeight: '1.5', color: '#4a5568' }}>
                      {new Date(event.deadline).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', marginBottom: '3px' }}>🎯 Max Marks:</strong>
                    <span style={{ fontSize: '13px', lineHeight: '1.5', color: '#4a5568' }}>{event.maxMarks}</span>
                  </div>
                  <div>
                    <strong style={{ fontSize: '13px', display: 'block', marginBottom: '3px' }}>📋 Requirements:</strong>
                    <span style={{ fontSize: "12px", color: "#4a5568", lineHeight: '1.5' }}>
                      {event.submissionRequirements || "Not specified"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null
      }

      {/* Expanded Guide Feedback Modal */}
      {
        expandedFeedbackSubmission && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
            onClick={() => setExpandedFeedbackSubmission(null)}
          >
            <div
              className="card"
              style={{
                width: "90%",
                maxWidth: "600px",
                maxHeight: "80vh",
                overflow: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h3>💬 Guide's Feedback</h3>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#999",
                  }}
                  onClick={() => setExpandedFeedbackSubmission(null)}
                >
                  ×
                </button>
              </div>
              {(() => {
                const submission = submissions.find(
                  (s) => s._id === expandedFeedbackSubmission
                );
                if (!submission?.comments?.length) return null;

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {submission.comments.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "#e8f4f8",
                          padding: "12px",
                          borderRadius: "8px",
                          borderLeft: "3px solid #0ea5e9",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <strong style={{ color: "#0c4a6e" }}>
                            👨‍🏫 {c.guideId?.name || "Guide"}
                          </strong>
                          <small style={{ color: "#64748b" }}>
                            {new Date(c.createdAt).toLocaleDateString("en-IN", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </small>
                        </div>
                        <p
                          style={{
                            margin: 0,
                            color: "#0c4a6e",
                            fontSize: "14px",
                            lineHeight: "1.6",
                            whiteSpace: "pre-wrap",
                            wordWrap: "break-word",
                          }}
                        >
                          {c.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <button
                className="btn btn-secondary"
                onClick={() => setExpandedFeedbackSubmission(null)}
                style={{ width: "100%", marginTop: "20px" }}
              >
                Close
              </button>
            </div>
          </div>
        )
      }

      {/* Expanded Remark Modal */}
      {
        expandedRemarkSubmission && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
          >
            <div
              className="card"
              style={{
                width: "90%",
                maxWidth: "600px",
                maxHeight: "80vh",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h3>📝 Full Feedback</h3>
                <button
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#999",
                  }}
                  onClick={() => setExpandedRemarkSubmission(null)}
                >
                  ×
                </button>
              </div>
              {(() => {
                const submission = submissions.find(
                  (s) => s._id === expandedRemarkSubmission
                );
                const remarks = submission?.adminRemarks || [];

                return (
                  <div style={{ maxHeight: "400px", overflowY: "auto", marginBottom: "20px", paddingRight: "5px" }}>
                    {remarks.length > 0 ? (
                      remarks.map((r, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: "#f8f9fa",
                            padding: "15px",
                            borderRadius: "8px",
                            marginBottom: "12px",
                            borderLeft: "4px solid #667eea",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#667eea",
                              fontWeight: "bold",
                              marginBottom: "8px",
                              display: "flex",
                              justifyContent: "space-between"
                            }}
                          >
                            <span>📅 {new Date(r.createdAt).toLocaleDateString("en-IN", {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}</span>
                            {r.adminId?.name && <span>👤 {r.adminId.name}</span>}
                          </div>
                          <p
                            style={{
                              color: "#2d3748",
                              fontSize: "14px",
                              lineHeight: "1.6",
                              whiteSpace: "pre-wrap",
                              wordWrap: "break-word",
                              margin: 0
                            }}
                          >
                            {r.remark}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p style={{ textAlign: "center", color: "#999", padding: "20px" }}>No remarks found for this submission.</p>
                    )}
                  </div>
                );
              })()}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const sub = submissions.find(s => s._id === expandedRemarkSubmission);
                    if (sub) {
                      setSelectedSubmissionForRemark(sub);
                      setShowRemarkModal(true);
                      setExpandedRemarkSubmission(null);
                    }
                  }}
                  style={{ flex: 1 }}
                >
                  + Add Another Remark
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setExpandedRemarkSubmission(null)}
                  style={{ flex: 1 }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Admin Remark Modal */}
      {
        showRemarkModal && selectedSubmissionForRemark && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div className="card" style={{ width: "90%", maxWidth: "500px" }}>
              <h3>Add Admin Remark</h3>
              <div
                style={{
                  marginBottom: "15px",
                  padding: "10px",
                  background: "#f0f0f0",
                  borderRadius: "5px",
                }}
              >
                <strong>Team:</strong>{" "}
                {
                  batches.find(
                    (b) =>
                      b._id ===
                      (typeof selectedSubmissionForRemark.batchId === "string"
                        ? selectedSubmissionForRemark.batchId
                        : selectedSubmissionForRemark.batchId?._id)
                  )?.teamName
                }
              </div>
              <textarea
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                placeholder="Enter your remark here..."
                rows={5}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "15px",
                  borderRadius: "5px",
                  border: "1px solid #ddd",
                }}
              />
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      if (!remarkText.trim()) {
                        alert("Please enter a remark");
                        return;
                      }
                      await api.addAdminRemark(
                        selectedSubmissionForRemark._id,
                        remarkText
                      );
                      setRemarkText("");
                      setShowRemarkModal(false);
                      setSelectedSubmissionForRemark(null);
                      fetchEvents();
                    } catch (error) {
                      console.error("Error adding remark:", error);
                    }
                  }}
                >
                  Save Remark
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setRemarkText("");
                    setShowRemarkModal(false);
                    setSelectedSubmissionForRemark(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );

  // Download report as CSV function
  async function downloadReportAsCSV() {
    if (!selectedEvent || submissions.length === 0) {
      alert("No submissions to download");
      return;
    }

    // Filter submissions for current event
    const eventSubmissions = submissions.filter((sub) => {
      const subEventId =
        typeof sub.timelineEventId === "string"
          ? sub.timelineEventId
          : sub.timelineEventId?._id;
      return subEventId === selectedEvent._id;
    });

    if (eventSubmissions.length === 0) {
      alert("No submissions to download");
      return;
    }

    // Prepare CSV data
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `Timeline Event: ${selectedEvent.title}\n`;
    csvContent += `Generated on: ${new Date().toLocaleDateString("en-IN")}\n`;
    csvContent += `Deadline: ${new Date(
      selectedEvent.deadline
    ).toLocaleDateString("en-IN")}\n`;
    csvContent += `Max Marks: ${selectedEvent.maxMarks}\n\n`;

    // Header row
    const headers = ALL_COLUMNS.filter((col) =>
      selectedColumns.includes(col.key)
    ).map((h) => `"${h.label}"`);
    csvContent += headers.join(",") + "\n";

    // Data rows
    eventSubmissions.forEach((sub) => {
      const batchId =
        typeof sub.batchId === "string" ? sub.batchId : sub.batchId?._id;
      const batch = batches.find((b) => b._id === batchId);
      const adminRemarksText =
        sub.adminRemarks?.length > 0
          ? sub.adminRemarks.map(r => r.remark.replace(/"/g, '""')).join("; ")
          : "N/A";
      const guideFeedbackText =
        sub.comments?.length > 0
          ? sub.comments.map(c => c.comment.replace(/"/g, '""')).join("; ")
          : "N/A";
      const leaderRollNo = batch?.leaderStudentId?.rollNumber || "N/A";
      const otherMembers =
        batch?.teamMembers?.length > 0
          ? batch.teamMembers.map((m) => m.rollNo).join("; ")
          : "";
      const allMembers = otherMembers
        ? `${leaderRollNo}; ${otherMembers}`
        : leaderRollNo;
      const coe = batch?.problemId?.coeId?.name || batch?.coeId?.name || "N/A";
      const guide = batch?.guideId?.name || "Not Assigned";
      const rowData = {
        teamName: batch?.teamName || "Unknown",
        teamMembers: allMembers,
        year: batch?.year || "N/A",
        branch: batch?.branch || "N/A",
        section: batch?.section || "N/A",
        coe,
        guide,
        marks:
          sub.marks !== null ? `${sub.marks}/${selectedEvent.maxMarks}` : "N/A",
        guidesFeedback: `"${guideFeedbackText}"`,
        adminRemarks: `"${adminRemarksText}"`,
      };
      const row = ALL_COLUMNS.filter((col) =>
        selectedColumns.includes(col.key)
      ).map((col) => rowData[col.key]);
      csvContent += row.join(",") + "\n";
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${selectedEvent.title}_report_${new Date().toISOString().split("T")[0]
      }.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default TimelineManagement;

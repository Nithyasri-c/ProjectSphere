import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const MEETING_COUNT = 6;
const INTERVAL_DAYS = 15;
const STORAGE_VERSION = 1;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function getLocalISODate(date) {
  // Returns YYYY-MM-DD in the user's local timezone (not UTC).
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseLocalISODate(isoDate) {
  // Expects YYYY-MM-DD.
  const [y, m, d] = (isoDate || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDaysToLocalISODate(isoDate, days) {
  const parsed = parseLocalISODate(isoDate);
  if (!parsed) return null;
  const next = new Date(parsed);
  next.setDate(next.getDate() + days);
  return getLocalISODate(next);
}

function isValidISODate(iso) {
  if (typeof iso !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && !!parseLocalISODate(iso);
}

function buildDefaultPlan() {
  const start = startOfDay(new Date());
  const scheduledDates = Array.from({ length: MEETING_COUNT }, (_, i) => addDaysToLocalISODate(getLocalISODate(start), i * INTERVAL_DAYS));
  const completed = Array.from({ length: MEETING_COUNT }, () => false);
  const remarks = Array.from({ length: MEETING_COUNT }, () => '');
  return { scheduledDates, completed, remarks, updatedAt: Date.now() };
}

function normalizePlan(raw) {
  if (!raw || typeof raw !== 'object') return buildDefaultPlan();

  const scheduledDates = Array.isArray(raw.scheduledDates) ? raw.scheduledDates : null;
  const completed = Array.isArray(raw.completed) ? raw.completed : null;
  if (!scheduledDates || !completed || scheduledDates.length !== MEETING_COUNT || completed.length !== MEETING_COUNT) {
    return buildDefaultPlan();
  }

  const cleanedScheduledDates = scheduledDates.map((d) => (isValidISODate(d) ? d : null));
  if (cleanedScheduledDates.some((d) => d === null)) return buildDefaultPlan();

  const cleanedCompleted = completed.map((c) => c === true);
  
  const remarks = Array.isArray(raw.remarks) ? raw.remarks : Array.from({ length: MEETING_COUNT }, () => '');
  const cleanedRemarks = remarks.map(r => typeof r === 'string' ? r : '').slice(0, MEETING_COUNT);
  while (cleanedRemarks.length < MEETING_COUNT) cleanedRemarks.push('');

  return { scheduledDates: cleanedScheduledDates, completed: cleanedCompleted, remarks: cleanedRemarks, updatedAt: Number(raw.updatedAt) || Date.now() };
}

export default function GuideMeetings() {
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [rescheduleDraftISO, setRescheduleDraftISO] = useState('');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [editingRemarkIndex, setEditingRemarkIndex] = useState(null);
  const [remarkDraft, setRemarkDraft] = useState('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = user?.id;
    if (!id) {
      setPlan(null);
      setRescheduleOpen(false);
      return;
    }

    const key = `projectSphereMeetings_v${STORAGE_VERSION}_${id}`;
    try {
      const raw = localStorage.getItem(key);
      const nextPlan = normalizePlan(raw ? JSON.parse(raw) : null);
      setPlan(nextPlan);
    } catch (e) {
      setPlan(buildDefaultPlan());
    }
  }, [user?.id]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const today = useMemo(() => startOfDay(now), [now]);

  const allCompleted = useMemo(() => {
    if (!plan) return false;
    return plan.completed.every(c => c === true);
  }, [plan]);

  const generateStatusForm = () => {
    if (!plan) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(33, 33, 33);
    doc.text("Guide Meetings Status Form", 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 14, 32);
    if (user?.name) {
      doc.text(`Guide Name: ${user.name}`, 14, 40);
    }
  
    const tableData = [];
    for (let i = 0; i < MEETING_COUNT; i++) {
      const scheduledISO = plan.scheduledDates[i];
      const scheduledDate = parseLocalISODate(scheduledISO);
      const scheduledLabel = scheduledDate
        ? scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : scheduledISO;
        
      tableData.push([
        i + 1,
        plan.remarks[i] || 'No remark',
        scheduledLabel
      ]);
    }
  
    doc.autoTable({
      startY: user?.name ? 50 : 42,
      head: [['S.No', 'Remark', 'Date']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] },
      styles: { fontSize: 11, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40, halign: 'center' }
      }
    });
  
    const finalY = doc.lastAutoTable.finalY || 50;
    doc.setFontSize(12);
    doc.setTextColor(33, 33, 33);
    doc.text("Guide Signature", 14, finalY + 30);
    doc.line(14, finalY + 45, 60, finalY + 45);
  
    doc.save("Status Form.pdf");
  };

  const persistPlan = (nextPlan) => {
    const id = user?.id;
    if (!id) return;
    const key = `projectSphereMeetings_v${STORAGE_VERSION}_${id}`;
    try {
      localStorage.setItem(key, JSON.stringify(nextPlan));
    } catch (e) {
      // Non-fatal: UI still works in-memory.
    }
  };

  const firstIncompleteIndex = useMemo(() => {
    if (!plan) return -1;
    return plan.completed.findIndex((c) => c !== true);
  }, [plan]);

  const activeMeetingIndex = useMemo(() => {
    if (!plan) return null;
    if (firstIncompleteIndex < 0) return null;

    const scheduledISO = plan.scheduledDates[firstIncompleteIndex];
    const scheduled = parseLocalISODate(scheduledISO);
    if (!scheduled) return null;

    return scheduled.getTime() <= today.getTime() ? firstIncompleteIndex : null;
  }, [plan, firstIncompleteIndex, today]);

  const handleMarkCompleted = (idx) => {
    if (!plan) return;
    if (idx !== activeMeetingIndex) return;
    if (plan.completed[idx] === true) return;

    const nextCompleted = [...plan.completed];
    nextCompleted[idx] = true;
    const nextPlan = { ...plan, completed: nextCompleted, updatedAt: Date.now() };
    setPlan(nextPlan);
    persistPlan(nextPlan);
  };

  const openReschedule = (idx) => {
    if (!plan) return;
    if (idx !== activeMeetingIndex) return;
    if (plan.completed[idx] === true) return;
    setRescheduleDraftISO(plan.scheduledDates[idx]);
    setRescheduleOpen(true);
  };

  const handleCancelReschedule = () => {
    setRescheduleOpen(false);
    setRescheduleDraftISO('');
  };

  const handleSaveReschedule = (idx) => {
    if (!plan) return;
    if (idx !== activeMeetingIndex) return;
    const newISO = rescheduleDraftISO;
    if (!isValidISODate(newISO)) return;

    const nextScheduled = [...plan.scheduledDates];
    nextScheduled[idx] = newISO;
    for (let j = idx + 1; j < MEETING_COUNT; j += 1) {
      nextScheduled[j] = addDaysToLocalISODate(newISO, (j - idx) * INTERVAL_DAYS);
    }

    const nextPlan = { ...plan, scheduledDates: nextScheduled, updatedAt: Date.now() };
    setPlan(nextPlan);
    persistPlan(nextPlan);
    setRescheduleOpen(false);
    setRescheduleDraftISO('');
  };

  const openRemark = (idx) => {
    if (!plan) return;
    setEditingRemarkIndex(idx);
    setRemarkDraft(plan.remarks[idx] || '');
  };

  const cancelRemark = () => {
    setEditingRemarkIndex(null);
    setRemarkDraft('');
  };

  const saveRemark = (idx) => {
    if (!plan) return;
    const nextRemarks = [...plan.remarks];
    nextRemarks[idx] = remarkDraft;
    const nextPlan = { ...plan, remarks: nextRemarks, updatedAt: Date.now() };
    setPlan(nextPlan);
    persistPlan(nextPlan);
    setEditingRemarkIndex(null);
    setRemarkDraft('');
  };

  if (!plan) {
    return (
      <div className="tab-content">
        <div className="card empty-state">
          <h3>Loading meetings...</h3>
          <p>Preparing your meeting schedule.</p>
        </div>
      </div>
    );
  }

  if (!user?.id) {
    return (
      <div className="card empty-state">
        <h3>Please log in</h3>
        <p>Meeting progress is tied to your guide profile.</p>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <h2>📅 Meetings</h2>
        <div style={{ color: '#666', fontSize: '13px' }}>
          Only one meeting is active at a time. Dates are locked except via rescheduling the active incomplete meeting.
        </div>
      </div>

      <div className="card" style={{ marginTop: '15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: '10px', alignItems: 'center' }}>
          <div style={{ fontWeight: '700', color: '#444' }}>Meeting</div>
          <div style={{ fontWeight: '700', color: '#444' }}>Scheduled Date</div>
          <div style={{ fontWeight: '700', color: '#444' }}>Status</div>
        </div>

        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {Array.from({ length: MEETING_COUNT }, (_, idx) => {
            const isCompleted = plan.completed[idx] === true;
            const isActive = idx === activeMeetingIndex;
            const scheduledISO = plan.scheduledDates[idx];
            const scheduledDate = parseLocalISODate(scheduledISO);
            const scheduledLabel = scheduledDate
              ? scheduledDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
              : scheduledISO;

            const statusBadgeStyle = (() => {
              if (isCompleted) return { background: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' };
              if (isActive) return { background: '#dbeafe', color: '#1e3a8a', border: '1px solid #bfdbfe' };
              return { background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' };
            })();

            const canReschedule = isActive && !isCompleted;

            return (
              <div
                key={idx}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 200px 200px',
                  gap: '10px',
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  opacity: !isActive && !isCompleted ? 0.95 : 1
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ fontWeight: '800', color: '#111827' }}>Meeting {idx + 1}</div>
                  <div style={{ color: '#6b7280', fontSize: '12px' }}>
                    {isCompleted ? 'Completed' : isActive ? 'Current active meeting' : 'Locked until its scheduled date'}
                  </div>
                </div>

                <div style={{ fontWeight: '700', color: '#374151' }}>{scheduledLabel}</div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: '999px',
                      width: 'fit-content',
                      ...statusBadgeStyle
                    }}
                  >
                    <span>{isCompleted ? '✅' : isActive ? '⏳' : '🔒'}</span>
                    <span style={{ fontWeight: 700 }}>
                      {isCompleted ? 'Completed' : isActive ? 'Active' : 'Locked'}
                    </span>
                  </div>

                  {!isCompleted && isActive && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" onClick={() => handleMarkCompleted(idx)}>
                        ✔ Mark Completed
                      </button>
                      <button className="btn btn-secondary" onClick={() => openReschedule(idx)}>
                        🗓️ Reschedule
                      </button>
                    </div>
                  )}

                  {isCompleted && (
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary" onClick={() => openRemark(idx)}>
                        📝 {plan.remarks[idx] ? 'Edit Remark' : 'Add Remark'}
                      </button>
                    </div>
                  )}
                </div>

                {rescheduleOpen && canReschedule && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ marginTop: '5px', padding: '12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                        Reschedule Meeting {idx + 1}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
                        <div className="form-group">
                          <label style={{ display: 'block', marginBottom: '6px' }}>New scheduled date</label>
                          <input
                            type="date"
                            value={rescheduleDraftISO}
                            onChange={(e) => setRescheduleDraftISO(e.target.value)}
                            style={{ padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e0' }}
                          />
                        </div>
                        <button className="btn btn-primary" onClick={() => handleSaveReschedule(idx)} disabled={!isValidISODate(rescheduleDraftISO)}>
                          Save & Lock Future Dates
                        </button>
                        <button className="btn btn-secondary" onClick={handleCancelReschedule}>
                          Cancel
                        </button>
                      </div>
                      <div style={{ marginTop: '10px', color: '#64748b', fontSize: '12px' }}>
                        Future meeting dates (next meetings) will be auto-adjusted to keep a {INTERVAL_DAYS}-day interval.
                      </div>
                    </div>
                  </div>
                )}

                {plan.remarks[idx] && editingRemarkIndex !== idx && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '5px', padding: '12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: '700', color: '#444', marginBottom: '4px' }}>Remark:</div>
                    <div style={{ color: '#333', whiteSpace: 'pre-wrap' }}>{plan.remarks[idx]}</div>
                  </div>
                )}

                {editingRemarkIndex === idx && (
                  <div style={{ gridColumn: '1 / -1', marginTop: '5px', padding: '12px', borderRadius: '10px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>
                      {plan.remarks[idx] ? 'Edit Remark' : 'Add Remark'} for Meeting {idx + 1}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <textarea
                        value={remarkDraft}
                        onChange={(e) => setRemarkDraft(e.target.value)}
                        placeholder="Type short notes or comments about this meeting..."
                        style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                      />
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn btn-primary" onClick={() => saveRemark(idx)}>Save Remark</button>
                        <button className="btn btn-secondary" onClick={cancelRemark}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', padding: '0 5px' }}>
        <button 
          className="btn btn-primary" 
          onClick={allCompleted ? generateStatusForm : undefined} 
          disabled={!allCompleted}
          style={{ 
            padding: '12px 24px', 
            fontSize: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            backgroundColor: allCompleted ? '#10b981' : '#e2e8f0',
            borderColor: allCompleted ? '#10b981' : '#e2e8f0',
            color: allCompleted ? '#fff' : '#94a3b8',
            cursor: allCompleted ? 'pointer' : 'not-allowed',
            boxShadow: allCompleted ? '0 4px 6px -1px rgba(16, 185, 129, 0.2)' : 'none',
            transition: 'all 0.3s ease'
          }}
          title={!allCompleted ? "Complete all meetings to generate form" : "Generate Status Form"}
        >
          📄 Generate Status Form
        </button>
      </div>
    </div>
  );
}


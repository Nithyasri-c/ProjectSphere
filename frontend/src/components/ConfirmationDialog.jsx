import React from 'react';

function ConfirmationDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', type = 'info', showCancel = true }) {
  if (!isOpen) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'success': return '#d4edda';
      case 'warning': return '#fff3cd';
      case 'danger': return '#f8d7da';
      case 'error': return '#f8d7da';
      default: return '#d1ecf1';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success': return '#c3e6cb';
      case 'warning': return '#ffeaa7';
      case 'danger': return '#f5c6cb';
      case 'error': return '#f5c6cb';
      default: return '#bee5eb';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'danger': return '#dc3545';
      case 'error': return '#dc3545';
      default: return '#17a2b8';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        minWidth: '320px',
        maxWidth: '450px',
        width: '100%',
        overflow: 'hidden',
        animation: 'modalScale 0.2s ease-out',
      }}>
        <style>
          {`
            @keyframes modalScale {
              from { opacity: 0; transform: scale(0.95) translateY(10px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
          `}
        </style>
        <div style={{
          backgroundColor: getBackgroundColor(),
          borderBottom: `3px solid ${getBorderColor()}`,
          padding: '20px',
        }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '18px', fontWeight: '600' }}>{title}</h2>
        </div>

        <div style={{
          padding: '20px',
          color: '#555',
          lineHeight: '1.6',
        }}>
          {message}
        </div>

        <div style={{
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          borderTop: '1px solid #eee',
        }}>
          {showCancel && (
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#ebebeb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#f5f5f5'}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              backgroundColor: getButtonColor(),
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => e.target.style.opacity = '0.9'}
            onMouseLeave={(e) => e.target.style.opacity = '1'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;

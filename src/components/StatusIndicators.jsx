import React from 'react';

export default function StatusIndicators({ mesEnabled, isRunning }) {
  return (
    <div className="status-container glass-panel">
      <div className="status-item">
        <span className="metric-label">MES Status</span>
        <div className="status-indicator">
          <span className={`dot ${mesEnabled ? 'active' : 'warning'}`}></span>
          {mesEnabled ? 'Online (Controlling)' : 'Offline (Monitoring)'}
        </div>
      </div>
      
      <div className="status-item">
        <span className="metric-label">Conveyor</span>
        <div className="status-indicator">
          <span className={`dot ${isRunning ? 'active' : 'inactive'}`}></span>
          {isRunning ? 'Running' : 'Stopped'}
        </div>
      </div>
    </div>
  );
}

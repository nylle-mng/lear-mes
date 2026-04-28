import React from 'react';
import { Activity, Clock, AlertTriangle, Package } from 'lucide-react';

export default function MetricsDisplay({ mesEnabled, activeLine, lineState }) {
  const frequency = lineState.taktTime > 0 ? (1 / lineState.taktTime).toFixed(2) : '0.00';

  return (
    <div className="metrics-row">
      <div className="metric-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="metric-label">LINE_{activeLine} Frequency</span>
          <Activity size={16} color="var(--text-muted)" />
        </div>
        <div className="metric-value">
          {frequency}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>HERTZ (HZ)</div>
      </div>
      
      <div className="metric-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="metric-label">LINE_{activeLine} Stops</span>
          <AlertTriangle size={16} color="var(--text-muted)" />
        </div>
        <div className="metric-value">
          {lineState.stopCount.toString().padStart(3, '0')}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>COUNT</div>
      </div>
      
      <div className="metric-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="metric-label">LINE_{activeLine} Downtime</span>
          <Clock size={16} color="var(--text-muted)" />
        </div>
        <div className="metric-value">
          {lineState.downtime.toString().padStart(4, '0')}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SECONDS</div>
      </div>

      <div className="metric-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="metric-label">LINE_{activeLine} Parts</span>
          <Package size={16} color="var(--text-muted)" />
        </div>
        <div className="metric-value" style={{ color: 'var(--status-run)', textShadow: '0 0 20px var(--status-run-dim)' }}>
          {lineState.partsCount.toString().padStart(4, '0')}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>UNITS</div>
      </div>
    </div>
  );
}

import React from 'react';
import { Terminal } from 'lucide-react';

export default function EventLog({ logs }) {
  return (
    <div className="hmi-panel" style={{ width: '100%', flex: 1, minHeight: '200px', maxHeight: '350px' }}>
      <div className="hmi-panel-header">
        <span className="hmi-panel-title">System Event Log</span>
        <Terminal size={16} color="var(--text-muted)" />
      </div>
      
      <div className="hmi-panel-content" style={{ padding: '0.5rem', overflowY: 'auto' }}>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '1rem' }}>
            Waiting for system events...
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {logs.map((log, i) => (
              <li key={i} style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '0.8rem', 
                padding: '0.5rem 1rem',
                borderBottom: '1px solid rgba(255,255,255,0.02)',
                display: 'flex',
                gap: '1rem',
                color: log.type === 'error' ? 'var(--status-stop)' : 
                       log.type === 'success' ? 'var(--status-run)' : 
                       log.type === 'warning' ? '#ffb042' : 'var(--text-muted)'
              }}>
                <span style={{ opacity: 0.6 }}>[{log.time.toLocaleTimeString()}]</span>
                <span>{log.msg}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

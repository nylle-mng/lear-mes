import React from 'react';

export default function ConveyorVisualizer({ mesEnabled, linesState }) {
  const lineIds = Object.keys(linesState);
  const hasAnyFault = lineIds.some(id => linesState[id].activeFault);

  return (
    <div className="hmi-panel" style={{ width: '100%', minHeight: '300px', flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <div className="hmi-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="hmi-panel-title">Multi-Line Conveyor Visualization</span>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {!mesEnabled && (
            <span style={{ fontSize: '0.7rem', color: '#ffb042', border: '1px solid rgba(255,176,66,0.3)', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgba(255,176,66,0.1)' }}>
              READ-ONLY MONITORING
            </span>
          )}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            SECTOR_07
          </div>
        </div>
      </div>
      
      <div className="visualizer-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', alignContent: 'start', padding: '1.5rem', gap: '1.5rem', overflowY: 'auto', flex: 1, maxHeight: '65vh' }}>
        <div className="grid-overlay"></div>
        
        {lineIds.map(id => {
          const line = linesState[id];
          const isMoving = line.isRunning;
          const animDuration = line.taktTime > 0 ? line.taktTime : 1;
          const fault = line.activeFault;

          return (
            <div key={id} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-strong)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', zIndex: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-strong)', paddingBottom: '0.5rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: fault ? 'var(--status-stop)' : (isMoving ? 'var(--text-main)' : 'var(--text-muted)') }}>LINE_{id}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>{line.partsCount} UNITS</span>
              </div>
              <div className="conveyor-track" style={{ height: '24px', padding: '0 15px', position: 'relative' }}>
                <div className="path-line" style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'var(--border-strong)', transform: 'translateY(-50%)' }}></div>
                <div className={`node node-start ${isMoving ? 'active' : ''} ${fault ? 'error-node' : ''}`} style={{ width: '8px', height: '8px', top: '8px' }}></div>
                <div className={`node node-mid ${isMoving ? 'active' : ''} ${fault ? 'error-node' : ''}`} style={{ width: '8px', height: '8px', top: '8px' }}></div>
                <div className={`node node-end ${isMoving ? 'active' : ''} ${fault ? 'error-node' : ''}`} style={{ width: '8px', height: '8px', top: '8px' }}></div>
                {isMoving && !fault && (
                  <div className="item-packet" style={{ animation: `flowMove ${animDuration}s linear infinite`, height: '8px', width: '16px', top: '8px' }}></div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

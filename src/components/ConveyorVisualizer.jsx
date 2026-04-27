import React from 'react';

export default function ConveyorVisualizer({ mesEnabled, linesState }) {
  const getLineData = (id) => {
    const line = linesState[id];
    const isMoving = mesEnabled && line.isRunning;
    const animDuration = line.taktTime > 0 ? line.taktTime : 1;
    return { isMoving, animDuration, fault: line.activeFault };
  };

  const a1 = getLineData('A1');
  const b4 = getLineData('B4');
  const c2 = getLineData('C2');

  const hasAnyFault = a1.fault || b4.fault || c2.fault;

  return (
    <div className="hmi-panel" style={{ width: '100%', minHeight: '300px', flex: 1 }}>
      <div className="hmi-panel-header">
        <span className="hmi-panel-title">Multi-Line Conveyor Visualization</span>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          SECTOR_07
        </div>
      </div>
      
      <div className="visualizer-container" style={{ flexDirection: 'column', padding: '2rem 10%', gap: '2.5rem', justifyContent: 'center' }}>
        <div className="grid-overlay"></div>
        
        {!mesEnabled && !hasAnyFault && (
          <div className="overlay-message">
            <span className="overlay-text">INDEPENDENT MODE</span>
          </div>
        )}

        {/* LINE A1 */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: a1.fault ? 'var(--status-stop)' : 'var(--accent-cyan)' }}>
            <span>LINE_A1 (MAIN ASSEMBLY)</span>
            {a1.fault && <span style={{ animation: 'pulse-dot 1s infinite' }}>FAULT ACTIVE</span>}
          </div>
          <div className="conveyor-path" style={{ width: '100%', height: '30px' }}>
            <div className="path-line"></div>
            <div className={`node node-start ${a1.isMoving ? 'active' : ''} ${a1.fault ? 'error-node' : ''}`}></div>
            <div className={`node node-mid ${a1.isMoving ? 'active' : ''} ${a1.fault ? 'error-node' : ''}`}></div>
            <div className={`node node-end ${a1.isMoving ? 'active' : ''} ${a1.fault ? 'error-node' : ''}`}></div>
            {a1.isMoving && !a1.fault && (
              <div className="item-packet" style={{ animation: `flowMove ${a1.animDuration}s linear infinite` }}></div>
            )}
          </div>
        </div>

        {/* LINE B4 */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: b4.fault ? 'var(--status-stop)' : 'var(--accent-cyan)' }}>
            <span>LINE_B4 (SUB-ASSEMBLY)</span>
            {b4.fault && <span style={{ animation: 'pulse-dot 1s infinite' }}>FAULT ACTIVE</span>}
          </div>
          <div className="conveyor-path" style={{ width: '100%', height: '30px' }}>
            <div className="path-line"></div>
            <div className={`node node-start ${b4.isMoving ? 'active' : ''} ${b4.fault ? 'error-node' : ''}`}></div>
            <div className={`node node-mid ${b4.isMoving ? 'active' : ''} ${b4.fault ? 'error-node' : ''}`}></div>
            <div className={`node node-end ${b4.isMoving ? 'active' : ''} ${b4.fault ? 'error-node' : ''}`}></div>
            {b4.isMoving && !b4.fault && (
              <>
                <div className="item-packet" style={{ animation: `flowMove ${b4.animDuration}s linear infinite`, animationDelay: `-${b4.animDuration * 0.3}s` }}></div>
                <div className="item-packet" style={{ animation: `flowMove ${b4.animDuration}s linear infinite`, animationDelay: `-${b4.animDuration * 0.8}s` }}></div>
              </>
            )}
          </div>
        </div>

        {/* LINE C2 */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: c2.fault ? 'var(--status-stop)' : '#ffb042' }}>
            <span>LINE_C2 (INSPECTION / REWORK)</span>
            {c2.fault && <span style={{ animation: 'pulse-dot 1s infinite' }}>FAULT ACTIVE</span>}
          </div>
          <div className="conveyor-path" style={{ width: '100%', height: '30px' }}>
            <div className="path-line"></div>
            <div className={`node node-start ${c2.isMoving ? 'active' : ''} ${c2.fault ? 'error-node' : ''}`}></div>
            <div className={`node node-mid ${c2.isMoving ? 'active' : ''} ${c2.fault ? 'error-node' : ''}`}></div>
            <div className={`node node-end ${c2.isMoving ? 'active' : ''} ${c2.fault ? 'error-node' : ''}`}></div>
            {c2.isMoving && !c2.fault && (
              <div className="item-packet" style={{ background: '#ffb042', boxShadow: '0 0 10px #ffb042', animation: `flowMove ${c2.animDuration}s linear infinite` }}></div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

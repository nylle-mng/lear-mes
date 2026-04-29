import React from 'react';
import { Play, Square, Settings, AlertOctagon } from 'lucide-react';

export default function ControlPanel({ 
  mesEnabled, 
  setMesEnabled, 
  activeLine, 
  setActiveLine, 
  linesState, 
  updateLine,
  addLog
}) {
  const line = linesState[activeLine];

  const handleStart = () => {
    if (!line.activeFault) {
      updateLine(activeLine, { isRunning: true });
      addLog(`LINE_${activeLine} Drive ACTIVE`, 'success');
    }
  };

  const handleStop = () => {
    if (line.isRunning) {
      updateLine(activeLine, { isRunning: false, stopCount: line.stopCount + 1 });
      addLog(`LINE_${activeLine} Drive STOPPED by user`, 'warning');
    }
  };

  const triggerFault = () => {
    updateLine(activeLine, { activeFault: 'ERR_MOTOR_OVERLOAD', isRunning: false, stopCount: line.stopCount + 1 });
    addLog(`CRITICAL FAULT ON LINE_${activeLine}: ERR_MOTOR_OVERLOAD`, 'error');
  };

  const clearFault = () => {
    updateLine(activeLine, { activeFault: null });
    addLog(`LINE_${activeLine} Fault Acknowledged. Ready to start.`, 'info');
  };

  const handleTaktChange = (val) => {
    updateLine(activeLine, { taktTime: val });
    addLog(`LINE_${activeLine} Takt Time manually updated to ${val}s`, 'info');
  };

  return (
    <div className="hmi-panel" style={{ flex: 1 }}>
      <div className="hmi-panel-header" style={{ borderBottom: 'none' }}>
        <span className="hmi-panel-title">Conveyor Controls</span>
        <Settings size={16} color="var(--text-muted)" />
      </div>

      {/* LINE SELECTOR */}
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)' }}>
        <span className="control-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Select Line:</span>
        <select 
          className="hmi-input" 
          style={{ width: '100%', fontSize: '1rem', padding: '0.4rem', background: 'var(--bg-main)', border: '1px solid var(--border-light)' }}
          value={activeLine}
          onChange={(e) => setActiveLine(e.target.value)}
        >
          {Object.keys(linesState).map(id => (
            <option key={id} value={id}>LINE_{id} {linesState[id].activeFault ? '(FAULT)' : ''}</option>
          ))}
        </select>
      </div>

      <div className="hmi-panel-content" style={{ gap: '1.25rem', paddingTop: '1rem', overflowY: 'auto', flex: 1 }}>
        <div className="control-block">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="control-label">Enable MES Control</span>
            <div className={`status-pill ${mesEnabled ? 'online' : ''}`}>
              <div className="status-dot"></div>
              {mesEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          <label className="hmi-switch" style={{ marginTop: '0.5rem' }}>
            <input 
              type="checkbox" 
              checked={mesEnabled} 
              onChange={(e) => setMesEnabled(e.target.checked)} 
            />
            <div className="switch-track">
              <div className="switch-thumb"></div>
            </div>
            <span style={{ fontSize: '0.85rem', color: mesEnabled ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
              {mesEnabled ? 'MES Active' : 'MES Disabled'}
            </span>
          </label>
        </div>

        {/* Auto Takt Speed Adjuster */}
        <div className="control-block" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)', opacity: !mesEnabled ? 0.5 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="control-label" style={{ color: line.autoTakt ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>Auto Speed Control</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Requires MES Link</span>
            </div>
            <label className="hmi-switch" style={{ gap: '0.5rem' }}>
              <input 
                type="checkbox" 
                checked={line.autoTakt} 
                onChange={(e) => updateLine(activeLine, { autoTakt: e.target.checked })} 
                disabled={!mesEnabled}
              />
              <div className="switch-track" style={{ width: '36px', height: '18px' }}>
                <div className="switch-thumb" style={{ width: '12px', height: '12px', top: '2px', left: '3px', transform: line.autoTakt ? 'translateX(16px)' : 'none' }}></div>
              </div>
            </label>
          </div>

          {line.autoTakt && (
            <>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <span className="control-label" style={{ fontSize: '0.65rem' }}>Target QTY</span>
                  <input 
                    type="number" 
                    className="hmi-input" 
                    style={{ fontSize: '1rem', padding: '0.5rem' }}
                    value={line.targetQuantity}
                    onChange={(e) => updateLine(activeLine, { targetQuantity: Number(e.target.value) })}
                    disabled={!mesEnabled}
                    min="1"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span className="control-label" style={{ fontSize: '0.65rem' }}>Time (Sec)</span>
                  <input 
                    type="number" 
                    className="hmi-input" 
                    style={{ fontSize: '1rem', padding: '0.5rem' }}
                    value={line.shiftDuration}
                    onChange={(e) => updateLine(activeLine, { shiftDuration: Number(e.target.value) })}
                    disabled={!mesEnabled}
                    min="1"
                  />
                </div>
              </div>
              
              {/* Run Progress Bar */}
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>RUN PROGRESS</span>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent-cyan)' }}>
                      {line.partsCount} / {line.targetQuantity} ({(Math.min(line.partsCount / Math.max(line.targetQuantity, 1) * 100, 100)).toFixed(1)}%)
                    </span>
                    <button 
                      onClick={() => updateLine(activeLine, { partsCount: 0 })}
                      style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '0.6rem', padding: '0.2rem 0.4rem', cursor: 'pointer', borderRadius: '3px', transition: 'all 0.2s' }}
                      onMouseOver={(e) => { e.target.style.color = 'var(--text-main)'; e.target.style.borderColor = 'var(--text-main)'; }}
                      onMouseOut={(e) => { e.target.style.color = 'var(--text-muted)'; e.target.style.borderColor = 'var(--border-light)'; }}
                    >
                      RESET
                    </button>
                  </div>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${Math.min(line.partsCount / Math.max(line.targetQuantity, 1) * 100, 100)}%`, 
                    height: '100%', 
                    background: 'var(--accent-cyan)', 
                    boxShadow: '0 0 10px var(--accent-cyan-dim)',
                    transition: 'width 0.3s ease-out'
                  }}></div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="control-block">
          <span className="control-label">Takt Time (Seconds)</span>
          <div className="hmi-input-wrapper">
            <input 
              type="number" 
              className="hmi-input" 
              value={line.taktTime}
              onChange={(e) => handleTaktChange(Number(e.target.value))}
              disabled={line.autoTakt}
              min="0.1"
              step="0.1"
            />
            <span className="input-unit">SEC</span>
          </div>
        </div>

        <div className="control-block">
          <span className="control-label">Line Status</span>
          <div className={`status-pill ${line.activeFault ? 'error' : (line.isRunning ? 'running' : '')}`} style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
            <div className="status-dot"></div>
            {line.activeFault ? 'FAULT_ACTIVE' : (line.isRunning ? 'Running' : 'Stopped')}
          </div>
        </div>

        {/* Fault Controls Section */}
        <div className="control-block" style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="control-label">Diagnostics / Faults</span>
            {line.activeFault && <AlertOctagon size={16} color="var(--status-stop)" />}
          </div>
          
          {line.activeFault && (
            <div style={{ marginTop: '0.5rem', color: 'var(--status-stop)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
              &gt;&gt; {line.activeFault}
            </div>
          )}

          <div className="btn-row" style={{ marginTop: '0.75rem' }}>
            <button 
              className="hmi-btn" 
              onClick={triggerFault}
              disabled={line.activeFault}
              style={{ borderColor: (line.activeFault) ? 'var(--border-light)' : 'rgba(255, 165, 0, 0.4)', color: (line.activeFault) ? 'var(--text-muted)' : '#ffb042' }}
            >
              Sim Fault
            </button>
            <button 
              className="hmi-btn" 
              onClick={clearFault}
              disabled={!line.activeFault}
              style={{ borderColor: (!line.activeFault) ? 'var(--border-light)' : 'rgba(0, 240, 255, 0.4)', color: (!line.activeFault) ? 'var(--text-muted)' : 'var(--accent-cyan)' }}
            >
              Ack / Reset
            </button>
            <button 
              className="hmi-btn" 
              onClick={() => { updateLine(activeLine, { scrapCount: line.scrapCount + 1 }); addLog(`Defect logged on LINE_${activeLine}`, 'warning'); }}
              style={{ borderColor: 'rgba(255, 50, 50, 0.4)', color: '#ff4444' }}
            >
              Log Defect
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem', paddingTop: 0, background: 'var(--bg-panel)', marginTop: 'auto' }}>
        <div className="btn-row">
          <button 
            className="hmi-btn btn-run" 
            onClick={handleStart}
            disabled={line.isRunning || line.activeFault}
          >
            <Play size={16} />
            Start
          </button>
          <button 
            className="hmi-btn btn-stop" 
            onClick={handleStop}
            disabled={!line.isRunning}
          >
            <Square size={16} />
            Stop
          </button>
        </div>
      </div>
    </div>
  );
}

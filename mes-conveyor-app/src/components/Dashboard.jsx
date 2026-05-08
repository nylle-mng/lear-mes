import React from 'react';
import { ActivitySquare, Target, CheckCircle, XCircle, Settings } from 'lucide-react';

export default function Dashboard({ mesEnabled, handleMesToggle, activeLine, setActiveLine, linesState, updateLine, eventLogs, addLog, logDefect, currentUser, ROLES }) {
  const lineIds = Object.keys(linesState);
  const line = linesState[activeLine] || linesState['L01'];
  
  const isRunning = line.isRunning;
  const isFault = line.activeFault;
  const isAuto = line.autoTakt !== false;
  
  // motorSpeed dictates takt time. motorSpeed is in Hz (10-60). takt = 60 / motorSpeed.
  const motorSpeed = line.motorSpeed || 48;
  const sliderValue = motorSpeed;

  const acceptedParts = Math.max(0, line.partsCount - line.scrapCount);
  const rejectRate = line.partsCount > 0 ? ((line.scrapCount / line.partsCount) * 100) : 0;
  const actualOutputRate = isRunning ? Math.round(3600 / (line.taktTime || 1)) : 0;
  const targetOutput = 1200;

  const stations = [
    { id: '101', name: 'Cutting', pos: 'top' },
    { id: '102', name: 'Terminal', pos: 'top' },
    { id: '103', name: 'Assembly 1', pos: 'top' },
    { id: '104', name: 'Assembly 2', pos: 'top' },
    { id: '105', name: 'Tape Wrap', pos: 'top' },
    { id: '106', name: 'Labeling', pos: 'bottom' },
    { id: '107', name: 'Inspection', pos: 'bottom' },
    { id: '108', name: 'Clip', pos: 'bottom' },
    { id: '109', name: 'Kitting', pos: 'bottom' },
    { id: '110', name: 'Testing', pos: 'bottom' },
  ];

  const handleStart = () => { updateLine(activeLine, { isRunning: true, activeFault: null }); addLog(`LINE_${activeLine} START via MES`, 'success'); };
  const handleStop = () => { updateLine(activeLine, { isRunning: false }); addLog(`LINE_${activeLine} STOP via MES`, 'warning'); };

  const handleModeChange = (mode) => {
    const newAuto = mode === 'auto';
    updateLine(activeLine, { autoTakt: newAuto });
    addLog(`LINE_${activeLine} set to ${mode.toUpperCase()} mode`, 'info');
  };

  const handleSpeedChange = (e) => {
    const val = parseFloat(e.target.value);
    const takt = (60 / val).toFixed(1);
    updateLine(activeLine, { motorSpeed: val, taktTime: parseFloat(takt), autoTakt: false });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%', fontFamily: 'var(--font-sans)' }}>
      
      {/* Top Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1rem' }}>
        <MetricCard icon={<ActivitySquare color={isRunning ? 'var(--status-run)' : 'var(--status-stop)'} />} title="LINE STATUS" value={isFault ? 'FAULT' : (isRunning ? 'RUNNING' : 'STOPPED')} color={isFault ? 'var(--status-stop)' : (isRunning ? 'var(--status-run)' : 'var(--text-muted)')} />
        <MetricCard icon={<Target color="var(--accent-cyan)" />} title="TARGET OUTPUT" value={targetOutput} sub="pcs / hr" />
        <MetricCard icon={<ActivitySquare color="#8b5cf6" />} title="ACTUAL OUTPUT" value={actualOutputRate} sub={`${((actualOutputRate/targetOutput)*100).toFixed(1)}% of Target`} />
        <MetricCard icon={<CheckCircle color="var(--status-run)" />} title="GOOD PARTS" value={acceptedParts} sub={`${(100 - rejectRate).toFixed(1)}%`} />
        <MetricCard icon={<XCircle color="var(--status-stop)" />} title="REJECTS" value={line.scrapCount} sub={`${rejectRate.toFixed(1)}%`} />
        
        <div className="hmi-panel" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flexDirection: 'row' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: `4px solid ${line.oee?.oee >= 85 ? 'var(--status-run)' : '#f59e0b'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRightColor: 'var(--border-strong)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'bold' }}>OEE</span>
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{line.oee?.oee?.toFixed(1) || '0.0'}%</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        
        {/* Conveyor Graphics Main Panel */}
        <div className="hmi-panel" style={{ flex: 1 }}>
          <div className="hmi-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="hmi-panel-title">CONVEYOR SYSTEM OVERVIEW - LINE {activeLine}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <select 
                value={activeLine} 
                onChange={e => setActiveLine(e.target.value)}
                style={{ background: '#000', color: 'var(--accent-cyan)', border: '1px solid var(--border-strong)', padding: '0.2rem 0.5rem', fontFamily: 'var(--font-mono)', outline: 'none' }}
              >
                {lineIds.map(id => <option key={id} value={id}>LINE_{id}</option>)}
              </select>
            </div>
          </div>
          <div className="hmi-panel-content" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080a0d', flex: 1, padding: 0 }}>
            
            <div className="grid-overlay"></div>

            <div style={{ width: '100%', maxWidth: '900px', height: '300px', position: 'relative', zIndex: 10 }}>
              <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="none">
                <rect x="50" y="50" width="900" height="200" rx="100" fill="none" stroke="var(--border-strong)" strokeWidth="20" />
                <rect x="50" y="50" width="900" height="200" rx="100" fill="none" stroke="var(--text-muted)" strokeWidth="16" strokeDasharray="10 5" opacity="0.3" />
              </svg>

              <div style={{ position: 'absolute', left: '-20px', top: '135px', background: '#000', border: '1px solid var(--status-run)', color: 'var(--status-run)', padding: '4px 12px', fontFamily: 'var(--font-mono)' }}>START</div>
              <div style={{ position: 'absolute', right: '-20px', top: '135px', background: '#000', border: '1px solid var(--status-stop)', color: 'var(--status-stop)', padding: '4px 12px', fontFamily: 'var(--font-mono)' }}>END</div>

              <div style={{ position: 'absolute', top: '-40px', left: '15%', right: '15%', display: 'flex', justifyContent: 'space-between' }}>
                {stations.filter(s => s.pos === 'top').map(s => <StationNode key={s.id} station={s} line={line} />)}
              </div>

              <div style={{ position: 'absolute', bottom: '-40px', left: '15%', right: '15%', display: 'flex', justifyContent: 'space-between', flexDirection: 'row-reverse' }}>
                {stations.filter(s => s.pos === 'bottom').map(s => <StationNode key={s.id} station={s} line={line} />)}
              </div>

              {isRunning && !isFault && (
                <div style={{
                  position: 'absolute', top: '35px', width: '30px', height: '30px', background: 'var(--accent-cyan)', border: '2px solid #fff',
                  boxShadow: '0 0 10px var(--accent-cyan)',
                  animation: `conveyorMove ${line.taktTime * 2}s linear infinite`, zIndex: 10
                }}></div>
              )}
            </div>
          </div>
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--bg-panel)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--status-run)' }}></div> Running</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'var(--status-stop)' }}></div> Stopped</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#f59e0b' }}></div> Fault</span>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="hmi-panel">
            <div className="hmi-panel-header">
              <span className="hmi-panel-title">VFD SPEED CONTROL</span>
              <Settings size={16} color="var(--text-muted)" />
            </div>
            <div className="hmi-panel-content" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', border: '1px solid var(--border-strong)', background: '#000', cursor: 'pointer' }}>
                <div 
                  onClick={() => handleModeChange('auto')}
                  style={{ flex: 1, textAlign: 'center', padding: '0.5rem', background: isAuto ? 'var(--accent-cyan)' : 'transparent', color: isAuto ? '#000' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>AUTO (MES)</div>
                <div 
                  onClick={() => handleModeChange('manual')}
                  style={{ flex: 1, textAlign: 'center', padding: '0.5rem', background: !isAuto ? 'var(--accent-cyan)' : 'transparent', color: !isAuto ? '#000' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>MANUAL</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Target Output (pcs / hr)</div>
                <div className="hmi-input-wrapper">
                  <input type="text" value={targetOutput} readOnly className="hmi-input" style={{ textAlign: 'center' }} />
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Average Speed Command</div>
                <div style={{ textAlign: 'center', color: isAuto ? 'var(--text-muted)' : 'var(--accent-cyan)', fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>{sliderValue.toFixed(1)} Hz</div>
                <input 
                  type="range" min="10" max="60" step="0.5" 
                  value={sliderValue} 
                  onChange={handleSpeedChange}
                  disabled={isAuto}
                  style={{ width: '100%', accentColor: isAuto ? 'var(--text-muted)' : 'var(--accent-cyan)', opacity: isAuto ? 0.5 : 1, cursor: isAuto ? 'not-allowed' : 'pointer' }} 
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="hmi-btn btn-run" onClick={handleStart}>APPLY</button>
                <button className="hmi-btn btn-stop" onClick={handleStop}>STOP</button>
              </div>
            </div>
          </div>

          <div className="hmi-panel">
            <div className="hmi-panel-header">
              <span className="hmi-panel-title">QUALITY & OVERRIDES</span>
            </div>
            <div className="hmi-panel-content" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button 
                onClick={() => { logDefect(activeLine); addLog(`Manual Defect Logged on LINE_${activeLine}`, 'warning'); }}
                className="hmi-btn" style={{ background: 'var(--status-stop)', color: '#fff', border: 'none', padding: '0.5rem', fontWeight: 'bold' }}>
                LOG REJECT (-1)
              </button>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => { updateLine(activeLine, { isRunning: false, activeFault: 'E-STOP' }); addLog(`Manual E-STOP triggered on LINE_${activeLine}`, 'error'); }}
                  className="hmi-btn" style={{ flex: 1, background: '#f59e0b', color: '#000', border: 'none', padding: '0.5rem', fontWeight: 'bold' }}>
                  FAULT
                </button>
                <button 
                  onClick={() => { updateLine(activeLine, { partsCount: 0, scrapCount: 0 }); addLog(`Reset counters on LINE_${activeLine}`, 'info'); }}
                  className="hmi-btn" style={{ flex: 1, background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-strong)', padding: '0.5rem' }}>
                  RESET
                </button>
              </div>
            </div>
          </div>

          <div className="hmi-panel" style={{ flex: 1 }}>
            <div className="hmi-panel-header">
              <span className="hmi-panel-title">PLC STATUS</span>
            </div>
            <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
              <table style={{ width: '100%', fontSize: '0.75rem', textAlign: 'left', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)' }}>
                <tbody>
                  {stations.slice(0, 5).map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.75rem 0', color: 'var(--text-main)' }}>PLC-CV-{s.id}</td>
                      <td style={{ padding: '0.75rem 0', color: 'var(--status-run)' }}>● OK</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes conveyorMove {
          0% { left: 5%; top: 20px; }
          45% { left: 90%; top: 20px; }
          50% { left: 90%; top: 220px; }
          95% { left: 5%; top: 220px; }
          100% { left: 5%; top: 20px; }
        }
      `}</style>
    </div>
  );
}

function MetricCard({ icon, title, value, sub, color = 'var(--text-main)' }) {
  return (
    <div className="hmi-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {icon}
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>{title}</span>
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: color, fontFamily: 'var(--font-mono)' }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

function StationNode({ station, line }) {
  const isRunning = line.isRunning;
  const isFault = line.activeFault;
  const statusColor = isFault ? 'var(--status-stop)' : (isRunning ? 'var(--status-run)' : 'var(--text-muted)');
  const hz = isRunning ? (line.taktTime ? (60 - line.taktTime).toFixed(1) : '45.0') : '0.0';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>CV-{station.id}</div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{station.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: statusColor, fontWeight: '500' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 5px ${statusColor}` }}></div>
        {isFault ? 'FAULT' : (isRunning ? 'RUN' : 'STOP')}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>{hz} Hz</div>
      <div style={{ width: '2px', height: '40px', background: 'var(--border-strong)', marginTop: station.pos === 'top' ? '0' : '-100px', transform: station.pos === 'bottom' ? 'scaleY(-1)' : 'none' }}></div>
    </div>
  );
}

import React, { useState } from 'react';

export default function Dashboard({ mesEnabled, handleMesToggle, activeLine, setActiveLine, linesState, updateLine, eventLogs, addLog, logDefect, currentUser, ROLES }) {
  const isSupervisor = currentUser?.role.level >= ROLES.SUPERVISOR.level;
  const canLogDefect = currentUser?.role.level >= ROLES.QUALITY.level || isSupervisor;
  const [isRejecting, setIsRejecting] = useState(false);
  const defectCodes = ['SCRATCH/DENT', 'MISSING PART', 'FAILED TEST', 'WRONG COLOR'];
  const lineIds = Object.keys(linesState);
  const currentIndex = lineIds.indexOf(activeLine);
  
  const line = linesState[activeLine];
  const isRunning = line.isRunning;
  const isFault = line.activeFault;
  
  const acceptedParts = Math.max(0, line.partsCount - line.scrapCount);
  const ftqRate = line.partsCount > 0 ? ((acceptedParts / line.partsCount) * 100) : 100;

  const handlePrevLine = () => {
    if (currentIndex > 0) setActiveLine(lineIds[currentIndex - 1]);
    else setActiveLine(lineIds[lineIds.length - 1]);
  };

  const handleNextLine = () => {
    if (currentIndex < lineIds.length - 1) setActiveLine(lineIds[currentIndex + 1]);
    else setActiveLine(lineIds[0]);
  };

  const handleStart = () => { updateLine(activeLine, { isRunning: true, activeFault: null }); addLog(`LINE_${activeLine} START via HMI`, 'success'); };
  const handleStop = () => { updateLine(activeLine, { isRunning: false }); addLog(`LINE_${activeLine} STOP via HMI`, 'warning'); };
  const handleReset = () => { updateLine(activeLine, { partsCount: 0, scrapCount: 0 }); addLog(`Production count reset for LINE_${activeLine}`, 'info'); };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px', background: '#222325', color: '#fff', fontFamily: 'Arial, sans-serif', padding: '20px', display: 'grid', gridTemplateColumns: '150px 1fr 180px', gap: '30px', boxSizing: 'border-box' }}>
      
      {/* LEFT COLUMN: SPEED ADJUST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        {/* Global MES Enable */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', padding: '10px', background: '#333', border: '2px solid #111', boxSizing: 'border-box' }}>
          <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: mesEnabled ? '#0f0' : '#888' }}>
            {mesEnabled ? 'MES ONLINE' : 'MES OFFLINE'}
          </div>
          <button 
            style={{ ...btnStyle, padding: '8px', opacity: isSupervisor ? 1 : 0.5 }}
            onClick={() => handleMesToggle(!mesEnabled)}
            disabled={!isSupervisor}
          >
            {mesEnabled ? 'DISABLE MES' : 'ENABLE MES'}
          </button>
        </div>

        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px', textShadow: '1px 1px 0 #000' }}>
          MANUAL SPEED<br/>ADJUST
        </div>
        <div style={{ background: '#b4b4b4', padding: '10px', width: '80px', height: '300px', border: '3px solid #000', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.5)' }}>
          <span style={{ color: '#000', fontWeight: 'bold', fontSize: '14px', marginBottom: '15px' }}>MAX</span>
          <input 
            type="range" 
            min="1" max="20" step="0.5"
            value={21 - line.taktTime} // invert so max is at top
            onChange={(e) => updateLine(activeLine, { taktTime: 21 - Number(e.target.value) })}
            style={{ writingMode: 'vertical-lr', direction: 'rtl', height: '200px', width: '24px', cursor: isSupervisor && !line.autoTakt ? 'pointer' : 'not-allowed' }}
            disabled={line.autoTakt || !isSupervisor}
          />
          <span style={{ color: '#000', fontWeight: 'bold', fontSize: '14px', marginTop: '15px' }}>MIN</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', background: '#444', padding: '10px', border: '2px solid #000', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>TAKT TIME (SEC)</span>
            <input 
              type="number" 
              value={line.taktTime}
              onChange={(e) => updateLine(activeLine, { taktTime: Number(e.target.value) })}
              style={{ background: '#000', color: '#0f0', border: '2px solid #222', padding: '5px', fontFamily: 'monospace', fontWeight: 'bold', width: '100%', boxSizing: 'border-box' }}
              disabled={line.autoTakt || !isSupervisor}
              min="0.1"
              step="0.1"
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', width: '100%' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: line.autoTakt ? '#00ff00' : '#444', border: '2px solid #000', boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.8)' }}></div>
          <button 
            style={{ ...btnStyle, flex: 1, padding: '10px 5px', fontSize: '10px', opacity: (mesEnabled && isSupervisor) ? 1 : 0.5 }}
            onClick={() => { updateLine(activeLine, { autoTakt: !line.autoTakt }); }}
            disabled={!mesEnabled || !isSupervisor}
          >
            AUTO TAKT<br/>MODE
          </button>
        </div>

        {/* Auto Takt Inputs */}
        {line.autoTakt && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', background: '#444', padding: '10px', border: '2px solid #000', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>TARGET QTY</span>
              <input 
                type="number" 
                value={line.targetQuantity}
                onChange={(e) => updateLine(activeLine, { targetQuantity: Number(e.target.value) })}
                style={{ background: '#000', color: '#0f0', border: '2px solid #222', padding: '5px', fontFamily: 'monospace', fontWeight: 'bold', width: '100%', boxSizing: 'border-box' }}
                disabled={!isSupervisor}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>TIME (SEC)</span>
              <input 
                type="number" 
                value={line.shiftDuration}
                onChange={(e) => updateLine(activeLine, { shiftDuration: Number(e.target.value) })}
                style={{ background: '#000', color: '#0f0', border: '2px solid #222', padding: '5px', fontFamily: 'monospace', fontWeight: 'bold', width: '100%', boxSizing: 'border-box' }}
                disabled={!isSupervisor}
              />
            </div>
          </div>
        )}
      </div>

      {/* CENTER COLUMN: PANELS AND CONVEYOR */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        
        <div style={{ display: 'flex', gap: '30px', width: '100%', justifyContent: 'center' }}>
          {/* SYSTEM STATUS PILL */}
          <div style={pillPanelStyle}>
            <div style={pillTitleStyle}>SYSTEM STATUS</div>
            <div style={pillRowStyle}><span>TARGET TAKT (S)</span> <span>{Number(line.taktTime).toFixed(1)}</span></div>
            <div style={pillRowStyle}><span>DIRECTION</span> <span>FORWARD</span></div>
            <div style={pillRowStyle}><span>CONVEYOR</span> <span>{isFault ? 'FAULTED' : (isRunning ? 'RUNNING' : 'STOPPED')}</span></div>
          </div>

          {/* PROCESSING STATUS PILL */}
          <div style={pillPanelStyle}>
            <div style={pillTitleStyle}>PROCESSING STATUS</div>
            <div style={pillRowStyle}><span>REJECTED</span> <span style={{ color: line.scrapCount > 0 ? '#cc0000' : '#000' }}>{line.scrapCount}</span></div>
            <div style={pillRowStyle}><span>ACCEPTED</span> <span>{acceptedParts}</span></div>
            <div style={pillRowStyle}><span>TOTAL PRODUCTION</span> <span>{line.partsCount}</span></div>
            <div style={{ ...pillRowStyle, marginTop: '5px', paddingTop: '5px', borderTop: '2px solid #555' }}>
              <span>FTQ RATE</span> 
              <span style={{ color: ftqRate < 98 ? '#cc0000' : '#000' }}>{ftqRate.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* 3D CONVEYOR SIMULATION */}
        <div style={{ marginTop: '80px', position: 'relative', width: '100%', height: '220px' }}>
          {/* Back Rail */}
          <div style={{ position: 'absolute', top: '10px', left: '15%', width: '70%', height: '8px', background: '#ccc', borderTop: '2px solid #fff', borderBottom: '2px solid #999' }}></div>
          <div style={{ position: 'absolute', top: '-5px', left: '20%', width: '10px', height: '20px', background: '#fff', borderRadius: '5px' }}></div>
          <div style={{ position: 'absolute', top: '-5px', left: '25%', width: '10px', height: '20px', background: '#fff', borderRadius: '5px' }}></div>
          <div style={{ position: 'absolute', top: '-5px', left: '80%', width: '10px', height: '20px', background: '#fff', borderRadius: '5px' }}></div>

          {/* Belt */}
          <div style={{ 
            position: 'absolute', top: '40px', left: '5%', width: '90%', height: '60px', 
            background: '#111', border: '2px solid #000', transform: 'perspective(400px) rotateX(25deg)',
            boxShadow: '0 10px 15px rgba(0,0,0,0.8)'
          }}>
            {/* Box moving */}
            {isRunning && !isFault && (
               <div style={{
                 position: 'absolute', top: '5px', width: '45px', height: '40px', background: '#e0e0e0', border: '2px solid #555',
                 animation: `moveBox ${line.taktTime}s linear infinite`, zIndex: 10
               }}>
                  {/* Box cross detail */}
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                     <div style={{ position: 'absolute', top: '50%', width: '100%', height: '2px', background: '#999' }}></div>
                     <div style={{ position: 'absolute', left: '50%', width: '2px', height: '100%', background: '#999' }}></div>
                  </div>
               </div>
            )}
          </div>
          {/* Front Rail */}
          <div style={{ position: 'absolute', top: '105px', left: '10%', width: '80%', height: '6px', background: '#ccc', borderTop: '2px solid #fff', borderBottom: '2px solid #999', zIndex: 20 }}></div>
          
          {/* Legs */}
          <div style={{ position: 'absolute', top: '110px', left: '15%', width: '4px', height: '70px', background: '#888', zIndex: 5 }}></div>
          <div style={{ position: 'absolute', top: '110px', left: '35%', width: '4px', height: '70px', background: '#888', zIndex: 5 }}></div>
          <div style={{ position: 'absolute', top: '110px', left: '55%', width: '4px', height: '70px', background: '#888', zIndex: 5 }}></div>
          <div style={{ position: 'absolute', top: '110px', left: '75%', width: '4px', height: '70px', background: '#888', zIndex: 5 }}></div>
          <div style={{ position: 'absolute', top: '110px', left: '90%', width: '4px', height: '70px', background: '#888', zIndex: 5 }}></div>
          
          {/* Support beams */}
          <div style={{ position: 'absolute', top: '150px', left: '15%', width: '75%', height: '3px', background: '#666', zIndex: 4 }}></div>
        </div>

        {/* BOTTOM CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginTop: 'auto', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <span style={{ fontSize: '10px', fontWeight: 'bold' }}>SELECT CONVEYOR</span>
            <select 
              style={{ background: '#b4b4b4', color: '#000', padding: '10px', border: '2px solid #000', fontSize: '16px', fontWeight: 'bold', width: '120px' }}
              value={activeLine}
              onChange={(e) => setActiveLine(e.target.value)}
            >
              {Object.keys(linesState).map(id => <option key={id} value={id}>LINE_{id}</option>)}
            </select>
          </div>

          {/* LCD Display */}
          <div style={{ background: '#111', border: '5px solid #000', padding: '15px 20px', color: '#fff', fontFamily: 'monospace', fontSize: '26px', letterSpacing: '2px', display: 'flex', gap: '25px', boxShadow: 'inset 0 0 10px #000' }}>
            <span style={{ color: '#ccc' }}>JPH:</span>
            <span>{isRunning ? Math.round(3600 / (line.taktTime || 1)) : '0'}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={navBtnStyle} onClick={handlePrevLine}>{"◄|"}</button>
            <button style={navBtnStyle} onClick={handleNextLine}>{"|►"}</button>
          </div>

          <button style={startBtnStyle(isRunning && !isFault)} onClick={handleStart}>START</button>
          <button style={stopBtnStyle(!isRunning || isFault)} onClick={handleStop}>STOP</button>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', paddingTop: '20px' }}>
        
        {/* Progress Bar */}
        {line.autoTakt && (
          <div style={{ width: '100%', background: '#111', padding: '10px', border: '2px solid #444', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px' }}>
              <span>BATCH PROGRESS</span>
              <span style={{ color: '#00ff00' }}>{(Math.min(line.partsCount / Math.max(line.targetQuantity, 1) * 100, 100)).toFixed(1)}%</span>
            </div>
            <div style={{ width: '100%', height: '15px', background: '#222', border: '1px solid #000' }}>
              <div style={{ width: `${Math.min(line.partsCount / Math.max(line.targetQuantity, 1) * 100, 100)}%`, height: '100%', background: '#00cc00', transition: 'width 0.5s' }}></div>
            </div>
          </div>
        )}

        <button style={btnStyle} onClick={handleReset}>RESET TOTAL<br/>PRODUCTION</button>
        <button style={btnStyle} onClick={() => { handleReset(); handleStart(); }}>START NEW<br/>BATCH ?</button>
        
        {isRejecting ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%', marginTop: '10px' }}>
            <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: '#ffaaaa' }}>SELECT DEFECT CODE</div>
            {defectCodes.map(code => (
              <button 
                key={code} 
                style={{ ...btnStyle, background: '#aa0000', color: '#fff', border: '2px solid #ff5555' }}
                onClick={() => {
                  updateLine(activeLine, { activeFault: code, scrapCount: line.scrapCount + 1, isRunning: false });
                  if (logDefect) logDefect(code);
                  addLog(`Defect [${code}] logged on LINE_${activeLine}`, 'error');
                  setIsRejecting(false);
                }}
              >
                {code}
              </button>
            ))}
            <button style={{ ...btnStyle, marginTop: '10px' }} onClick={() => setIsRejecting(false)}>CANCEL</button>
          </div>
        ) : (
          <button 
            style={{ ...btnStyle, color: '#aa0000', border: '2px solid #aa0000', marginTop: '10px', opacity: canLogDefect ? 1 : 0.5 }} 
            onClick={() => setIsRejecting(true)}
            disabled={!canLogDefect}
          >
            LOG NEW<br/>DEFECT
          </button>
        )}
      </div>

      <style>{`
        @keyframes moveBox {
          0% { left: 0%; opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { left: 85%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

const btnStyle = {
  background: '#d0d0d0', border: '2px solid #fff', borderBottomColor: '#555', borderRightColor: '#555',
  color: '#000', padding: '12px 10px', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', cursor: 'pointer',
  width: '100%', textTransform: 'uppercase', lineHeight: '1.4'
};

const navBtnStyle = {
  background: '#d0d0d0', border: '2px solid #fff', borderBottomColor: '#555', borderRightColor: '#555',
  color: '#000', padding: '15px 12px', fontWeight: 'bold', fontSize: '18px', cursor: 'pointer'
};

const pillPanelStyle = {
  background: '#d0d0d0', border: '4px solid #000', borderRadius: '40px', padding: '25px 40px',
  color: '#000', display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '320px',
  boxShadow: 'inset 2px 2px 10px #fff'
};

const pillTitleStyle = { textAlign: 'center', fontWeight: 'bold', fontSize: '15px', marginBottom: '15px', letterSpacing: '1px' };

const pillRowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold' };

const startBtnStyle = (isActive) => ({
  width: '90px', height: '90px', borderRadius: '50%', background: isActive ? '#00cc00' : '#888',
  border: '10px solid #000', color: isActive ? '#000' : '#fff', fontWeight: 'bold', fontSize: '16px',
  cursor: 'pointer', boxShadow: '2px 2px 5px rgba(0,0,0,0.5)', transition: 'background 0.2s'
});

const stopBtnStyle = (isActive) => ({
  width: '90px', height: '90px', borderRadius: '50%', background: isActive ? '#cc0000' : '#888',
  border: '10px solid #000', color: isActive ? '#000' : '#fff', fontWeight: 'bold', fontSize: '16px',
  cursor: 'pointer', boxShadow: '2px 2px 5px rgba(0,0,0,0.5)', transition: 'background 0.2s'
});

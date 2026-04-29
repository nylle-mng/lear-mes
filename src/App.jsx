import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import { LayoutDashboard, Settings2, ActivitySquare, ShieldAlert, CheckCircle, AlertTriangle, TrendingUp, Download, Monitor } from 'lucide-react';
import './index.css';

const generateInitialLines = (count) => {
  const lines = {};
  for (let i = 1; i <= count; i++) {
    const id = `L${i.toString().padStart(2, '0')}`;
    const baseSpeed = 4 + (i % 6); // Realistic variance in speed
    lines[id] = { taktTime: baseSpeed, isRunning: false, stopCount: 0, downtime: 0, operatingTime: 0, partsCount: 0, scrapCount: 0, activeFault: null, autoTakt: false, targetQuantity: 100, shiftDuration: 3600 };
  }
  return lines;
};

const INITIAL_LINES = generateInitialLines(37);

const OEEGauge = ({ oee }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (oee / 100) * circumference;
  const color = oee >= 85 ? 'var(--status-run)' : oee >= 60 ? '#ffb042' : 'var(--status-stop)';

  return (
    <div style={{ position: 'relative', width: '140px', height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={radius} stroke="var(--border-light)" strokeWidth="12" fill="none" />
        <circle cx="70" cy="70" r={radius} stroke={color} strokeWidth="12" fill="none" 
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
          style={{ transition: 'stroke-dashoffset 0.5s ease-out', strokeLinecap: 'round' }} />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '2rem', fontFamily: 'var(--font-mono)', color: color, fontWeight: 'bold' }}>{oee.toFixed(1)}%</span>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>OEE</span>
      </div>
    </div>
  );
};

// Lear-specific Placeholder Pages
const OverviewPage = ({ linesState }) => {
  let totalParts = 0;
  let totalScrap = 0;
  let totalOpTime = 0;
  let totalDownTime = 0;
  let avgPerf = 0;
  let runningLines = 0;

  const lineMetrics = Object.entries(linesState).map(([id, line]) => {
    totalParts += line.partsCount;
    totalScrap += line.scrapCount;
    totalOpTime += line.operatingTime;
    totalDownTime += line.downtime;
    if (line.operatingTime > 0) {
      avgPerf += (line.taktTime * line.partsCount) / line.operatingTime;
      runningLines++;
    }

    const pTime = line.operatingTime + line.downtime;
    const a = pTime > 0 ? line.operatingTime / pTime : 0;
    const p = line.operatingTime > 0 ? (line.taktTime * line.partsCount) / line.operatingTime : 0;
    const q = line.partsCount > 0 ? Math.max(0, line.partsCount - line.scrapCount) / line.partsCount : 0;
    const oee = a * Math.min(p, 1) * q * 100;

    return {
      id,
      family: parseInt(id.substring(1)) <= 15 ? 'Front Seat Frames' : 'Main Body Harness',
      status: line.activeFault ? 'FAULT' : (line.isRunning ? 'RUNNING' : 'STOPPED'),
      statusColor: line.activeFault ? 'var(--status-stop)' : (line.isRunning ? 'var(--status-run)' : 'var(--text-muted)'),
      parts: line.partsCount,
      a: a * 100,
      p: Math.min(p, 1) * 100,
      q: q * 100,
      oee: isNaN(oee) ? 0 : oee
    };
  });

  const plannedTime = totalOpTime + totalDownTime;
  const availability = plannedTime > 0 ? totalOpTime / plannedTime : 0;
  const performance = runningLines > 0 ? avgPerf / runningLines : 0;
  const quality = totalParts > 0 ? Math.max(0, totalParts - totalScrap) / totalParts : 0;
  const globalOee = (availability * Math.min(performance, 1) * quality) * 100;

  const bottlenecks = [...lineMetrics]
    .filter(l => l.parts > 0 || l.status === 'FAULT')
    .sort((a, b) => a.oee - b.oee)
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
        <div className="hmi-panel">
          <div className="hmi-panel-header">
            <span className="hmi-panel-title">Overall Equipment Effectiveness</span>
            <TrendingUp size={16} color="var(--accent-cyan)" />
          </div>
          <div className="hmi-panel-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
             <OEEGauge oee={globalOee || 0} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0 1rem 1rem 1rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            <div style={{ textAlign: 'center' }}><div style={{ color: 'var(--text-muted)' }}>AVAIL</div><div style={{ color: 'var(--text-main)' }}>{(availability*100).toFixed(1)}%</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ color: 'var(--text-muted)' }}>PERF</div><div style={{ color: 'var(--text-main)' }}>{(Math.min(performance, 1)*100).toFixed(1)}%</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ color: 'var(--text-muted)' }}>QUAL</div><div style={{ color: 'var(--text-main)' }}>{(quality*100).toFixed(1)}%</div></div>
          </div>
        </div>

        <div className="hmi-panel">
          <div className="hmi-panel-header">
            <span className="hmi-panel-title">Just-In-Time (JIT) Seating</span>
            <TrendingUp size={16} color="var(--status-run)" />
          </div>
          <div className="hmi-panel-content">
            <div style={{ fontSize: '2.5rem', color: 'var(--status-run)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{1204 + (linesState['L01']?.partsCount || 0)}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Completed Seat Sets (Shift)</div>
          </div>
        </div>
        
        <div className="hmi-panel">
          <div className="hmi-panel-header">
            <span className="hmi-panel-title">E-Systems Output</span>
            <ActivitySquare size={16} color="var(--accent-cyan)" />
          </div>
          <div className="hmi-panel-content">
            <div style={{ fontSize: '2.5rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{8450 + (linesState['L12']?.partsCount || 0)}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Wire Harnesses Assembled</div>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* BOTTLENECKS PANEL */}
        <div className="hmi-panel" style={{ width: '350px', display: 'flex', flexDirection: 'column' }}>
          <div className="hmi-panel-header">
            <span className="hmi-panel-title">Top 5 Bottlenecks</span>
            <AlertTriangle size={16} color="var(--status-stop)" />
          </div>
          <div className="hmi-panel-content" style={{ padding: '0 1.5rem 1.5rem 1.5rem', overflowY: 'auto' }}>
            {bottlenecks.length === 0 ? (
              <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No production data yet.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: 'var(--font-mono)' }}>
                {bottlenecks.map((line, idx) => (
                  <li key={line.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>LINE_{line.id}</div>
                      <div style={{ fontSize: '0.75rem', color: line.statusColor, marginTop: '0.2rem' }}>{line.status}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', color: line.oee < 60 ? 'var(--status-stop)' : '#ffb042' }}>{line.oee.toFixed(1)}%</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>OEE</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ACTIVE LINES TABLE */}
        <div className="hmi-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="hmi-panel-header">
            <span className="hmi-panel-title">Line Performance Details</span>
          </div>
          <div className="hmi-panel-content" style={{ padding: '0 1.5rem 1.5rem 1.5rem', overflowY: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, background: 'var(--bg-panel)', zIndex: 1 }}>
                  <th style={{ padding: '1rem 0' }}>LINE ID</th>
                  <th>PRODUCT FAMILY</th>
                  <th>STATUS</th>
                  <th>AVAIL %</th>
                  <th>PERF %</th>
                  <th>QUAL %</th>
                  <th>OEE %</th>
                </tr>
              </thead>
              <tbody>
                {lineMetrics.map(line => (
                  <tr key={line.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem 0', color: 'var(--text-main)', fontWeight: 'bold' }}>LINE_{line.id}</td>
                    <td>{line.family}</td>
                    <td style={{ color: line.statusColor }}>{line.status}</td>
                    <td style={{ color: line.a < 80 ? 'var(--status-stop)' : 'inherit' }}>{line.a.toFixed(1)}</td>
                    <td style={{ color: line.p < 80 ? 'var(--status-stop)' : 'inherit' }}>{line.p.toFixed(1)}</td>
                    <td style={{ color: line.q < 98 ? 'var(--status-stop)' : 'inherit' }}>{line.q.toFixed(1)}</td>
                    <td style={{ color: line.oee < 85 ? '#ffb042' : 'var(--status-run)', fontWeight: 'bold' }}>{line.oee.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const QualityPage = ({ linesState, eventLogs }) => {
  let totalParts = 0;
  let totalScrap = 0;
  Object.values(linesState).forEach(line => {
    totalParts += line.partsCount;
    totalScrap += line.scrapCount;
  });
  
  const ftq = totalParts > 0 ? ((totalParts - totalScrap) / totalParts) * 100 : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <div className="hmi-panel">
          <div className="hmi-panel-header">
            <span className="hmi-panel-title">First Time Quality (FTQ)</span>
          </div>
          <div className="hmi-panel-content">
            <div style={{ fontSize: '2.5rem', color: ftq >= 98 ? 'var(--status-run)' : (ftq >= 90 ? '#ffb042' : 'var(--status-stop)'), fontFamily: 'var(--font-mono)' }}>{ftq.toFixed(2)}%</div>
          </div>
        </div>
        <div className="hmi-panel">
          <div className="hmi-panel-header">
            <span className="hmi-panel-title">Total Scrap (Shift)</span>
          </div>
          <div className="hmi-panel-content">
            <div style={{ fontSize: '2.5rem', color: totalScrap > 0 ? 'var(--status-stop)' : 'var(--status-run)', fontFamily: 'var(--font-mono)' }}>{totalScrap} Units</div>
          </div>
        </div>
      </div>
      <div className="hmi-panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="hmi-panel-header">
          <span className="hmi-panel-title">Recent Quality Alerts</span>
        </div>
        <div className="hmi-panel-content" style={{ padding: '0 1.5rem 1.5rem 1.5rem', overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            {totalScrap > 0 && (
              <li style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1rem', color: 'var(--status-stop)' }}>
                <AlertTriangle size={18} /> <span>Live Shift: {totalScrap} defects have been logged across active lines.</span>
              </li>
            )}
            {eventLogs.filter(log => log.type === 'error').slice(0, 10).map((log, idx) => (
              <li key={idx} style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1rem', color: 'var(--status-stop)' }}>
                <AlertTriangle size={18} /> <span>[{log.time.toLocaleTimeString()}] - {log.msg}</span>
              </li>
            ))}
            {totalScrap === 0 && eventLogs.filter(log => log.type === 'error').length === 0 && (
              <li style={{ padding: '1.5rem 0', display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
                <CheckCircle size={18} color="var(--status-run)" /> <span style={{ color: 'var(--text-main)' }}>No active quality alerts. Operations nominal.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

const MaintenancePage = ({ linesState }) => {
  const faultedLines = Object.entries(linesState).filter(([id, line]) => line.activeFault);
  const activeLines = Object.entries(linesState).filter(([id, line]) => !line.activeFault && line.isRunning);
  
  return (
    <div className="hmi-panel" style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="hmi-panel-header">
        <span className="hmi-panel-title">Equipment Health & Maintenance</span>
      </div>
      <div className="hmi-panel-content" style={{ padding: '0 1.5rem 1.5rem 1.5rem', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '1rem 0' }}>EQUIPMENT ID</th>
                <th>TYPE</th>
                <th>HEALTH</th>
                <th>NEXT SERVICE</th>
              </tr>
            </thead>
            <tbody>
              {faultedLines.map(([id, line]) => (
                <tr key={id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0', color: 'var(--text-main)' }}>LINE_{id}</td>
                  <td>{parseInt(id.substring(1)) <= 15 ? 'Front Seat Frames' : 'Main Body Harness'}</td>
                  <td style={{ color: 'var(--status-stop)' }}>{line.activeFault}</td>
                  <td>Immediate Inspection</td>
                </tr>
              ))}
              {activeLines.slice(0, 5).map(([id, line]) => (
                <tr key={id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem 0', color: 'var(--text-main)' }}>LINE_{id}</td>
                  <td>{parseInt(id.substring(1)) <= 15 ? 'Front Seat Frames' : 'Main Body Harness'}</td>
                  <td style={{ color: 'var(--status-run)' }}>GOOD ({(Math.random() * 10 + 90).toFixed(0)}%)</td>
                  <td>In {Math.floor(Math.random() * 30 + 5)} Days</td>
                </tr>
              ))}
              {faultedLines.length === 0 && activeLines.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>No equipment running.</td>
                </tr>
              )}
            </tbody>
          </table>
      </div>
    </div>
  );
};

const AndonBoard = ({ linesState, exitAndon }) => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0a0a0a', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '1.5rem 2rem', background: '#111', borderBottom: '2px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#fff', margin: 0, letterSpacing: '4px', fontSize: '2.5rem', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>PLANT FLOOR STATUS</h1>
        <div style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
          <div style={{ color: '#00f0ff', fontSize: '2rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>ANDON_MODE_ACTIVE</div>
          <button onClick={exitAndon} style={{ padding: '0.8rem 1.5rem', background: '#222', color: '#fff', border: '2px solid #555', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '1.2rem', fontWeight: 'bold' }}>EXIT ANDON</button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', padding: '8px', backgroundColor: '#000', overflowY: 'auto' }}>
        {Object.entries(linesState).map(([id, line]) => {
          let bg = '#1a1a1a';
          let textColor = '#555';
          let statusText = 'STOPPED';
          let anim = 'none';

          if (line.activeFault) {
            bg = '#800000';
            textColor = '#fff';
            statusText = 'FAULT';
            anim = 'pulse-red 2s infinite';
          } else if (line.isRunning) {
            bg = '#004d00';
            textColor = '#fff';
            statusText = 'RUNNING';
          }

          return (
            <div key={id} style={{ background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px solid #333', animation: anim, padding: '1rem' }}>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: textColor, fontFamily: 'var(--font-mono)' }}>{id}</div>
              <div style={{ fontSize: '1.5rem', color: textColor, fontWeight: 'bold', marginTop: '0.5rem', letterSpacing: '2px' }}>{statusText}</div>
              {line.isRunning && <div style={{ fontSize: '1.5rem', color: '#00ff00', marginTop: '1rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>QTY: {line.partsCount}</div>}
              {line.activeFault && <div style={{ fontSize: '1.2rem', color: '#ffaaaa', marginTop: '1rem', textAlign: 'center', padding: '0 10px', fontWeight: 'bold' }}>{line.activeFault}</div>}
              {!line.isRunning && !line.activeFault && <div style={{ fontSize: '1.5rem', color: '#555', marginTop: '1rem', fontFamily: 'var(--font-mono)' }}>QTY: {line.partsCount}</div>}
            </div>
          )
        })}
      </div>
      <style>{`
        @keyframes pulse-red {
          0% { background: #800000; box-shadow: inset 0 0 0px #ff0000; }
          50% { background: #cc0000; box-shadow: inset 0 0 20px #ff0000; }
          100% { background: #800000; box-shadow: inset 0 0 0px #ff0000; }
        }
      `}</style>
    </div>
  );
};

function App() {
  const [activePage, setActivePage] = useState('overview');
  const [andonMode, setAndonMode] = useState(false);
  
  // Hosted State
  const [mesEnabled, setMesEnabled] = useState(() => {
    const saved = localStorage.getItem('mes_enabled');
    return saved === 'true';
  });
  const [activeLine, setActiveLine] = useState(() => {
    return localStorage.getItem('mes_activeLine') || 'L01';
  });
  const [linesState, setLinesState] = useState(() => {
    const saved = localStorage.getItem('mes_linesState');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_LINES; }
    }
    return INITIAL_LINES;
  });
  const [eventLogs, setEventLogs] = useState(() => {
    const saved = localStorage.getItem('mes_eventLogs');
    if (saved) {
      try { 
        return JSON.parse(saved).map(log => ({ ...log, time: new Date(log.time) }));
      } catch (e) { return []; }
    }
    return [];
  });

  // Persistence Hooks
  useEffect(() => { localStorage.setItem('mes_enabled', mesEnabled); }, [mesEnabled]);
  useEffect(() => { localStorage.setItem('mes_activeLine', activeLine); }, [activeLine]);
  useEffect(() => { localStorage.setItem('mes_linesState', JSON.stringify(linesState)); }, [linesState]);
  useEffect(() => { localStorage.setItem('mes_eventLogs', JSON.stringify(eventLogs)); }, [eventLogs]);

  const addLog = (msg, type = 'info') => {
    setEventLogs(prev => [{ time: new Date(), msg, type }, ...prev].slice(0, 50));
  };

  useEffect(() => {
    addLog('System initialized. Waiting for MES integration.', 'info');
  }, []);

  const handleMesToggle = (enabled) => {
    setMesEnabled(enabled);
    if (enabled) {
      addLog('MES Link Established. System ONLINE.', 'success');
    } else {
      addLog('MES Control Disabled. Operating in READ-ONLY MONITORING MODE.', 'warning');
      setLinesState(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          next[id].autoTakt = false;
          next[id].taktTime = INITIAL_LINES[id].taktTime; // Revert to slower default manual speeds
        });
        return next;
      });
    }
  };

  // Master Game Loop for physics/downtime simulation
  useEffect(() => {
    const lastPartTime = { A1: Date.now(), B4: Date.now(), C2: Date.now() };
    const lastTimeTick = { A1: Date.now(), B4: Date.now(), C2: Date.now() };

    const interval = setInterval(() => {
      setLinesState(prev => {
        const now = Date.now();
        const next = { ...prev };
        let updated = false;

        Object.keys(next).forEach(id => {
          const line = { ...next[id] };
          
          // 1. Auto Takt calculation
          if (line.autoTakt && line.targetQuantity > 0 && line.shiftDuration > 0) {
            const calcTakt = Number((line.shiftDuration / line.targetQuantity).toFixed(2));
            if (calcTakt !== line.taktTime) {
              line.taktTime = calcTakt;
              updated = true;
            }
          }

          // 2. Time accumulation (1 sec intervals)
          if (now - lastTimeTick[id] >= 1000) {
            if (!line.isRunning) {
              line.downtime += 1;
            } else {
              line.operatingTime += 1;
            }
            lastTimeTick[id] += 1000;
            updated = true;
          }

          // 3. Parts production
          if (line.isRunning && line.taktTime > 0) {
            const taktMs = line.taktTime * 1000;
            if (now - lastPartTime[id] >= taktMs) {
              line.partsCount += 1;
              lastPartTime[id] += taktMs;
              updated = true;
            }
          } else {
            lastPartTime[id] = now;
          }

          next[id] = line;
        });

        return updated ? next : prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []); // Run regardless of mesEnabled to allow persistence

  // Log Parts Milestones
  const prevPartsRef = useRef({});
  useEffect(() => {
    Object.keys(linesState).forEach(id => {
      if (prevPartsRef.current[id] === undefined) {
        prevPartsRef.current[id] = 0;
      }
      const current = linesState[id].partsCount;
      const prev = prevPartsRef.current[id];
      if (current > prev) {
        if (current % 10 === 0) { // Log every 10 parts instead of 5 to avoid spam with 37 lines
           addLog(`LINE_${id} Milestone: ${current} parts completed`, 'success');
        }
        prevPartsRef.current[id] = current;
      }
    });
  }, [linesState]);

  const updateLine = (id, updates) => {
    setLinesState(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  const exportShiftReport = () => {
    let csv = "LINE_ID,PRODUCT_FAMILY,STATUS,PARTS_PRODUCED,SCRAP_COUNT,FTQ_PERCENT,OP_TIME_SEC,DOWNTIME_SEC,AVAIL_PERCENT,PERF_PERCENT,OEE_PERCENT\n";
    
    Object.entries(linesState).forEach(([id, line]) => {
      const family = parseInt(id.substring(1)) <= 15 ? 'Front Seat Frames' : 'Main Body Harness';
      const status = line.activeFault ? 'FAULT' : (line.isRunning ? 'RUNNING' : 'STOPPED');
      
      const pTime = line.operatingTime + line.downtime;
      const a = pTime > 0 ? line.operatingTime / pTime : 0;
      const p = line.operatingTime > 0 ? (line.taktTime * line.partsCount) / line.operatingTime : 0;
      const q = line.partsCount > 0 ? Math.max(0, line.partsCount - line.scrapCount) / line.partsCount : 0;
      const oee = a * Math.min(p, 1) * q * 100;
      const ftq = line.partsCount > 0 ? (Math.max(0, line.partsCount - line.scrapCount) / line.partsCount) * 100 : 100;

      csv += `LINE_${id},"${family}",${status},${line.partsCount},${line.scrapCount},${ftq.toFixed(2)},${line.operatingTime},${line.downtime},${(a*100).toFixed(2)},${(Math.min(p, 1)*100).toFixed(2)},${isNaN(oee) ? 0 : oee.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MES_Shift_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addLog('Shift report generated and downloaded.', 'success');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'conveyor': return (
        <Dashboard 
          mesEnabled={mesEnabled}
          handleMesToggle={handleMesToggle}
          activeLine={activeLine}
          setActiveLine={setActiveLine}
          linesState={linesState}
          updateLine={updateLine}
          eventLogs={eventLogs}
          addLog={addLog}
        />
      );
      case 'overview': return <OverviewPage linesState={linesState} />;
      case 'quality': return <QualityPage linesState={linesState} eventLogs={eventLogs} />;
      case 'maintenance': return <MaintenancePage linesState={linesState} />;
      default: return <OverviewPage linesState={linesState} />;
    }
  };

  return (
    <>
      {andonMode && <AndonBoard linesState={linesState} exitAndon={() => setAndonMode(false)} />}
      <div className="app-container">
        {/* Sidebar Navigation */}
      <div className="app-sidebar">
        <div className="sys-title" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
          <h1 style={{ fontSize: '1.75rem', color: 'var(--accent-cyan)', textShadow: '0 0 10px var(--accent-cyan-dim)' }}>LEAR MES</h1>
          <span className="sys-badge">CORE_OS</span>
        </div>
        
        <nav className="side-nav">
          <button 
            className={`nav-btn ${activePage === 'overview' ? 'active' : ''}`}
            onClick={() => setActivePage('overview')}
          >
            <LayoutDashboard size={18} />
            Overview
          </button>
          <button 
            className={`nav-btn ${activePage === 'conveyor' ? 'active' : ''}`}
            onClick={() => setActivePage('conveyor')}
          >
            <Settings2 size={18} />
            Conveyor Control
          </button>
          <button 
            className={`nav-btn ${activePage === 'quality' ? 'active' : ''}`}
            onClick={() => setActivePage('quality')}
          >
            <ActivitySquare size={18} />
            Quality Control
          </button>
          <button 
            className={`nav-btn ${activePage === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActivePage('maintenance')}
          >
            <ShieldAlert size={18} />
            Maintenance
          </button>
        </nav>

        <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: '1.5' }}>
            <div>USER: ADMIN</div>
            <div>STATION: TERMINAL_01</div>
            <div>STATUS: SECURE</div>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="app-main">
        <header className="page-header">
          <h2>
            {activePage === 'overview' && 'Factory Production Overview'}
            {activePage === 'conveyor' && 'Conveyor Line Control System'}
            {activePage === 'quality' && 'Quality Assurance Metrics'}
            {activePage === 'maintenance' && 'Maintenance & Diagnostics'}
          </h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={() => setAndonMode(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid #ffb042', color: '#ffb042', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              <Monitor size={14} />
              ANDON BOARD
            </button>
            <button 
              onClick={exportShiftReport}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: '1px solid var(--accent-cyan)', color: 'var(--accent-cyan)', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 'bold' }}
            >
              <Download size={14} />
              EXPORT SHIFT REPORT
            </button>
            <div className="status-pill online">
              <div className="status-dot"></div>
              SYSTEM NOMINAL
            </div>
          </div>
        </header>
        
        <div className="page-content">
          {renderPage()}
        </div>
      </div>
    </div>
    </>
  );
}

export default App;

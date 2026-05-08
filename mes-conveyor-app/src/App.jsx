import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import { LayoutDashboard, Settings2, ActivitySquare, ShieldAlert, CheckCircle, AlertTriangle, TrendingUp, Download, Monitor, Clock } from 'lucide-react';
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

const ROLES = {
  OPERATOR: { name: 'OPERATOR', level: 1 },
  QUALITY: { name: 'QUALITY_TECH', level: 2 },
  MAINTENANCE: { name: 'MAINTENANCE_TECH', level: 2 },
  SUPERVISOR: { name: 'SUPERVISOR', level: 3 }
};

const LoginScreen = ({ onLogin }) => {
  const loginBtnStyle = { background: '#222', color: '#fff', border: '1px solid #444', padding: '1rem', fontSize: '1rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', textAlign: 'left', transition: 'background 0.2s', width: '100%' };
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0a0a0a', zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>
      <div style={{ width: '400px', background: '#111', border: '2px solid var(--accent-cyan)', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 0 20px var(--accent-cyan-dim)' }}>
        <h1 style={{ color: 'var(--accent-cyan)', textAlign: 'center', margin: 0, letterSpacing: '4px' }}>LEAR MES</h1>
        <h3 style={{ color: '#fff', textAlign: 'center', margin: 0 }}>AUTHORIZATION REQUIRED</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <button onClick={() => onLogin('J. Smith', ROLES.OPERATOR)} style={{ ...loginBtnStyle, borderLeft: '5px solid #aaa' }}>LOGIN AS OPERATOR</button>
          <button onClick={() => onLogin('K. Davis', ROLES.QUALITY)} style={{ ...loginBtnStyle, borderLeft: '5px solid #ffb042' }}>LOGIN AS QUALITY TECH</button>
          <button onClick={() => onLogin('M. Chen', ROLES.MAINTENANCE)} style={{ ...loginBtnStyle, borderLeft: '5px solid #00cc00' }}>LOGIN AS MAINTENANCE TECH</button>
          <button onClick={() => onLogin('A. Admin', ROLES.SUPERVISOR)} style={{ ...loginBtnStyle, borderLeft: '5px solid var(--accent-cyan)' }}>LOGIN AS SUPERVISOR</button>
        </div>
      </div>
    </div>
  );
};

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
const OverviewPage = ({ linesState, productionHistory }) => {
  const [trendFilter, setTrendFilter] = React.useState('ALL');
  let totalParts = 0;
  let totalScrap = 0;
  let totalOpTime = 0;
  let totalDownTime = 0;
  let avgPerf = 0;
  let runningLines = 0;
  let totalSeatParts = 0;
  let totalHarnessParts = 0;

  const lineMetrics = Object.entries(linesState).map(([id, line]) => {
    totalParts += line.partsCount;
    totalScrap += line.scrapCount;
    totalOpTime += line.operatingTime;
    totalDownTime += line.downtime;
    if (line.operatingTime > 0) {
      avgPerf += (line.taktTime * line.partsCount) / line.operatingTime;
      runningLines++;
    }

    const isSeat = parseInt(id.substring(1)) <= 15;
    if (isSeat) {
      totalSeatParts += line.partsCount;
    } else {
      totalHarnessParts += line.partsCount;
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

  let currentPowerKw = 0;
  Object.values(linesState).forEach(l => {
    if (l.isRunning && !l.activeFault) {
       // Base load 15kW + speed penalty
       currentPowerKw += 15 + Math.max(0, (20 - l.taktTime) * 3.5);
    }
  });

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
            <div style={{ fontSize: '2.5rem', color: 'var(--status-run)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{totalSeatParts}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Completed Seat Sets (Shift)</div>
          </div>
        </div>
        
        <div className="hmi-panel">
          <div className="hmi-panel-header">
            <span className="hmi-panel-title">E-Systems Output</span>
            <ActivitySquare size={16} color="var(--accent-cyan)" />
          </div>
          <div className="hmi-panel-content">
            <div style={{ fontSize: '2.5rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{totalHarnessParts}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Wire Harnesses Assembled</div>
          </div>
        </div>

        <div className="hmi-panel">
          <div className="hmi-panel-header">
            <span className="hmi-panel-title">Energy Monitoring</span>
            <ActivitySquare size={16} color="#ffaa00" />
          </div>
          <div className="hmi-panel-content">
            <div style={{ fontSize: '2.5rem', color: currentPowerKw > 1500 ? 'var(--status-stop)' : '#ffaa00', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
              {currentPowerKw.toFixed(1)} kW
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Live Plant Power Draw</div>
          </div>
        </div>
      </div>

      {/* TREND GRAPH PANEL */}
      <div className="hmi-panel" style={{ height: '220px', display: 'flex', flexDirection: 'column' }}>
        <div className="hmi-panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className="hmi-panel-title">Production Trend</span>
            <select 
               value={trendFilter} 
               onChange={e => setTrendFilter(e.target.value)}
               style={{ background: 'var(--bg-base)', color: 'var(--text-main)', border: '1px solid var(--border-light)', padding: '2px 5px', fontSize: '0.75rem', outline: 'none' }}
            >
              <option value="ALL">ALL FAMILIES</option>
              <option value="SEATS">FRONT SEAT FRAMES</option>
              <option value="HARNESS">MAIN BODY HARNESS</option>
            </select>
          </div>
          <TrendingUp size={16} color="var(--accent-cyan)" />
        </div>
        <div className="hmi-panel-content" style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: '2%', padding: '1rem', height: '100%', boxSizing: 'border-box' }}>
           {productionHistory.map((pt, i) => {
              let val = 0;
              let target = 0;
              if (trendFilter === 'ALL') { val = (pt.partsSeat || 0) + (pt.partsHarness || 0); target = 1000; }
              else if (trendFilter === 'SEATS') { val = pt.partsSeat || 0; target = 400; }
              else if (trendFilter === 'HARNESS') { val = pt.partsHarness || 0; target = 600; }

              const maxVal = Math.max(...productionHistory.map(d => {
                 if (trendFilter === 'ALL') return (d.partsSeat || 0) + (d.partsHarness || 0);
                 if (trendFilter === 'SEATS') return d.partsSeat || 0;
                 return d.partsHarness || 0;
              }), target * 1.2, 100);

              const heightPct = Math.min((val / maxVal) * 100, 100);
              const targetHeight = (target / maxVal) * 100;
              return (
                 <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative', justifyContent: 'flex-end' }}>
                    <div style={{ position: 'absolute', bottom: `${targetHeight}%`, width: '100%', borderBottom: '2px dashed #ffb042', zIndex: 0 }}></div>
                    <div style={{ 
                        width: '80%', 
                        height: `${heightPct}%`, 
                        background: val >= target ? 'var(--status-run)' : 'var(--status-stop)',
                        transition: 'height 0.5s ease-out',
                        zIndex: 1,
                        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        paddingTop: '5px',
                        overflow: 'hidden'
                    }}>
                      <span style={{ fontSize: '0.65rem', color: '#000', fontWeight: 'bold', transform: 'rotate(-90deg)', marginTop: '15px' }}>{val}pcs</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>{pt.label}</div>
                 </div>
              );
           })}
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

const QualityPage = ({ linesState, eventLogs, defectCounts }) => {
  let totalParts = 0;
  let totalScrap = 0;
  Object.values(linesState).forEach(line => {
    totalParts += line.partsCount;
    totalScrap += line.scrapCount;
  });
  
  const ftq = totalParts > 0 ? ((totalParts - totalScrap) / totalParts) * 100 : 100;
  const sortedDefects = Object.entries(defectCounts).sort((a, b) => b[1] - a[1]);

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

      <div style={{ display: 'flex', gap: '1.5rem', flex: 1, minHeight: 0 }}>
        {/* Pareto Chart */}
        <div className="hmi-panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="hmi-panel-header">
            <span className="hmi-panel-title">Defect Pareto Analysis</span>
          </div>
          <div className="hmi-panel-content" style={{ padding: '1.5rem', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {sortedDefects.map(([code, count]) => (
                <div key={code}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                    <span>{code}</span>
                    <span style={{ color: count > 0 ? 'var(--status-stop)' : 'inherit' }}>{count}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-base)', border: '1px solid var(--border-light)' }}>
                    <div style={{ width: `${totalScrap > 0 ? (count / totalScrap) * 100 : 0}%`, height: '100%', background: 'var(--status-stop)', transition: 'width 0.5s' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Alerts */}
        <div className="hmi-panel" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="hmi-panel-header">
            <span className="hmi-panel-title">System Event Log</span>
          </div>
          <div className="hmi-panel-content" style={{ padding: '0 1.5rem 1.5rem 1.5rem', overflowY: 'auto' }}>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
              {totalScrap > 0 && (
                <li style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1rem', color: 'var(--status-stop)' }}>
                  <AlertTriangle size={18} /> <span>Live Shift: {totalScrap} defects have been logged across active lines.</span>
                </li>
              )}
              {eventLogs.slice(0, 15).map((log, idx) => {
                let color = 'var(--text-main)';
                let icon = <CheckCircle size={18} />;
                if (log.type === 'error') { color = 'var(--status-stop)'; icon = <AlertTriangle size={18} />; }
                if (log.type === 'warning') { color = '#ffb042'; icon = <AlertTriangle size={18} />; }
                if (log.type === 'success') { color = 'var(--status-run)'; icon = <CheckCircle size={18} />; }
                if (log.type === 'info') { color = '#00f0ff'; icon = <ActivitySquare size={18} />; }
                
                return (
                  <li key={idx} style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1rem', color: color }}>
                    {icon} <span>[{log.time.toLocaleTimeString()}] - {log.msg}</span>
                  </li>
                );
              })}
              {eventLogs.length === 0 && (
                <li style={{ padding: '1.5rem 0', display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
                  <CheckCircle size={18} color="var(--status-run)" /> <span style={{ color: 'var(--text-main)' }}>No system events logged.</span>
                </li>
              )}
            </ul>
          </div>
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
  const [currentUser, setCurrentUser] = useState(null);
  
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
  const [defectCounts, setDefectCounts] = useState(() => {
    const saved = localStorage.getItem('mes_defectCounts');
    return saved ? JSON.parse(saved) : { 'SCRATCH/DENT': 0, 'MISSING PART': 0, 'FAILED TEST': 0, 'WRONG COLOR': 0 };
  });
  const [isShiftBreak, setIsShiftBreak] = useState(() => {
    return localStorage.getItem('mes_shiftBreak') === 'true';
  });
  const [activeShiftDuration, setActiveShiftDuration] = useState(() => {
    return parseInt(localStorage.getItem('mes_shiftDuration')) || 3600;
  });
  const [productionHistory, setProductionHistory] = useState(() => {
    const saved = localStorage.getItem('mes_productionHistory');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0 && parsed[0].partsSeat === undefined) {
         return parsed.map(p => ({ label: p.label, partsSeat: Math.floor(p.parts * 0.4) || 0, partsHarness: Math.floor(p.parts * 0.6) || 0 }));
      }
      return parsed;
    }
    const initial = [];
    for(let i=11; i>=0; i--) {
      initial.push({ label: `T-${i}h`, partsSeat: Math.floor(Math.random()*100)+300, partsHarness: Math.floor(Math.random()*100)+500 });
    }
    return initial;
  });

  // Persistence Hooks
  useEffect(() => { localStorage.setItem('mes_enabled', mesEnabled); }, [mesEnabled]);
  useEffect(() => { localStorage.setItem('mes_activeLine', activeLine); }, [activeLine]);
  useEffect(() => { localStorage.setItem('mes_linesState', JSON.stringify(linesState)); }, [linesState]);
  useEffect(() => { localStorage.setItem('mes_eventLogs', JSON.stringify(eventLogs)); }, [eventLogs]);
  useEffect(() => { localStorage.setItem('mes_defectCounts', JSON.stringify(defectCounts)); }, [defectCounts]);
  useEffect(() => { localStorage.setItem('mes_shiftBreak', isShiftBreak); }, [isShiftBreak]);
  useEffect(() => { localStorage.setItem('mes_shiftDuration', activeShiftDuration); }, [activeShiftDuration]);
  useEffect(() => { localStorage.setItem('mes_productionHistory', JSON.stringify(productionHistory)); }, [productionHistory]);

  const addLog = (msg, type = 'info') => {
    setEventLogs(prev => [{ time: new Date(), msg, type }, ...prev].slice(0, 50));
  };

  const handleShiftChange = (duration) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
       wsRef.current.send(JSON.stringify({ action: 'UPDATE_GLOBAL', updates: { shiftDuration: duration } }));
    }
    setActiveShiftDuration(duration);
    addLog(`Global shift template updated to ${duration / 3600} hours.`, 'info');
  };

  const logDefect = (code) => {
    setDefectCounts(prev => ({ ...prev, [code]: (prev[code] || 0) + 1 }));
  };

  const wsRef = useRef(null);
  
  useEffect(() => {
    // Connect to Node-RED Backend
    // Uses VITE_WS_URL env variable in production (set in Render dashboard)
    // Falls back to localhost:1880 for local development
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => addLog('Connected to Node-RED Backend (Live Stream Active)', 'success');
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'FULL_STATE') {
          setLinesState(prev => ({ ...prev, ...payload.data }));
        } else if (payload.type === 'LINE_UPDATE') {
          setLinesState(prev => ({
            ...prev,
            [payload.lineId]: { ...prev[payload.lineId], ...payload.data }
          }));
        } else if (payload.type === 'STATE_UPDATE') {
          // Legacy support
          if (payload.lines) setLinesState(payload.lines);
          if (payload.globalState) {
            setIsShiftBreak(payload.globalState.isShiftBreak);
            if (payload.globalState.shiftDuration) setActiveShiftDuration(payload.globalState.shiftDuration);
          }
        }
      } catch(e) { console.error('WS parsing error', e); }
    };
    
    ws.onclose = () => addLog('Lost connection to Node-RED Backend. Check if Node-RED is running.', 'error');
    
    return () => ws.close();
  }, []);

  useEffect(() => {
    addLog('System initialized. Awaiting Node-RED connection...', 'info');
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

  const lastPartsRef = useRef({ seat: 0, harness: 0 });
  const linesStateRef = useRef(linesState);
  useEffect(() => { linesStateRef.current = linesState; }, [linesState]);

  useEffect(() => {
    let currentSeatTotal = 0;
    let currentHarnessTotal = 0;
    Object.entries(linesStateRef.current).forEach(([id, l]) => {
      if (parseInt(id.replace('L', '')) <= 15) currentSeatTotal += l.partsCount;
      else currentHarnessTotal += l.partsCount;
    });
    lastPartsRef.current = { seat: currentSeatTotal, harness: currentHarnessTotal };

    const interval = setInterval(() => {
       if (!mesEnabled || isShiftBreak) return;
       
       let cSeat = 0;
       let cHarness = 0;
       Object.entries(linesStateRef.current).forEach(([id, l]) => {
          if (parseInt(id.replace('L', '')) <= 15) cSeat += l.partsCount;
          else cHarness += l.partsCount;
       });
       
       const deltaSeat = cSeat - lastPartsRef.current.seat;
       const deltaHarness = cHarness - lastPartsRef.current.harness;
       lastPartsRef.current = { seat: cSeat, harness: cHarness };

       setProductionHistory(prev => {
          const next = [...prev.slice(1), {
             label: new Date().toLocaleTimeString([], {minute:'2-digit', second:'2-digit'}),
             partsSeat: Math.floor(deltaSeat * 20),
             partsHarness: Math.floor(deltaHarness * 20)
          }];
          return next;
       });
    }, 15000); // Every 15 seconds real-time = new data point
    return () => clearInterval(interval);
  }, [mesEnabled, isShiftBreak]);

  // Physics Simulation has been offloaded to Node-RED Backend


  // Removed parts milestone spam.

  const updateLine = (id, updates) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
       let action = updates.isRunning === true ? 'START' : (updates.isRunning === false ? 'STOP' : null);
       if (updates.motorSpeed !== undefined || updates.autoTakt !== undefined) {
         action = 'SPEED';
       } else if (updates.scrapCount !== undefined && updates.partsCount === undefined) {
         action = 'REJECT';
       } else if (updates.partsCount === 0) {
         action = 'RESET';
       }
       if (action) {
         wsRef.current.send(JSON.stringify({ 
           type: 'LINE_COMMAND', 
           lineId: id, 
           action,
           value: updates.motorSpeed,
           taktTime: updates.taktTime,
           autoTakt: updates.autoTakt
         }));
       }
    }
    // Optimistic local update
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
          logDefect={logDefect}
          currentUser={currentUser}
          ROLES={ROLES}
        />
      );
      case 'overview': return <OverviewPage linesState={linesState} productionHistory={productionHistory} />;
      case 'quality': return <QualityPage linesState={linesState} eventLogs={eventLogs} defectCounts={defectCounts} />;
      case 'maintenance': return <MaintenancePage linesState={linesState} />;
      default: return <OverviewPage linesState={linesState} />;
    }
  };

  if (!currentUser) {
    return <LoginScreen onLogin={(name, role) => {
      setCurrentUser({ name, role });
      if (role.name === 'OPERATOR') {
        setActivePage('conveyor');
      } else {
        setActivePage('overview');
      }
    }} />;
  }

  const isSupervisor = currentUser.role.level >= ROLES.SUPERVISOR.level;
  const isOperator = currentUser.role.name === 'OPERATOR';
  const isQuality = currentUser.role.name === 'QUALITY_TECH';
  const isMaintenance = currentUser.role.name === 'MAINTENANCE_TECH';

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
          {!isOperator && (
            <button 
              className={`nav-btn ${activePage === 'overview' ? 'active' : ''}`}
              onClick={() => setActivePage('overview')}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>
          )}
          <button 
            className={`nav-btn ${activePage === 'conveyor' ? 'active' : ''}`}
            onClick={() => setActivePage('conveyor')}
          >
            <Settings2 size={18} />
            Conveyor Control
          </button>
          {(isSupervisor || isQuality) && (
            <button 
              className={`nav-btn ${activePage === 'quality' ? 'active' : ''}`}
              onClick={() => setActivePage('quality')}
            >
              <ActivitySquare size={18} />
              Quality Control
            </button>
          )}
          {(isSupervisor || isMaintenance) && (
            <button 
              className={`nav-btn ${activePage === 'maintenance' ? 'active' : ''}`}
              onClick={() => setActivePage('maintenance')}
            >
              <ShieldAlert size={18} />
              Maintenance
            </button>
          )}
        </nav>

        <div style={{ marginTop: 'auto', padding: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', lineHeight: '1.5' }}>
            <div>USER: {currentUser.name}</div>
            <div>ROLE: {currentUser.role.name}</div>
            <div>STATION: TERMINAL_01</div>
            <div>STATUS: SECURE</div>
            <button onClick={() => setCurrentUser(null)} style={{ background: 'transparent', border: '1px solid #ff5555', color: '#ff5555', padding: '0.2rem 0.5rem', marginTop: '0.5rem', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>LOGOUT</button>
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
            {isSupervisor && (
              <>
                <select 
                  value={activeShiftDuration}
                  onChange={(e) => handleShiftChange(parseInt(e.target.value))}
                  style={{ background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-light)', padding: '0.4rem 0.8rem', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', cursor: 'pointer', outline: 'none', appearance: 'auto' }}
                >
                  <option value={3600}>1-Hour Demo Shift</option>
                  <option value={28800}>8-Hour Shift (3/Day)</option>
                  <option value={36000}>10-Hour Shift</option>
                  <option value={43200}>12-Hour Shift (2/Day)</option>
                </select>
                <button 
                  onClick={() => {
                    const nextState = !isShiftBreak;
                    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                       wsRef.current.send(JSON.stringify({ action: 'UPDATE_GLOBAL', updates: { isShiftBreak: nextState } }));
                    }
                    setIsShiftBreak(nextState);
                    addLog(nextState ? 'PLANNED SHIFT BREAK INITIATED. ALL LINES PAUSED.' : 'SHIFT BREAK ENDED. RESUMING PRODUCTION.', 'warning');
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: isShiftBreak ? '#ffaa00' : 'transparent', border: '1px solid #ffaa00', color: isShiftBreak ? '#000' : '#ffaa00', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  <Clock size={14} />
                  {isShiftBreak ? 'RESUME PRODUCTION' : 'START SHIFT BREAK'}
                </button>
              </>
            )}
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
            {isShiftBreak ? (
              <div className="status-pill" style={{ background: '#332200', color: '#ffaa00', borderColor: '#ffaa00' }}>
                <div className="status-dot" style={{ background: '#ffaa00', animation: 'pulse-yellow 2s infinite' }}></div>
                PLANNED DOWNTIME
              </div>
            ) : (
              <div className="status-pill online">
                <div className="status-dot"></div>
                SYSTEM NOMINAL
              </div>
            )}
            <style>{`
              @keyframes pulse-yellow {
                0% { box-shadow: 0 0 0 0 rgba(255, 170, 0, 0.7); }
                70% { box-shadow: 0 0 0 5px rgba(255, 170, 0, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 170, 0, 0); }
              }
            `}</style>
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

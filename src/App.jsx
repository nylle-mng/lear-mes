import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import { LayoutDashboard, Settings2, ActivitySquare, ShieldAlert, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import './index.css';

// Lear-specific Placeholder Pages
const OverviewPage = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
      <div className="hmi-panel">
        <div className="hmi-panel-header">
          <span className="hmi-panel-title">Just-In-Time (JIT) Seating</span>
          <TrendingUp size={16} color="var(--status-run)" />
        </div>
        <div className="hmi-panel-content">
          <div style={{ fontSize: '2.5rem', color: 'var(--status-run)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>1,204</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Completed Seat Sets (Shift)</div>
        </div>
      </div>
      
      <div className="hmi-panel">
        <div className="hmi-panel-header">
          <span className="hmi-panel-title">E-Systems Harness Output</span>
          <ActivitySquare size={16} color="var(--accent-cyan)" />
        </div>
        <div className="hmi-panel-content">
          <div style={{ fontSize: '2.5rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>8,450</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Wire Harnesses Assembled</div>
        </div>
      </div>

      <div className="hmi-panel">
        <div className="hmi-panel-header">
          <span className="hmi-panel-title">Plant Delivery Status</span>
          <CheckCircle size={16} color="#ffb042" />
        </div>
        <div className="hmi-panel-content">
          <div style={{ fontSize: '2.5rem', color: '#ffb042', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>ON TRACK</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Next OEM Sequence Drop: 14 mins</div>
        </div>
      </div>
    </div>
    
    <div className="hmi-panel" style={{ flex: 1 }}>
      <div className="hmi-panel-header">
        <span className="hmi-panel-title">Active Production Lines</span>
      </div>
      <div className="hmi-panel-content" style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '1rem 0' }}>LINE ID</th>
              <th>PRODUCT FAMILY</th>
              <th>STATUS</th>
              <th>YIELD</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '1rem 0', color: 'var(--text-main)' }}>LINE_A1</td>
              <td>Front Seat Frames (SUV Platform)</td>
              <td style={{ color: 'var(--status-run)' }}>RUNNING</td>
              <td>99.2%</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '1rem 0', color: 'var(--text-main)' }}>LINE_B4</td>
              <td>Main Body Harness (E-Systems)</td>
              <td style={{ color: 'var(--status-run)' }}>RUNNING</td>
              <td>98.5%</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '1rem 0', color: 'var(--text-main)' }}>LINE_C2</td>
              <td>Foam Pouring Station</td>
              <td style={{ color: '#ffb042' }}>CHANGEOVER</td>
              <td>N/A</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const QualityPage = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
      <div className="hmi-panel">
        <div className="hmi-panel-header">
          <span className="hmi-panel-title">First Time Quality (FTQ)</span>
        </div>
        <div className="hmi-panel-content">
          <div style={{ fontSize: '2.5rem', color: 'var(--status-run)', fontFamily: 'var(--font-mono)' }}>99.14%</div>
        </div>
      </div>
      <div className="hmi-panel">
        <div className="hmi-panel-header">
          <span className="hmi-panel-title">Total Scrap (Shift)</span>
        </div>
        <div className="hmi-panel-content">
          <div style={{ fontSize: '2.5rem', color: 'var(--status-stop)', fontFamily: 'var(--font-mono)' }}>12 Units</div>
        </div>
      </div>
    </div>
    <div className="hmi-panel" style={{ flex: 1 }}>
      <div className="hmi-panel-header">
        <span className="hmi-panel-title">Recent Quality Alerts</span>
      </div>
      <div className="hmi-panel-content" style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
          <li style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1rem', color: '#ffb042' }}>
            <AlertTriangle size={18} /> <span>[10:42 AM] - Minor stitch variance detected on Leather Headrest Station 4. Vision system auto-corrected.</span>
          </li>
          <li style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '1rem', color: 'var(--status-stop)' }}>
            <AlertTriangle size={18} /> <span>[09:15 AM] - Pin connector continuity fail on Harness Test Bed 2. Unit routed to manual rework.</span>
          </li>
          <li style={{ padding: '1.5rem 0', display: 'flex', gap: '1rem', color: 'var(--text-muted)' }}>
            <CheckCircle size={18} color="var(--status-run)" /> <span style={{ color: 'var(--text-main)' }}>[08:00 AM] - Shift started with 0 carried over defects.</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
);

const MaintenancePage = () => (
  <div className="hmi-panel" style={{ flex: 1, height: '100%' }}>
    <div className="hmi-panel-header">
      <span className="hmi-panel-title">Equipment Health & Maintenance</span>
    </div>
    <div className="hmi-panel-content" style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
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
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '1rem 0', color: 'var(--text-main)' }}>ROBOT_WELD_04</td>
              <td>Seat Frame Welding</td>
              <td style={{ color: 'var(--status-run)' }}>GOOD (94%)</td>
              <td>In 14 Days</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '1rem 0', color: 'var(--text-main)' }}>AGV_UNIT_12</td>
              <td>Automated Guided Vehicle</td>
              <td style={{ color: '#ffb042' }}>LOW BATTERY (12%)</td>
              <td>Routing to charger</td>
            </tr>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '1rem 0', color: 'var(--text-main)' }}>CONV_MOTOR_B2</td>
              <td>Main Line Drive</td>
              <td style={{ color: 'var(--status-stop)' }}>HIGH TEMP (85°C)</td>
              <td>Immediate Inspection</td>
            </tr>
            <tr>
              <td style={{ padding: '1rem 0', color: 'var(--text-main)' }}>SEW_STATION_8</td>
              <td>Leather Stitching</td>
              <td style={{ color: 'var(--status-run)' }}>GOOD (98%)</td>
              <td>In 45 Days</td>
            </tr>
          </tbody>
        </table>
    </div>
  </div>
);

function App() {
  const [activePage, setActivePage] = useState('conveyor');

  const renderPage = () => {
    switch (activePage) {
      case 'conveyor': return <Dashboard />;
      case 'overview': return <OverviewPage />;
      case 'quality': return <QualityPage />;
      case 'maintenance': return <MaintenancePage />;
      default: return <Dashboard />;
    }
  };

  return (
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
  );
}

export default App;

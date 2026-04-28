import React, { useState, useEffect, useRef } from 'react';
import ControlPanel from './ControlPanel';
import MetricsDisplay from './MetricsDisplay';
import ConveyorVisualizer from './ConveyorVisualizer';
import EventLog from './EventLog';

const INITIAL_LINES = {
  A1: { taktTime: 5.0, isRunning: false, stopCount: 0, downtime: 0, partsCount: 0, activeFault: null, autoTakt: false, targetQuantity: 100, shiftDuration: 3600 },
  B4: { taktTime: 8.0, isRunning: false, stopCount: 0, downtime: 0, partsCount: 0, activeFault: null, autoTakt: false, targetQuantity: 100, shiftDuration: 3600 },
  C2: { taktTime: 12.0, isRunning: false, stopCount: 0, downtime: 0, partsCount: 0, activeFault: null, autoTakt: false, targetQuantity: 100, shiftDuration: 3600 },
};

export default function Dashboard() {
  const [mesEnabled, setMesEnabled] = useState(false);
  const [activeLine, setActiveLine] = useState('A1');
  const [linesState, setLinesState] = useState(INITIAL_LINES);
  const [eventLogs, setEventLogs] = useState([]);

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
    const lastDowntimeTick = { A1: Date.now(), B4: Date.now(), C2: Date.now() };

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

          // 2. Downtime accumulation (1 sec intervals)
          if (!line.isRunning) {
            if (now - lastDowntimeTick[id] >= 1000) {
              line.downtime += 1;
              lastDowntimeTick[id] += 1000;
              updated = true;
            }
          } else {
            lastDowntimeTick[id] = now;
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
    }, 100); // 100ms tick for smooth simulation

    return () => clearInterval(interval);
  }, [mesEnabled]);

  // Log Parts Milestones
  const prevPartsRef = useRef({ A1: 0, B4: 0, C2: 0 });
  useEffect(() => {
    Object.keys(linesState).forEach(id => {
      const current = linesState[id].partsCount;
      const prev = prevPartsRef.current[id];
      if (current > prev) {
        if (current % 5 === 0) {
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

  return (
    <div className="dashboard-grid">
      <div className="dashboard-sidebar">
        <ControlPanel 
          mesEnabled={mesEnabled}
          setMesEnabled={handleMesToggle}
          activeLine={activeLine}
          setActiveLine={setActiveLine}
          linesState={linesState}
          updateLine={updateLine}
          addLog={addLog}
        />
        <EventLog logs={eventLogs} />
      </div>
      
      <div className="dashboard-main">
        <MetricsDisplay 
          mesEnabled={mesEnabled}
          activeLine={activeLine}
          lineState={linesState[activeLine]}
        />
        <ConveyorVisualizer 
          mesEnabled={mesEnabled}
          linesState={linesState}
        />
      </div>
    </div>
  );
}

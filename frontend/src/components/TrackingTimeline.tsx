import React, { useEffect, useMemo, useRef, useState } from 'react';
import apiService from '../services/api';

type TrackingStatus = 'UPLOADED'|'APPROVED'|'REFILL_REQUESTED'|'REFILL_APPROVED'|'FILLING'|'FILLED'|'DISPATCHED'|'DELIVERED';

interface TrackingEvent {
  id: number;
  status: TrackingStatus;
  createdAt: string;
  notes?: string;
}

const steps: { key: TrackingStatus; label: string }[] = [
  { key: 'UPLOADED', label: 'Prescription Uploaded' },
  { key: 'APPROVED', label: 'Prescription Approved' },
  { key: 'REFILL_REQUESTED', label: 'Refill Request Sent' },
  { key: 'REFILL_APPROVED', label: 'Refill Request Approved' },
  { key: 'FILLING', label: 'Medicines Filling in Progress' },
  { key: 'FILLED', label: 'Medicines Filled' },
  { key: 'DISPATCHED', label: 'Medicines Dispatched' },
  { key: 'DELIVERED', label: 'Medicines Delivered' }
];

export default function TrackingTimeline({ prescriptionId, fileUrl, onDelivered }: { prescriptionId: string; fileUrl?: string; onDelivered?: () => void }) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const lastEventRef = useRef<TrackingEvent | null>(null);

  // Function to load tracking data
  const loadTracking = async () => {
    try {
      const list = await apiService.getTrackingHistory(prescriptionId);
      setEvents(list);
    } catch (error) {
      console.error('Failed to load tracking data:', error);
    }
  };

  // Fetch initial
  useEffect(() => {
    loadTracking();
  }, [prescriptionId]);

  // Subscribe via SSE (fallback to polling if needed)
  useEffect(() => {
    const url = `${apiService.baseURL}/tracking/subscribe/${prescriptionId}`;
    const es = new EventSource(url, { withCredentials: true });
    es.onopen = () => setConnected(true);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        setEvents((prev) => [...prev, data]);
      } catch {}
    };
    es.onerror = () => { setConnected(false); };
    return () => es.close();
  }, [prescriptionId]);

  const statusToDate: Record<TrackingStatus, string | undefined> = useMemo(() => {
    const map: Record<string, string> = {};
    events.forEach((e) => { map[e.status] = e.createdAt; });
    return map as any;
  }, [events]);

  const activeIndex = useMemo(() => {
    let idx = -1;
    steps.forEach((s, i) => { if (statusToDate[s.key]) idx = i; });
    return idx;
  }, [statusToDate]);

  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-900">Prescription & Medicine Tracking</h3>
        {fileUrl && (
          <button onClick={() => window.open(fileUrl, '_blank')} className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md">View Prescription</button>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-1 bg-gray-200" />
        <div className="space-y-6">
          {steps.map((s, i) => {
            const done = i <= activeIndex;
            const isActive = i === activeIndex;
            const date = statusToDate[s.key];
            return (
              <div key={s.key} className="relative pl-12">
                <div className={`absolute left-2 top-1.5 w-5 h-5 rounded-full ${done ? 'bg-green-500' : 'bg-gray-300'} ${isActive ? 'animate-pulse' : ''}`}></div>
                {i < activeIndex && (
                  <div className="absolute left-4 top-1.5 w-1 h-[calc(100%+24px)] bg-green-500" style={{ transformOrigin: 'top', animation: 'grow 0.6s ease-out' }} />
                )}
                <div className="">
                  <div className={`text-base font-semibold ${done ? 'text-gray-900' : 'text-gray-500'}`}>{s.label}</div>
                  <div className="text-sm text-gray-500">{date ? new Date(date).toLocaleString() : ''}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}`}</style>

      {!connected && (
        <div className="mt-3 text-xs text-gray-500">Live updates unavailable, falling back to periodic refresh.</div>
      )}

      {/* Only patient control: mark delivered (no dispatch button here) */}
      {activeIndex >= steps.findIndex(s => s.key === 'DISPATCHED') && activeIndex < steps.length - 1 && (
        <div className="mt-4 flex gap-3">
          <button onClick={async () => {
            try { 
              await apiService.markDelivered(prescriptionId); 
              // Refresh the tracking data
              loadTracking();
              // Callback to parent component
              onDelivered && onDelivered(); 
            } catch (e) {
              console.error('Failed to mark as delivered:', e);
            }
          }} className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md">Mark Delivered</button>
        </div>
      )}
    </div>
  );
}



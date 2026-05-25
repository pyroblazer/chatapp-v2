import { useEffect, useState } from 'react';
import { fetchCallHistory } from '../../../utils/api';
import { fullName } from '../../../utils/helpers';
import {
  ScrollableContainer,
  SidebarHeader,
  SidebarStyle,
} from '../../../utils/styles';

type CallRecord = {
  id: string;
  callerId: string;
  recipientId: string;
  caller: { id: string; firstName?: string; lastName?: string; username: string; profile?: { avatar?: string } };
  recipient: { id: string; firstName?: string; lastName?: string; username: string; profile?: { avatar?: string } };
  callType: 'video' | 'audio';
  status: 'initiated' | 'accepted' | 'rejected' | 'missed' | 'ended';
  initiatedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
};

const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '-';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const statusLabel = (status: CallRecord['status']): string => {
  switch (status) {
    case 'accepted': return 'Answered';
    case 'rejected': return 'Rejected';
    case 'missed': return 'Missed';
    case 'ended': return 'Ended';
    default: return 'Initiated';
  }
};

const statusColor = (status: CallRecord['status']): string => {
  switch (status) {
    case 'accepted': return '#4caf50';
    case 'ended': return '#4caf50';
    case 'rejected': return '#ff9800';
    case 'missed': return '#f44336';
    default: return '#999';
  }
};

export const CallsSidebar = ({ userId }: { userId?: string }) => {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCallHistory()
      .then(({ data }) => setCalls(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SidebarStyle>
      <SidebarHeader>Call History</SidebarHeader>
      <ScrollableContainer>
        {loading ? (
          <div style={{ padding: '12px', color: '#999' }}>Loading...</div>
        ) : calls.length === 0 ? (
          <div style={{ padding: '12px', color: '#999' }}>No call history</div>
        ) : (
          calls.map((call) => {
            const isOutgoing = call.callerId === userId;
            const peer = isOutgoing ? call.recipient : call.caller;
            return (
              <div
                key={call.id}
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #2a2a2a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', color: '#e0e0e0' }}>
                    {isOutgoing ? 'Outgoing' : 'Incoming'} — {fullName(peer)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>
                    {new Date(call.initiatedAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: statusColor(call.status) }}>
                    {statusLabel(call.status)}
                  </div>
                  {call.durationSeconds != null && (
                    <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>
                      {formatDuration(call.durationSeconds)}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </ScrollableContainer>
    </SidebarStyle>
  );
};

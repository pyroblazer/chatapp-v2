import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPhone, FaVideo } from 'react-icons/fa';
import { fetchCallHistory } from '../../../utils/api';
import {
  ScrollableContainer,
  SidebarHeader,
  SidebarStyle,
} from '../../../utils/styles';

type CallRecord = {
  id: string;
  callerId: string;
  recipientId: string | null;
  conversationId: string | null;
  groupId: string | null;
  group: { id: string; title?: string } | null;
  caller: { id: string; firstName?: string; lastName?: string; username: string; profile?: { avatar?: string } };
  recipient: { id: string; firstName?: string; lastName?: string; username: string; profile?: { avatar?: string } } | null;
  callType: 'video' | 'audio';
  status: 'initiated' | 'accepted' | 'rejected' | 'missed' | 'ended';
  initiatedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  participants?: { userId: string; status: string; user?: { firstName?: string; lastName?: string; username: string } }[];
};

const fullName = (u?: { firstName?: string; lastName?: string; username: string } | null): string => {
  if (!u) return 'Unknown';
  if (u.firstName && u.lastName) return `${u.firstName} ${u.lastName}`;
  return u.username;
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
  const navigate = useNavigate();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (loading || (calls.length > 0 && calls.length >= total)) return;
    setLoading(true);
    fetchCallHistory(50, offset)
      .then(({ data }) => {
        const newCalls = data.data || [];
        setCalls((prev) => [...prev, ...newCalls]);
        setTotal(data.total);
        setOffset((prev) => prev + 50);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loading, calls.length, total, offset]);

  useEffect(() => {
    loadMore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleClick = (call: CallRecord) => {
    if (call.groupId) {
      navigate(`/groups/${call.groupId}`);
    } else if (call.conversationId) {
      navigate(`/conversations/${call.conversationId}`);
    }
  };

  return (
    <SidebarStyle>
      <SidebarHeader>Call History</SidebarHeader>
      <ScrollableContainer>
        {calls.length === 0 && !loading ? (
          <div style={{ padding: '12px', color: '#999' }}>No call history</div>
        ) : (
          calls.map((call) => {
            const isGroupCall = !!call.groupId;
            const isOutgoing = call.callerId === userId;
            const peer = isGroupCall
              ? null
              : isOutgoing
                ? call.recipient
                : call.caller;

            return (
              <div
                key={call.id}
                onClick={() => handleClick(call)}
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #2a2a2a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {call.callType === 'video' ? (
                    <FaVideo size={14} color="#3498db" />
                  ) : (
                    <FaPhone size={14} color="#3498db" />
                  )}
                  <div>
                    <div style={{ fontSize: '14px', color: '#e0e0e0' }}>
                      {isGroupCall
                        ? (call.group?.title || 'Group Call')
                        : `${isOutgoing ? 'Outgoing' : 'Incoming'} — ${fullName(peer)}`}
                    </div>
                    <div style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>
                      {isGroupCall && call.participants
                        ? `${call.participants.filter(p => p.status === 'accepted').length + 1} participants`
                        : null}
                      {' '}
                      {new Date(call.initiatedAt).toLocaleString()}
                    </div>
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
        <div ref={sentinelRef} style={{ height: '1px' }} />
        {loading && <div style={{ padding: '12px', color: '#999' }}>Loading...</div>}
      </ScrollableContainer>
    </SidebarStyle>
  );
};

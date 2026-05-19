import React from 'react';
import {
  StreamCall,
  StreamTheme,
  SpeakerLayout,
  StreamVideo,
  CallControls,
} from '@stream-io/video-react-sdk';

interface StreamCallViewProps {
  callId: string;
  type?: 'video' | 'audio';
}

export const StreamCallView: React.FC<StreamCallViewProps> = ({ callId, type = 'video' }) => {
  return (
    <StreamTheme>
      <StreamVideo>
        <StreamCall callType={type} callId={callId}>
          <SpeakerLayout />
          <CallControls />
        </StreamCall>
      </StreamVideo>
    </StreamTheme>
  );
};

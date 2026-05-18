import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
import { CharacterLimit, MessageInputContainer } from '../../utils/styles';
import { MessageTextField } from '../inputs/MessageTextField';
import { FaceVeryHappy, Send } from 'akar-icons';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import styles from './index.module.scss';
import { MessageAttachmentActionIcon } from './MessageAttachmentActionIcon';

type Props = {
  content: string;
  setContent: Dispatch<SetStateAction<string>>;
  placeholderName: string;
  sendMessage: () => void;
  sendTypingStatus: () => void;
};

export const MessageInputField: FC<Props> = ({
  content,
  placeholderName,
  setContent,
  sendMessage,
  sendTypingStatus,
}) => {
  const ICON_SIZE = 36;
  const MAX_LENGTH = 2048;
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiRef = useRef<HTMLDivElement>(null);
  const atMaxLength = content.length === MAX_LENGTH;

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setContent((prev) => {
      const next = prev + emojiData.emoji;
      return next.length <= MAX_LENGTH ? next : prev;
    });
    setShowEmojiPicker(false);
  };

  return (
    <>
      <MessageInputContainer isMultiLine={isMultiLine}>
        <MessageAttachmentActionIcon />
        <form onSubmit={sendMessage} className={styles.form}>
          <MessageTextField
            message={content}
            setMessage={setContent}
            maxLength={MAX_LENGTH}
            setIsMultiLine={setIsMultiLine}
            sendTypingStatus={sendTypingStatus}
            sendMessage={sendMessage}
          />
        </form>
        <div className={styles.emojiWrapper} ref={emojiRef}>
          <FaceVeryHappy
            className={styles.icon}
            size={ICON_SIZE}
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            style={{ cursor: 'pointer' }}
          />
          <Send
            className={styles.icon}
            size={ICON_SIZE}
            onClick={sendMessage}
            style={{ cursor: 'pointer', marginLeft: '8px' }}
          />
          {showEmojiPicker && (
            <div className={styles.emojiPicker}>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={320}
                height={400}
                searchDisabled={false}
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}
        </div>
        {atMaxLength && (
          <CharacterLimit atMaxLength={atMaxLength}>
            {`${content.length}/${MAX_LENGTH}`}
          </CharacterLimit>
        )}
      </MessageInputContainer>
    </>
  );
};

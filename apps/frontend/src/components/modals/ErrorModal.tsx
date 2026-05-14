import { createRef, FC, useEffect } from 'react';
import { MdClose } from 'react-icons/md';
import { ModalContainer, ModalContentBody, ModalHeader } from '.';
import { OverlayStyle } from '../../utils/styles';

type Props = {
  message: string;
  onClose: () => void;
};

export const ErrorModal: FC<Props> = ({ message, onClose }) => {
  const ref = createRef<HTMLDivElement>();

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) =>
      e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ref.current === e.target) onClose();
  };

  return (
    <OverlayStyle ref={ref} onClick={handleOverlayClick}>
      <ModalContainer>
        <ModalHeader>
          <h2>Error</h2>
          <MdClose size={32} cursor="pointer" onClick={onClose} />
        </ModalHeader>
        <ModalContentBody>{message}</ModalContentBody>
      </ModalContainer>
    </OverlayStyle>
  );
};

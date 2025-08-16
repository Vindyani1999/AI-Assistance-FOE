
import React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

const iconMap: Record<NotificationType, JSX.Element> = {
  success: <CheckCircleIcon style={{ color: '#fff', fontSize: 64 }} />,
  info: <InfoIcon style={{ color: '#fff', fontSize: 64 }} />,
  warning: <WarningAmberIcon style={{ color: '#fff', fontSize: 64 }} />,
  error: <ErrorOutlineIcon style={{ color: '#fff', fontSize: 64 }} />,
};

const title_types = {
  success: 'Success!',
  info: 'Information',
  warning: 'Warning',
  error: 'Sorry :(',
};

// Card accent colors
const accentMap = {
  success: '#4BB543', // green
  info: '#1967d2',   // blue
  warning: '#f9ab00',// yellow
  error: '#d86a62',  // red
};

interface NotificationPopupProps {
  open: boolean;
  type: NotificationType;
  title?: string;
  description?: string;
  onClose: () => void;
  actionLabel?: string;
  onAction?: () => void;
  details?: string;
}



const defaultDescriptions: Record<NotificationType, string> = {
  success: 'Your request was processed and completed successfully. You can continue with your next steps after closing this window.',
  error: 'Something went wrong while processing your request. Please try again because',
  info: 'This is an informational message to help guide you. Please review the details below and proceed as needed.',
  warning: 'There might be an issue that requires your attention. Please review the warning and make any necessary changes before continuing.',
};

const NotificationPopup: React.FC<NotificationPopupProps> = ({ open, type, description, onClose, actionLabel, onAction, details }) => {
  if (!open) return null;
  // const desc = description || defaultDescriptions[type];
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.75)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        minWidth: 320,
        maxWidth: 370,
        background: '#fff',
        borderRadius: 28,
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.18)',
        padding: '0rem 0rem 1.5rem 0rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: 'none',
        overflow: 'hidden',
      }}>
        {/* SVG wave and icon overlap section */}
        <div style={{ position: 'relative', width: '100%', height: 140, marginBottom: 16 }}>
          <svg
            width="100%"
            height="180"
            viewBox="110 0 270 220"
            style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
          >
            <path
              d="M0,0 Q185,340 570,0 L570,0 L100,0 Z"
              fill={accentMap[type]}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: 40,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 2,
              width: 70,
              height: 70,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {iconMap[type]}
          </div>
        </div>
        {/* Card content below icon */}
  <div style={{ width: '80%', textAlign: 'center', zIndex: 3 }}>
          {/* Title */}
          <div style={{
            fontWeight: 800,
            fontSize: '1.6rem',
            marginBottom: 10,
            color: '#414141',
            textAlign: 'center',
          }}>{title_types[type]}</div>
          {/* Description */}
          <div style={{ fontSize: '1.01rem', color: '#888', marginBottom: details ? 8 : 18, textAlign: 'center', lineHeight: 1.2 }}>
            {defaultDescriptions[type]}
            {description && <> {description}</>}
          </div>
          {/* Details */}
          {details && <div style={{ fontSize: '0.97rem', color: '#bbb', marginBottom: 18, textAlign: 'center', lineHeight: 1.5 }}>{details}</div>}
        </div>
        {/* Pill-shaped Action Button at bottom */}
        <div style={{ width: '60%', marginTop: 10, zIndex: 3 }}>
          <button
            onClick={onClose}
            style={{
              background: accentMap[type],
              color: '#fff',
              border: 'none',
              borderRadius: 999,
              padding: '0.625rem 0',
              fontWeight: 600,
              fontSize: '1.13rem',
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
              textTransform: 'none',
              letterSpacing: 0.5,
              transition: 'background 0.2s',
            }}
          >
            {type === 'success' && 'Okay'}
            {type === 'error' && 'Try Again'}
            {type === 'info' && 'Got it'}
            {type === 'warning' && 'Understood'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;

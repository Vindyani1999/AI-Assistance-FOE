import { SxProps, Theme } from '@mui/material';

export const userProfileSidebar: SxProps<Theme> = {
  position: 'fixed',
  top: 0,
  right: 0,
  width: { xs: '100%', sm: 380 },
  height: '100vh',
  bgcolor: 'background.paper',
  boxShadow: 6,
  zIndex: 1300,
  display: 'flex',
  flexDirection: 'column',
};

export const userProfileOverlay: SxProps<Theme> = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100vw',
  height: '100vh',
  bgcolor: 'rgba(0,0,0,0.4)',
  zIndex: 1299,
};

export const userProfileHeader: SxProps<Theme> = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  p: 2,
  borderBottom: '1px solid',
  borderColor: 'divider',
};

export const userProfileInfo: SxProps<Theme> = {
  p: 2,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
};

export const userProfileActions: SxProps<Theme> = {
  p: 2,
  borderTop: '1px solid',
  borderColor: 'divider',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 1,
};

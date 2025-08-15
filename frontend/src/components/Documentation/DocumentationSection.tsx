import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Box, Typography, Divider, Avatar, Card, CardContent, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import BlockIcon from '@mui/icons-material/Block';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const agentImages = {
  guidance: '/ga_new.png',
  booking: '/hba_new.png',
  planner: '/pa_new.png',
};

const DocumentationSection: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <Box
      className="documentation-content"
      sx={{
        p: 4,
        // maxWidth: 900,
        // mx: '2rem',
        bgcolor: isDark ? '#23272f' : '#fff',
        color: isDark ? '#f4f6fa' : '#2c3e50',
        borderRadius: 4,
        boxShadow: isDark ? 8 : 2,
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      <Typography variant="h3" gutterBottom sx={{ color: isDark ? '#e0c7b7' : '#795548', fontWeight: 700 }}>
        AI-Assistance-FOE Agents Documentation
      </Typography>
      <Typography variant="h5" gutterBottom sx={{ color: isDark ? '#e0c7b7' : '#4e342e', fontWeight: 600 }}>
        Overview
      </Typography>
      <Typography variant="body1" gutterBottom>
        This page provides a comprehensive overview of the three main agents in the AI-Assistance-FOE system: <b>Guidance Agent</b>, <b>Booking Agent</b>, and <b>Planner Agent</b>. Each agent is designed to address specific user needs within the educational and administrative environment.
      </Typography>
      <Divider sx={{ my: 4, borderColor: isDark ? '#795548' : '#e0c7b7' }} />

      {/* Guidance Agent */}
      <Card sx={{ mb: 4, boxShadow: isDark ? 8 : 2, bgcolor: isDark ? '#23272f' : '#f9f6f2', borderRadius: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={4} flexWrap="wrap">
            <Avatar src={agentImages.guidance} alt="Guidance Agent" sx={{ width: 120, height: 120, borderRadius: 4, boxShadow: isDark ? 8 : 2, bgcolor: isDark ? '#23272f' : '#fff', border: isDark ? '2px solid #ffd54f' : '2px solid #795548' }} />
            <Box flex={1}>
              <Typography variant="h5" sx={{ color: isDark ? '#ffd54f' : '#6d4c41', mt: 0, fontWeight: 700, fontSize: isDark ? '2rem' : '1.5rem' }}>1. Guidance Agent</Typography>
              <Typography variant="subtitle1" sx={{ color: isDark ? '#ffe082' : '#795548', fontWeight: 600, mb: 1, fontSize: isDark ? '1.2rem' : '1rem' }}><InfoIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: isDark ? '#ffd54f' : '#795548' }} />Purpose</Typography>
              <Typography variant="body2" gutterBottom sx={{ color: isDark ? '#f4f6fa' : '#2c3e50', fontSize: isDark ? '1.1rem' : '1rem' }}>The Guidance Agent assists students and staff by providing information, answering queries, and offering guidance related to academic and campus life.</Typography>
              <Typography variant="subtitle1" sx={{ color: isDark ? '#ffe082' : '#795548', fontWeight: 600, mt: 2, fontSize: isDark ? '1.2rem' : '1rem' }}><CheckCircleIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: isDark ? '#ffd54f' : '#388e3c' }} />Capabilities</Typography>
              <List dense>
                <ListItem><ListItemIcon><CheckCircleIcon sx={{ color: isDark ? '#ffd54f' : '#388e3c' }} /></ListItemIcon><ListItemText primary="Natural language chat interface" sx={{ color: isDark ? '#ffd54f' : '#222', fontSize: isDark ? '1.08rem' : '1.05rem', fontWeight: 500 }} /></ListItem>
                <ListItem><ListItemIcon><CheckCircleIcon sx={{ color: isDark ? '#ffd54f' : '#388e3c' }} /></ListItemIcon><ListItemText primary="FAQ and document retrieval" sx={{ color: isDark ? '#ffd54f' : '#222', fontSize: isDark ? '1.08rem' : '1.05rem', fontWeight: 500 }} /></ListItem>
                <ListItem><ListItemIcon><CheckCircleIcon sx={{ color: isDark ? '#ffd54f' : '#388e3c' }} /></ListItemIcon><ListItemText primary="Personalized recommendations" sx={{ color: isDark ? '#ffd54f' : '#222', fontSize: isDark ? '1.08rem' : '1.05rem', fontWeight: 500 }} /></ListItem>
                <ListItem><ListItemIcon><CheckCircleIcon sx={{ color: isDark ? '#ffd54f' : '#388e3c' }} /></ListItemIcon><ListItemText primary="Integration with student handbook and exam manual" sx={{ color: isDark ? '#ffd54f' : '#222', fontSize: isDark ? '1.08rem' : '1.05rem', fontWeight: 500 }} /></ListItem>
              </List>
              <Typography variant="subtitle1" sx={{ color: isDark ? '#ffe082' : '#795548', fontWeight: 600, mt: 2, fontSize: isDark ? '1.2rem' : '1rem' }}><BlockIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: isDark ? '#ffd54f' : '#795548' }} />Limitations</Typography>
              <List dense>
                <ListItem><ListItemIcon><BlockIcon sx={{ color: isDark ? '#ffd54f' : '#fbc02d' }} /></ListItemIcon><ListItemText primary="May not answer highly specialized or non-documented queries" sx={{ color: isDark ? '#ffd54f' : '#b71c1c', fontSize: isDark ? '1.08rem' : '1.05rem', fontWeight: 500 }} /></ListItem>
                <ListItem><ListItemIcon><BlockIcon sx={{ color: isDark ? '#ffd54f' : '#fbc02d' }} /></ListItemIcon><ListItemText primary="Dependent on available documents and training data" sx={{ color: isDark ? '#ffd54f' : '#b71c1c', fontSize: isDark ? '1.08rem' : '1.05rem', fontWeight: 500 }} /></ListItem>
              </List>
              <Typography variant="subtitle1" sx={{ color: isDark ? '#ffe082' : '#795548', fontWeight: 600, mt: 2, fontSize: isDark ? '1.2rem' : '1rem' }}><PlayArrowIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle', color: isDark ? '#ffd54f' : '#1976d2' }} />Usage</Typography>
              <List dense>
                <ListItem><ListItemIcon><PlayArrowIcon sx={{ color: isDark ? '#ffd54f' : '#1976d2' }} /></ListItemIcon><ListItemText primary="Access via the web portal" sx={{ color: isDark ? '#ffd54f' : '#1976d2', fontSize: isDark ? '1.08rem' : '1.05rem', fontWeight: 500 }} /></ListItem>
                <ListItem><ListItemIcon><PlayArrowIcon sx={{ color: isDark ? '#ffd54f' : '#1976d2' }} /></ListItemIcon><ListItemText primary="Enter queries in the chat interface" sx={{ color: isDark ? '#ffd54f' : '#1976d2', fontSize: isDark ? '1.08rem' : '1.05rem', fontWeight: 500 }} /></ListItem>
                <ListItem><ListItemIcon><PlayArrowIcon sx={{ color: isDark ? '#ffd54f' : '#1976d2' }} /></ListItemIcon><ListItemText primary="Receives instant responses and document links" sx={{ color: isDark ? '#ffd54f' : '#1976d2', fontSize: isDark ? '1.08rem' : '1.05rem', fontWeight: 500 }} /></ListItem>
              </List>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Divider sx={{ my: 4, borderColor: isDark ? '#795548' : '#e0c7b7' }} />

      {/* Booking Agent */}
      <Card sx={{ mb: 4, boxShadow: isDark ? 8 : 2, bgcolor: isDark ? '#282c34' : '#f9f6f2', borderRadius: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={4} flexWrap="wrap">
            <Avatar src={agentImages.booking} alt="Booking Agent" sx={{ width: 120, height: 120, borderRadius: 4, boxShadow: isDark ? 8 : 2, bgcolor: isDark ? '#23272f' : '#fff' }} />
            <Box flex={1}>
              <Typography variant="h5" sx={{ color: isDark ? '#e0c7b7' : '#6d4c41', mt: 0, fontWeight: 700 }}>2. Booking Agent (Room Booking Assistant)</Typography>
              <Typography variant="subtitle1" sx={{ color: isDark ? '#e0c7b7' : '#795548', fontWeight: 600, mb: 1 }}><InfoIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Purpose</Typography>
              <Typography variant="body2" gutterBottom>The Booking Agent streamlines the process of booking rooms and resources for students, faculty, and staff.</Typography>
              <Typography variant="subtitle1" sx={{ color: isDark ? '#e0c7b7' : '#795548', fontWeight: 600, mt: 2 }}><CheckCircleIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Capabilities</Typography>
              <List dense>
                <ListItem><ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon><ListItemText primary="Room availability checking" /></ListItem>
                <ListItem><ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon><ListItemText primary="Booking requests and confirmations" /></ListItem>
                <ListItem><ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon><ListItemText primary="Conflict resolution and scheduling" /></ListItem>
                <ListItem><ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon><ListItemText primary="Integration with campus calendar" /></ListItem>
              </List>
              <Typography variant="subtitle1" sx={{ color: isDark ? '#e0c7b7' : '#795548', fontWeight: 600, mt: 2 }}><BlockIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Limitations</Typography>
              <List dense>
                <ListItem><ListItemIcon><BlockIcon color="warning" /></ListItemIcon><ListItemText primary="Limited to rooms and resources registered in the system" /></ListItem>
                <ListItem><ListItemIcon><BlockIcon color="warning" /></ListItemIcon><ListItemText primary="May not handle last-minute changes or cancellations automatically" /></ListItem>
              </List>
              <Typography variant="subtitle1" sx={{ color: isDark ? '#e0c7b7' : '#795548', fontWeight: 600, mt: 2 }}><PlayArrowIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Usage</Typography>
              <List dense>
                <ListItem><ListItemIcon><PlayArrowIcon color="primary" /></ListItemIcon><ListItemText primary="Select desired room and time slot" /></ListItem>
                <ListItem><ListItemIcon><PlayArrowIcon color="primary" /></ListItemIcon><ListItemText primary="Submit booking request" /></ListItem>
                <ListItem><ListItemIcon><PlayArrowIcon color="primary" /></ListItemIcon><ListItemText primary="Receive confirmation or alternative suggestions" /></ListItem>
              </List>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Divider sx={{ my: 4, borderColor: isDark ? '#795548' : '#e0c7b7' }} />

      {/* Planner Agent */}
      <Card sx={{ mb: 4, boxShadow: isDark ? 8 : 2, bgcolor: isDark ? '#282c34' : '#f9f6f2', borderRadius: 4 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={4} flexWrap="wrap">
            <Avatar src={agentImages.planner} alt="Planner Agent" sx={{ width: 120, height: 120, borderRadius: 4, boxShadow: isDark ? 8 : 2, bgcolor: isDark ? '#23272f' : '#fff' }} />
            <Box flex={1}>
              <Typography variant="h5" sx={{ color: isDark ? '#e0c7b7' : '#6d4c41', mt: 0, fontWeight: 700 }}>3. Planner Agent</Typography>
              <Typography variant="subtitle1" sx={{ color: isDark ? '#e0c7b7' : '#795548', fontWeight: 600, mb: 1 }}><InfoIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Purpose</Typography>
              <Typography variant="body2" gutterBottom>The Planner Agent helps users organize tasks, schedules, and deadlines, enhancing productivity and time management.</Typography>
              <Typography variant="subtitle1" sx={{ color: isDark ? '#e0c7b7' : '#795548', fontWeight: 600, mt: 2 }}><CheckCircleIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Capabilities</Typography>
              <List dense>
                <ListItem><ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon><ListItemText primary="Task creation and tracking" /></ListItem>
                <ListItem><ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon><ListItemText primary="Calendar integration" /></ListItem>
                <ListItem><ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon><ListItemText primary="Automated reminders" /></ListItem>
                <ListItem><ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon><ListItemText primary="Progress analytics" /></ListItem>
              </List>
              <Typography variant="subtitle1" sx={{ color: isDark ? '#e0c7b7' : '#795548', fontWeight: 600, mt: 2 }}><BlockIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Limitations</Typography>
              <List dense>
                <ListItem><ListItemIcon><BlockIcon color="warning" /></ListItemIcon><ListItemText primary="Reminders and analytics depend on user input accuracy" /></ListItem>
                <ListItem><ListItemIcon><BlockIcon color="warning" /></ListItemIcon><ListItemText primary="Integration with external calendars may require setup" /></ListItem>
              </List>
              <Typography variant="subtitle1" sx={{ color: isDark ? '#e0c7b7' : '#795548', fontWeight: 600, mt: 2 }}><PlayArrowIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Usage</Typography>
              <List dense>
                <ListItem><ListItemIcon><PlayArrowIcon color="primary" /></ListItemIcon><ListItemText primary="Add tasks and deadlines" /></ListItem>
                <ListItem><ListItemIcon><PlayArrowIcon color="primary" /></ListItemIcon><ListItemText primary="View calendar and progress" /></ListItem>
                <ListItem><ListItemIcon><PlayArrowIcon color="primary" /></ListItemIcon><ListItemText primary="Receive reminders and analytics" /></ListItem>
              </List>
            </Box>
          </Box>
        </CardContent>
      </Card>
      <Divider sx={{ my: 4, borderColor: isDark ? '#795548' : '#e0c7b7' }} />

      <Typography variant="h5" sx={{ color: isDark ? '#ffe0b2' : '#4e342e', fontWeight: 600, fontSize: isDark ? '2rem' : '1.5rem' }}>Contact & Support</Typography>
      <Typography variant="body1" gutterBottom sx={{ color: isDark ? '#f4f6fa' : '#2c3e50', fontSize: isDark ? '1.2rem' : '1rem' }}>
        For further assistance, contact the development team or refer to the README for setup instructions.
      </Typography>
    </Box>
  );
};

export default DocumentationSection;

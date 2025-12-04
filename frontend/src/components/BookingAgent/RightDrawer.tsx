import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import axios from 'axios';
import { fetchUserEmailFromProfile } from "../../services/api";
import { getAccessToken } from '../../services/authAPI';
import { useTheme } from "../../context/ThemeContext";
import { Badge } from '@mui/material';
import { useNotification } from '../../context/NotificationContext';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MessageIcon from '@mui/icons-material/Message';
import InboxIcon from '@mui/icons-material/Inbox';

type SwapRequest = {
  id: number;
  status: string;
  created_at: string;
  requested_by: number;
  offered_by: number;
  requester_name: string;
  offerer_name: string;
  requester_email: string;
  offerer_email: string;
  requested_module_code: string;
  offered_module_code: string;
  requested_time_slot: string;
  offered_time_slot: string;
  requested_room_name: string;
  offered_room_name: string;
  message: string;
};

export default function RightDrawer({ openProp }: any) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState<string | null>(null);
  const [numberOfReceivedRequests, setNumberOfReceivedRequests] = React.useState(0);
  const { notify } = useNotification();
  const [requests, setRequests] = React.useState<SwapRequest[]>([]);
  const [filter, setFilter] = React.useState<'all' | 'received' | 'sent'>('all');
  const { theme } = useTheme();
  const isDark = theme === "dark";

  React.useEffect(() => {
    const getEmail = async () => {
      try {
        const userEmail = await fetchUserEmailFromProfile();
        console.log("userEmail", userEmail);
        setEmail(userEmail);
      } catch (error) {
        console.error("Error fetching user email:", error);
        notify('error', "❌ Failed to fetch user email");
      }
    };
    getEmail();
  }, []);

  React.useEffect(() => {
    if (email) {
      fetchSwapRequests();
    }
  }, [email, open, openProp]);

  const fetchSwapRequests = async () => {
    if (!email) {
      console.log("Email not available yet, skipping fetch");
      return;
    }
    try {
      const token = getAccessToken();
      if (!token) {
        notify('error', "❌ No authentication token found");
        return;
      }

      const response = await axios.get(
        `${process.env.REACT_APP_HBA_URL}/swap/get_all_requests`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Filter requests where current user is involved
      const filteredRequests = response.data.filter((req: SwapRequest) => 
        req.requester_email === email || req.offerer_email === email
      );
      
      setRequests(filteredRequests);

      // Count received requests (where current user is the offerer)
      const filteredReceivedRequests = filteredRequests.filter((req: SwapRequest) => 
        req.offerer_email === email
      );
      setNumberOfReceivedRequests(filteredReceivedRequests.length);
      
      console.log("Filtered requests:", filteredRequests);
      console.log("User email:", email);
    } catch (error) {
      console.error("Error fetching swap requests:", error);
      notify('error', "❌ Failed to fetch swap requests.");
    }
  };

  const toggleDrawer = (open: boolean) => (event: React.KeyboardEvent | React.MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as React.KeyboardEvent).key === 'Tab' || (event as React.KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setOpen(open);
  };

  const handleSwap = async (id: number) => {
    try {
      const token = getAccessToken();
      const response = await axios.post(
        `${process.env.REACT_APP_HBA_URL}/swap/respond?swap_id=${id}&response=approved`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        notify('success', "✅ Swap request approved successfully!");
        fetchSwapRequests();
      }
    } catch (error) {
      notify('error', "❌ Failed to approve swap request.");
      console.error('Error approving swap request:', error);
    }
  };

  const handleReject = async (id: number) => {
    try {
      const token = getAccessToken();
      const response = await axios.post(
        `${process.env.REACT_APP_HBA_URL}/swap/respond?swap_id=${id}&response=rejected`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        fetchSwapRequests();
        notify('success', "✅ Swap request rejected successfully!");
      }
    } catch (error) {
      notify('error', "❌ Failed to reject swap request.");
      console.error('Error rejecting swap request:', error);
    }
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'Yesterday';
      if (diffInDays < 7) return `${diffInDays}d ago`;
      return date.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };

  const sentCount = requests.filter(r => r.requester_email === email).length;
  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    if (filter === 'received') return req.offerer_email === email;
    return req.requester_email === email;
  });

  // Format message to be more concise
  const formatMessage = (req: SwapRequest) => {
    const isReceived = req.offerer_email === email;
    
    if (isReceived) {
      // Format: "Module Code in Room Name (Time)"
      return `${req.requested_module_code || 'N/A'} in ${req.requested_room_name || 'Unknown'} (${req.requested_time_slot || 'N/A'})`;
    } else {
      // For sent requests, show what they're offering
      return `${req.offered_module_code || 'N/A'} in ${req.offered_room_name || 'Unknown'} (${req.offered_time_slot || 'N/A'})`;
    }
  };

  const list = () => (
    <Box className="professional-drawer-inner" sx={{ width: 480, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box className="professional-drawer-header">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box className="professional-header-icon">
            <SwapHorizIcon sx={{ fontSize: 24 }} />
          </Box>
          <Box>
            <Box component="h2" className="professional-header-title">Swap Requests</Box>
            <Box component="p" className="professional-header-subtitle">
              {requests.length} active request{requests.length !== 1 ? 's' : ''}
            </Box>
          </Box>
        </Box>
        <Button onClick={toggleDrawer(false)} className="professional-close-btn" sx={{ minWidth: 36 }}>
          <CloseIcon />
        </Button>
      </Box>

      {/* Filter Tabs */}
      <Box className="professional-filter-tabs">
        <Button
          className={`professional-filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          <span>All</span>
          <span className="professional-tab-count">{requests.length}</span>
        </Button>
        <Button
          className={`professional-filter-tab ${filter === 'received' ? 'active' : ''}`}
          onClick={() => setFilter('received')}
        >
          <span>Received</span>
          <span className="professional-tab-count">{numberOfReceivedRequests}</span>
        </Button>
        <Button
          className={`professional-filter-tab ${filter === 'sent' ? 'active' : ''}`}
          onClick={() => setFilter('sent')}
        >
          <span>Sent</span>
          <span className="professional-tab-count">{sentCount}</span>
        </Button>
      </Box>

      {/* Requests List */}
      <Box className="professional-requests-list">
        {filteredRequests.length === 0 ? (
          <Box className="professional-empty-state">
            <InboxIcon sx={{ fontSize: 64, opacity: 0.3, color: '#6b4b3a' }} />
            <Box component="h3" className="professional-empty-title">No requests found</Box>
            <Box component="p" className="professional-empty-text">
              You don't have any {filter !== 'all' ? filter : ''} swap requests at the moment.
            </Box>
          </Box>
        ) : (
          filteredRequests.map((req) => {
            const isReceived = req.offerer_email === email;
            const displayName = isReceived ? req.requester_name : req.offerer_name;
            const displayInitial = displayName ? displayName.charAt(0).toUpperCase() : 'U';
            
            return (
              <Box key={req.id} className="professional-request-card">
                <Box className="professional-card-header">
                  <Box className="professional-user-info">
                    <Box className="professional-avatar">
                      {displayInitial}
                    </Box>
                    <Box className="professional-user-details">
                      <Box className="professional-user-name">
                        {displayName || 'Unknown User'}
                      </Box>
                      <Box className="professional-request-type-badge">
                        {isReceived ? 'Incoming' : 'Outgoing'}
                      </Box>
                    </Box>
                  </Box>
                  <Box className="professional-time-info">
                    <AccessTimeIcon sx={{ fontSize: 14 }} />
                    <span>{formatTimeAgo(req.created_at)}</span>
                  </Box>
                </Box>

                <Box className="professional-swap-details">
                  <MessageIcon sx={{ fontSize: 16, color: '#6b4b3a', flexShrink: 0, mt: '2px' }} />
                  <Box component="div">
                    <Box component="p" sx={{ mb: 1, fontWeight: 600, fontSize: '13px' }}>
                      {isReceived ? 'Requesting:' : 'Your Offer:'}
                    </Box>
                    <Box component="p" sx={{ fontSize: '14px', lineHeight: 1.6 }}>
                      {formatMessage(req)}
                    </Box>
                    {req.requested_time_slot && req.offered_time_slot && (
                      <Box component="p" sx={{ mt: 1, fontSize: '12px', opacity: 0.8 }}>
                        {isReceived 
                          ? `↔ Offering: ${req.offered_module_code} in ${req.offered_room_name} (${req.offered_time_slot})`
                          : `↔ Requesting: ${req.requested_module_code} in ${req.requested_room_name} (${req.requested_time_slot})`
                        }
                      </Box>
                    )}
                  </Box>
                </Box>

                <Box className="professional-action-buttons">
                  {!isReceived ? (
                    <Button
                      className="professional-btn-cancel"
                      onClick={() => handleReject(req.id)}
                      fullWidth
                    >
                      <CloseIcon sx={{ fontSize: 18 }} />
                      Cancel Request
                    </Button>
                  ) : (
                    <>
                      <Button
                        className="professional-btn-approve"
                        onClick={() => handleSwap(req.id)}
                        fullWidth
                      >
                        <CheckIcon sx={{ fontSize: 18 }} />
                        Accept
                      </Button>
                      <Button
                        className="professional-btn-reject"
                        onClick={() => handleReject(req.id)}
                        fullWidth
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                        Decline
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );

  return (
    <div>
      <Button
        variant="contained"
        onClick={toggleDrawer(true)}
        className="btn-brown"
        startIcon={<SwapHorizIcon />}
        sx={{
          textTransform: "none",
          display: "flex",
          alignItems: "center",
          gap: 1.5, 
          padding: "8px 20px",
          borderRadius: "12px",
          fontWeight: 600,
        }}
      >
        Swap Requests
        {numberOfReceivedRequests > 0 && (
          <Badge
            badgeContent={numberOfReceivedRequests}
            sx={{
              '& .MuiBadge-badge': {
                background: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
                color: 'white',
                fontWeight: 700,
                animation: 'pulse 2s infinite',
              }
            }}
          />
        )}
      </Button>
      <Drawer
        anchor="right"
        open={open}
        onClose={toggleDrawer(false)}
        PaperProps={{
          className: "professional-drawer-paper",
          "data-theme": isDark ? "dark" : "light",
        }}
      >
        {list()}
      </Drawer>
    </div>
  );
}
import React from 'react';

interface UserProfileProps {
  userProfile: any;
  onLogout: () => void;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ userProfile, onLogout, onClose }) => {
  return (
    <div className="user-profile-sidebar">
      <div className="user-profile-overlay" onClick={onClose}></div>
      <div className="user-profile-content">
        <div className="user-profile-header">
          <h3>User Profile</h3>
          <button className="close-profile-btn" onClick={onClose}>×</button>
        </div>
        <div className="user-profile-info">
          <div className="user-details">
            {userProfile ? (
              userProfile.email.endsWith('@engug.ruh.ac.lk') ? (
                <>
                  <h4>{userProfile.firstname} {userProfile.lastname}</h4>
                  <p className="user-email">{userProfile.email}</p>
                  {userProfile.department && <p className="user-department">Department: {userProfile.department}</p>}
                </>
              ) : (
                <>
                  <h4>{userProfile.title} {userProfile.firstname} {userProfile.lastname}</h4>
                  <p className="user-email">{userProfile.email}</p>
                  {userProfile.department && <p className="user-department">Department: {userProfile.department}</p>}
                </>
              )
            ) : (
              <p>Loading profile...</p>
            )}
          </div>
        </div>
        <div className="user-profile-actions">
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

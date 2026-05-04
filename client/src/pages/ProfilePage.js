import React from 'react';
import { Container, Typography } from '@mui/material';

function ProfilePage() {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Profile Settings
      </Typography>
      <Typography variant="body1">
        Manage your profile information.
      </Typography>
    </Container>
  );
}

export default ProfilePage;

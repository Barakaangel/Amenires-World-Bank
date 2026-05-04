import React from 'react';
import { Container, Typography } from '@mui/material';

function TransactionsPage() {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Transactions
      </Typography>
      <Typography variant="body1">
        View your transaction history.
      </Typography>
    </Container>
  );
}

export default TransactionsPage;

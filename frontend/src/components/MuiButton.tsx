import React from 'react';
import Button, { ButtonProps } from '@mui/material/Button';

export default function MuiButton(props: ButtonProps) {
  return <Button variant="contained" color="primary" {...props} />;
}

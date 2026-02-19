import { styled } from '@/src/stitches.config';

export const Button = styled('button', {
  background: '$accent',
  color: '$secondary',
  borderRadius: '$md',
  fontFamily: '$sans',
  fontWeight: 600,
  padding: '$md $lg',
  border: 'none',
  cursor: 'pointer',
  transition: 'background 0.2s',
  '&:hover': { background: '$primary', color: '$accent' },
  '&:disabled': { opacity: 0.5, cursor: 'not-allowed' },
});

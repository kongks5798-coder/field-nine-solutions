import * as React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export default function DalkakLogo(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 48 48">
      <defs>
        <linearGradient id="dk-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#f43f5e" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#dk-gradient)" />
      <text x="24" y="33" textAnchor="middle" fontWeight="900" fontSize="26" fill="#fff" fontFamily="Inter, Pretendard, Arial, sans-serif">D</text>
    </SvgIcon>
  );
}

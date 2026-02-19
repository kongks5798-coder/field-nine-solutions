import * as React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';

export default function FieldNineLogo(props: SvgIconProps) {
  return (
    <SvgIcon {...props} viewBox="0 0 48 48">
      <defs>
        <radialGradient id="fn-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00eaff" />
          <stop offset="100%" stopColor="#1976d2" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill="url(#fn-gradient)" />
      <text x="24" y="22" textAnchor="middle" fontWeight="bold" fontSize="11" fill="#fff" fontFamily="Inter, Pretendard, Arial, sans-serif">Field</text>
      <text x="24" y="34" textAnchor="middle" fontWeight="bold" fontSize="13" fill="#fff" fontFamily="Inter, Pretendard, Arial, sans-serif">나인</text>
    </SvgIcon>
  );
}

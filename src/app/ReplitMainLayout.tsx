import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FieldNineLogo from '../components/WooriLogo';
import FileTree from '../components/FileTree';
import CodeEditor from '../components/CodeEditor';
import RunPreviewPanel from '../components/RunPreviewPanel';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    background: { default: '#f4f6fa', paper: '#fff' },
  },
  typography: {
    fontFamily: 'Inter, Pretendard, Arial, sans-serif',
    fontWeightBold: 800,
  },
});


export default function ReplitMainLayout() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* 좌측 파일트리 */}
        <FileTree />
        {/* 중앙 코드 에디터 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#fff' }}>
            <FieldNineLogo sx={{ width: 40, height: 40, mr: 2 }} />
            <Typography variant="h5" fontWeight={800} color="primary">Dalkak OS <span style={{fontSize:15, color:'#1976d2', fontWeight:600}}>(딸깍)</span></Typography>
            <Box flex={1} />
            <Button color="primary" variant="outlined" sx={{ mr: 1 }}>로그인 / Login</Button>
            <Button color="primary" variant="contained">회원가입 / Sign Up</Button>
          </Box>
          <CodeEditor />
        </Box>
        {/* 우측 실행/프리뷰/테스트/에러 */}
        <RunPreviewPanel />
      </Box>
    </ThemeProvider>
  );
}

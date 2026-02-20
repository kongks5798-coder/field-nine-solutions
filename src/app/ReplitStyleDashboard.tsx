import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import ChatIcon from '@mui/icons-material/Chat';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GroupIcon from '@mui/icons-material/Group';
import StorageIcon from '@mui/icons-material/Storage';
import ErrorIcon from '@mui/icons-material/Error';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
    background: { default: '#181824', paper: '#23243a' },
  },
  typography: {
    fontFamily: 'Inter, Pretendard, Arial, sans-serif',
    fontWeightBold: 800,
  },
});

export default function ReplitStyleDashboard() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Box textAlign="center" mb={5}>
          <Avatar src="/logo.png" sx={{ width: 64, height: 64, mx: 'auto', mb: 2 }} />
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Fieldnine Dashboard
          </Typography>
        </Box>
        <Grid container spacing={3} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <ChatIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">AI 자동화</Typography>
              <Typography variant="h5" fontWeight={700}>99.9%</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <GroupIcon color="secondary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">실시간 협업</Typography>
              <Typography variant="h5" fontWeight={700}>24명</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <StorageIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">클라우드 파일</Typography>
              <Typography variant="h5" fontWeight={700}>1024</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', mx: 'auto', mb: 1, width: 32, height: 32 }}>관</Avatar>
              <Typography variant="subtitle2" color="text.secondary">관리자</Typography>
              <Typography variant="h5" fontWeight={700}>3</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#2d1a1a' }}>
              <ErrorIcon color="error" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="subtitle2" color="error">에러</Typography>
              <Typography variant="h5" fontWeight={700} color="error">0</Typography>
            </Paper>
          </Grid>
        </Grid>
        <Grid container spacing={2} mb={4}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button fullWidth variant="contained" color="primary" size="large">AI 자동 실행</Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button fullWidth variant="contained" color="secondary" size="large">협업 시작</Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button fullWidth variant="contained" color="success" size="large">클라우드 파일 관리</Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button fullWidth variant="contained" color="inherit" size="large" startIcon={<CloudUploadIcon />}>파일 업로드</Button>
          </Grid>
        </Grid>
        <Box mb={4} textAlign="center">
          <Button variant="outlined" color="primary" sx={{ mr: 2 }}>배포 보고서 보기</Button>
          <Button variant="outlined" color="success">테스트 결과 보기</Button>
        </Box>
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" fontWeight={700} mb={2}>실시간 채팅</Typography>
          <Box sx={{ bgcolor: '#181824', borderRadius: 2, p: 2, minHeight: 80, mb: 2 }}>
            <Typography color="text.secondary">채팅 내역 없음</Typography>
          </Box>
          <Box display="flex" gap={2}>
            <input placeholder="메시지 입력..." style={{ flex: 1, borderRadius: 8, border: '1px solid #444', background: '#23243a', color: '#fff', padding: '0.7rem 1rem', fontSize: 16 }} />
            <Button variant="contained" color="primary">전송</Button>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

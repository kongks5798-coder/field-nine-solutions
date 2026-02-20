import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import WooriLogo from '../components/WooriLogo';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#FF5722' },
    background: { default: '#fff', paper: '#f7f7fa' },
  },
  typography: {
    fontFamily: 'Inter, Pretendard, Arial, sans-serif',
    fontWeightBold: 800,
  },
});

export default function ReplitMainLayoutResponsive() {
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [tab, setTab] = React.useState(0);
  const [chat, setChat] = React.useState([
    { user: 'AI', text: '안녕하세요! 무엇을 도와드릴까요?' }
  ]);
  const [input, setInput] = React.useState('');

  const handleTabChange = (_: any, newValue: number) => setTab(newValue);
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { user: '나', text: input, timestamp: new Date().toISOString() };
    setChat([...chat, userMsg]);
    setInput('');
    // 실제 로그 자동 수집
    try {
      await fetch('/api/log-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userMsg)
      });
    } catch {}
    setTimeout(() => {
      const aiMsg = { user: 'AI', text: '자동 응답: ' + input, timestamp: new Date().toISOString() };
      setChat(c => [...c, aiMsg]);
      // AI 응답도 로그 자동 수집
      fetch('/api/log-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiMsg)
      });
    }, 500);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth={isMobile ? 'sm' : 'lg'} sx={{ py: isMobile ? 2 : 4 }}>
        <Box display="flex" alignItems="center" mb={isMobile ? 2 : 4}>
          <WooriLogo sx={{ width: isMobile ? 36 : 48, height: isMobile ? 36 : 48, mr: 2 }} />
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={800} color="primary">우리 OS</Typography>
          <Box flex={1} />
          {!isMobile && <Button color="primary" variant="outlined" sx={{ mr: 1 }}>로그인</Button>}
          <Button color="primary" variant="contained" size={isMobile ? 'small' : 'medium'}>회원가입</Button>
        </Box>
        <Box textAlign="center" mb={isMobile ? 2 : 4}>
          <Typography variant={isMobile ? 'h4' : 'h3'} fontWeight={800} gutterBottom>What will you build?</Typography>
          <Tabs value={tab} onChange={handleTabChange} centered sx={{ mb: 2 }} variant={isMobile ? 'fullWidth' : 'standard'}>
            <Tab label="앱(App)" />
            <Tab label="디자인(Design)" />
          </Tabs>
          <Paper sx={{ p: isMobile ? 2 : 3, maxWidth: 600, mx: 'auto', mb: 2 }}>
            <TextField
              fullWidth
              placeholder={tab === 0 ? 'Make a software application that...' : '디자인 아이디어를 입력하세요...'}
              variant="outlined"
              InputProps={{
                endAdornment: (
                  <Button variant="contained" color="primary" size={isMobile ? 'small' : 'medium'}>Start</Button>
                )
              }}
            />
          </Paper>
        </Box>
        <Grid container spacing={2} mb={isMobile ? 2 : 4}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper sx={{ p: isMobile ? 1 : 2, textAlign: 'center' }}>
              <Typography>AI Apps</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper sx={{ p: isMobile ? 1 : 2, textAlign: 'center' }}>
              <Typography>Websites</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper sx={{ p: isMobile ? 1 : 2, textAlign: 'center' }}>
              <Typography>Business Apps</Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <Paper sx={{ p: isMobile ? 1 : 2, textAlign: 'center' }}>
              <Typography>Personal Software</Typography>
            </Paper>
          </Grid>
        </Grid>
        <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={700} mb={2}>실시간 채팅 / Real-time Chat</Typography>
        <Paper sx={{ p: isMobile ? 1 : 2, mb: 2, minHeight: 80 }}>
          {chat.map((msg, i) => (
            <Box key={i} sx={{ mb: 1, color: msg.user === 'AI' ? 'primary.main' : 'text.primary', fontSize: isMobile ? 14 : 16 }}>
              <b>{msg.user}:</b> {msg.text}
            </Box>
          ))}
        </Paper>
        <Box display="flex" gap={1}>
          <TextField
            fullWidth
            placeholder="메시지 입력... / Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            size={isMobile ? 'small' : 'medium'}
          />
          <IconButton color="primary" onClick={handleSend} size={isMobile ? 'small' : 'medium'}><SendIcon /></IconButton>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

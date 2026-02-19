import * as React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';

export default function RunPreviewPanel() {
  const [output, setOutput] = React.useState('');
  const [error, setError] = React.useState('');
  const [videoUrl, setVideoUrl] = React.useState('');

  const handleRun = () => {
    setError('');
    setOutput('Hello, FieldNine!\n실행 결과가 여기에 표시됩니다.');
    setVideoUrl('https://www.w3schools.com/html/mov_bbb.mp4'); // 데모용 영상
  };

  const handleFixError = () => {
    setError('에러가 자동으로 수정되었습니다! (AI Auto Fix)');
    setOutput('수정 후 정상 실행!');
  };

  return (
    <Box sx={{
      width: 360,
      bgcolor: '#f9fafc',
      height: '100vh',
      borderLeft: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 2px 16px 0 #b6d6f6cc',
      transition: 'box-shadow 0.2s',
      minWidth: 0,
    }}>
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', bgcolor: '#fff' }}>
        <Typography fontWeight={700} color="primary">실행 & 프리뷰 / Run & Preview</Typography>
        <Typography variant="caption" color="text.secondary">코드를 실행하면 결과, 에러, 테스트 영상까지 한 번에 확인!<br/>Run code to see output, errors, and test video preview.</Typography>
      </Box>
      <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mb: 2, transition: 'background 0.18s', fontWeight: 700, letterSpacing: 1, boxShadow: '0 2px 8px 0 #90caf9' }}
          onClick={handleRun}
          onMouseDown={e => e.currentTarget.style.background = '#1976d2'}
          onMouseUp={e => e.currentTarget.style.background = ''}
        >
          코드 실행 / Run Code
        </Button>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
          ⚡️ AI가 에러를 자동으로 감지하고, 수정까지 도와줍니다.<br/>
          AI auto-detects and fixes errors for you.
        </Typography>
        {output && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd' }}>
            <Typography fontWeight={600} color="primary">실행 결과 / Output</Typography>
            <Typography sx={{ whiteSpace: 'pre-line' }}>{output}</Typography>
          </Paper>
        )}
        {error && (
          <Paper sx={{ p: 2, mb: 2, bgcolor: '#ffebee' }}>
            <Typography fontWeight={600} color="error">에러 / Error</Typography>
            <Typography sx={{ whiteSpace: 'pre-line' }}>{error}</Typography>
            <Button variant="outlined" color="error" onClick={handleFixError} sx={{ mt: 1 }}>에러 자동수정 / Auto Fix</Button>
          </Paper>
        )}
        {videoUrl && (
          <Box>
            <Typography fontWeight={600} sx={{ mb: 1 }}>테스트 영상 프리뷰 / Test Video Preview</Typography>
            <video src={videoUrl} controls style={{ width: '100%', borderRadius: 8 }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

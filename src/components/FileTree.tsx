import * as React from 'react';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Box, Typography, List, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

// 더미 파일/폴더 구조
const dummyTree = [
  { type: 'folder', name: 'src', children: [
    { type: 'file', name: 'main.tsx' },
    { type: 'file', name: 'App.tsx' },
    { type: 'folder', name: 'components', children: [
      { type: 'file', name: 'Header.tsx' },
      { type: 'file', name: 'Footer.tsx' },
    ]},
  ]},
  { type: 'folder', name: 'public', children: [
    { type: 'file', name: 'index.html' }
  ]},
  { type: 'file', name: 'package.json' },
  { type: 'file', name: 'README.md' }
];

function renderTree(tree: any[], depth = 0) {
  return tree.map((node, idx) => (
    <React.Fragment key={node.name + depth + idx}>
      <ListItemButton
        sx={{
          pl: 2 + depth * 2,
          borderRadius: 1,
          transition: 'background 0.18s',
          '&:hover': {
            bgcolor: '#e3f2fd',
            boxShadow: '0 1px 6px 0 #b6d6f6',
            color: 'primary.main',
          },
          '&:active': {
            bgcolor: '#bbdefb',
          },
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>{node.type === 'folder' ? <FolderIcon color="primary" /> : <InsertDriveFileIcon color="action" />}</ListItemIcon>
        <ListItemText primary={node.name} />
      </ListItemButton>
      {node.type === 'folder' && node.children && renderTree(node.children, depth + 1)}
    </React.Fragment>
  ));
}

export default function FileTree() {
  return (
    <Box sx={{ width: 260, bgcolor: '#f4f6fa', height: '100vh', borderRight: '1px solid #e0e0e0', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, pb: 1, borderBottom: '1px solid #e0e0e0', bgcolor: '#f9fafc' }}>
        <Typography fontWeight={700} color="primary">프로젝트 파일 / Project Files</Typography>
        <Typography variant="caption" color="text.secondary">좌측에서 파일을 선택하거나 새 파일을 추가해보세요.<br/>Select or add files from the left panel.</Typography>
      </Box>
      <List dense sx={{ flex: 1 }}>
        {renderTree(dummyTree)}
      </List>
      <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', bgcolor: '#f9fafc', textAlign: 'center' }}>
        <Typography variant="caption" color="primary">빠르고 안전한 실시간 저장<br/>Auto-save & Fast</Typography>
      </Box>
    </Box>
  );
}

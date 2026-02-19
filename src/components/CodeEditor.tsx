"use client";
import * as React from 'react';
import { Box, Typography, Select, MenuItem } from '@mui/material';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const LANGUAGES = ['typescript', 'javascript', 'python', 'html', 'css', 'json'];

const DEFAULT_CODE: Record<string, string> = {
  typescript: `import React from 'react';

function App() {
  return <h1>Hello, FieldNine!</h1>;
}

export default App;
`,
  javascript: `function hello() {
  console.log('Hello, FieldNine!');
}

hello();
`,
  python: `def hello():
    print("Hello, FieldNine!")

hello()
`,
  html: `<!DOCTYPE html>
<html>
  <body>
    <h1>Hello, FieldNine!</h1>
  </body>
</html>
`,
  css: `body {
  background: #181824;
  color: #fff;
}
`,
  json: `{
  "name": "fieldnine",
  "version": "1.0.0"
}
`,
};

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  language?: string;
}

export default function CodeEditor({ value, onChange, language: langProp }: CodeEditorProps) {
  const [language, setLanguage] = React.useState(langProp || 'typescript');
  const [code, setCode] = React.useState(value || DEFAULT_CODE['typescript']);

  React.useEffect(() => {
    if (!value) setCode(DEFAULT_CODE[language] || '');
  }, [language]);

  const handleChange = (val: string | undefined) => {
    const newVal = val || '';
    setCode(newVal);
    onChange?.(newVal);
  };

  return (
    <Box sx={{
      flex: 1,
      bgcolor: '#1e1e1e',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      minWidth: 0,
    }}>
      <Box sx={{
        bgcolor: '#23272f',
        px: 2,
        py: 1,
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}>
        <Typography fontWeight={700} fontSize={15} color="#8be9fd">
          [필드나인 에디터]
        </Typography>
        <Select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          size="small"
          sx={{ bgcolor: '#181c24', color: '#fff', fontSize: 13, minWidth: 120,
            '& .MuiSelect-icon': { color: '#fff' },
            '& fieldset': { borderColor: '#444' },
          }}
        >
          {LANGUAGES.map(l => (
            <MenuItem key={l} value={l} sx={{ fontSize: 13 }}>{l}</MenuItem>
          ))}
        </Select>
        <Typography variant="caption" color="#888" sx={{ ml: 'auto' }}>
          ⌨️ 코드 입력 후 우측에서 실행 → Run →
        </Typography>
      </Box>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <MonacoEditor
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          onChange={handleChange}
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </Box>
    </Box>
  );
}

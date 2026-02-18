import SupabaseFileUpload from "./SupabaseFileUpload";
import SupabaseFileList from "./SupabaseFileList";
import { styled, globalCss } from "../../stitches.config";

const globalStyles = globalCss({
  body: {
    fontFamily: 'Google Sans, Arial, sans-serif',
    background: '#ECFEFF',
    color: '#171717',
    margin: 0,
    padding: 0,
    minHeight: '100vh',
  },
});

const Main = styled('main', {
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#ECFEFF',
  transition: 'background 0.3s',
});

const Card = styled('div', {
  background: '#fff',
  borderRadius: '32px',
  padding: '48px',
  boxShadow: '0 8px 32px 0 #22d3ee',
  border: '1.5px solid #A7F3F3',
  maxWidth: '480px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
});

const Title = styled('h1', {
  fontSize: '2.25rem',
  fontWeight: 700,
  marginBottom: '1.5rem',
  color: '#06B6D4',
  letterSpacing: '-0.01em',
});

const Desc = styled('p', {
  marginBottom: '2rem',
  color: '#164E63',
  fontSize: '1.1rem',
  textAlign: 'center',
});

const DemoNote = styled('div', {
  fontSize: '0.85rem',
  color: '#0891B2',
  opacity: 0.7,
});

export default function CloudPage() {
  globalStyles();
  return (
    <Main>
      <Card>
        <Title>OpenKlo Cloud</Title>
        <Desc>오픈소스 클라우드 파일 관리, 스토리지 연동 샘플 페이지입니다.<br />실제 파일 업로드/다운로드/리스트 기능은 추후 연동 가능합니다.</Desc>
        <SupabaseFileUpload />
        <SupabaseFileList />
        <DemoNote>(데모) 이 영역에 파일 리스트, 업로드, 다운로드 UI가 들어갑니다.</DemoNote>
      </Card>
    </Main>
  );
}

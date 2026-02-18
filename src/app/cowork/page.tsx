import { styled, globalCss } from "../../stitches.config";

const globalStyles = globalCss({
  body: {
    fontFamily: 'Google Sans, Arial, sans-serif',
    background: '#FFF8F1',
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
  background: '#FFF8F1',
  transition: 'background 0.3s',
});

const Card = styled('div', {
  background: '#fff',
  borderRadius: '32px',
  padding: '48px',
  boxShadow: '0 8px 32px 0 #fbbf24',
  border: '1.5px solid #FFD59E',
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
  color: '#FB923C',
  letterSpacing: '-0.01em',
});

const Desc = styled('p', {
  marginBottom: '2rem',
  color: '#7C4700',
  fontSize: '1.1rem',
  textAlign: 'center',
});

const DemoNote = styled('div', {
  fontSize: '0.85rem',
  color: '#B45309',
  opacity: 0.7,
});

export default function CoWorkPage() {
  globalStyles();
  return (
    <Main>
      <Card>
        <Title>CoWork</Title>
        <Desc>실시간 문서/보드/채팅 등 협업 툴 샘플 페이지입니다.<br />실제 실시간 협업 기능은 추후 연동 가능합니다.</Desc>
        <DemoNote>(데모) 이 영역에 실시간 문서, 보드, 채팅 UI가 들어갑니다.</DemoNote>
      </Card>
    </Main>
  );
}

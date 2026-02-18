import SupabaseChat from "./SupabaseChat";
import { styled, globalCss } from "../../stitches.config";

const globalStyles = globalCss({
  body: {
    fontFamily: 'Google Sans, Arial, sans-serif',
    background: '#FFF1F5',
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
  background: '#FFF1F5',
  transition: 'background 0.3s',
});

const Card = styled('div', {
  background: '#fff',
  borderRadius: '32px',
  padding: '48px',
  boxShadow: '0 8px 32px 0 #f472b6',
  border: '1.5px solid #FBCFE8',
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
  color: '#EC4899',
  letterSpacing: '-0.01em',
});

const Desc = styled('p', {
  marginBottom: '2rem',
  color: '#831843',
  fontSize: '1.1rem',
  textAlign: 'center',
});

export default function TeamPage() {
  globalStyles();
  return (
    <Main>
      <Card>
        <Title>TeamCloud</Title>
        <Desc>팀 멤버 관리, 실시간 협업, 채팅/노트/공유 샘플 페이지입니다.<br />실제 팀 관리/채팅/노트 기능은 추후 연동 가능합니다.</Desc>
        <SupabaseChat />
      </Card>
    </Main>
  );
}

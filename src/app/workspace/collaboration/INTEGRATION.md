# 협업 편집 통합 방법

## 현재 상태 (이미 통합됨)

`CollabPanel.tsx` + `WorkspaceEditorPane.tsx`는 이미 Yjs + WebRTC 협업을 완전히
지원합니다. 사이드 패널에서 "Real-time Collaboration"을 통해 바로 사용할 수 있습니다.

아래는 `useCollaboration` 훅과 `CollabBar` / `CollabInviteModal`을 page.tsx에
**직접** 통합하는 방법입니다 (패널 없이 툴바 인라인으로 표시하고 싶을 때).

---

## 1. page.tsx에서 import

```tsx
import dynamic from "next/dynamic";
import { useCollaboration } from "./collaboration/useCollaboration";
import { CollabBar } from "./collaboration/CollabBar";

const CollabInviteModal = dynamic(
  () => import("./collaboration/CollabInviteModal").then(m => ({ default: m.CollabInviteModal })),
  { ssr: false }
);
```

## 2. Hook 사용 (컴포넌트 상단)

```tsx
const collab = useCollaboration();
const [showInviteModal, setShowInviteModal] = useState(false);
const [collabRoomId, setCollabRoomId] = useState("");
```

## 3. URL에서 collab= 파라미터 읽기 (자동 조인)

```tsx
const searchParams = useSearchParams();

useEffect(() => {
  const roomFromUrl = searchParams.get("collab");
  if (roomFromUrl && !collab.isConnected) {
    setCollabRoomId(roomFromUrl);
    setShowInviteModal(true); // 이름 입력 후 자동 조인
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

## 4. 에디터 바인딩 (Monaco onMount 콜백에서)

```tsx
// WorkspaceEditorPane의 onMount prop 또는 editorRef에서:
const handleEditorMount = (editor: Monaco.editor.IStandaloneCodeEditor) => {
  if (collab.isConnected) {
    collab.bindEditor(editor, activeFile);
  }
};

// 또는 useEffect로 isConnected 상태 변화 감지:
useEffect(() => {
  if (collab.isConnected && editorRef.current) {
    const cleanup = collab.bindEditor(editorRef.current, activeFile);
    return () => { cleanup.then(fn => fn()); };
  }
}, [collab.isConnected, activeFile]);
```

## 5. CollabBar 렌더링 (툴바 영역에 추가)

```tsx
// 예: WorkspaceTopBar 또는 에디터 탭바 옆에
<CollabBar
  isActive={collab.isConnected}
  isConnected={collab.isConnected}
  peers={collab.peers}
  roomId={collabRoomId}
  onToggle={() => {
    if (collab.isConnected) {
      collab.disconnect();
    } else {
      setShowInviteModal(true);
    }
  }}
  onToast={(msg) => console.log(msg)} // 또는 WorkspaceToast 호출
/>
```

## 6. CollabInviteModal 렌더링

```tsx
{showInviteModal && (
  <CollabInviteModal
    initialRoomId={collabRoomId}
    onStart={(roomId, username) => {
      setCollabRoomId(roomId);
      setShowInviteModal(false);
      collab.connect(roomId, username);
    }}
    onClose={() => setShowInviteModal(false)}
  />
)}
```

---

## 기존 CollabPanel과의 관계

| 구성요소 | 위치 | 역할 |
|---|---|---|
| `collab/CollabProvider.ts` | `src/app/workspace/collab/` | Yjs + WebrtcProvider 생성 |
| `collab/MonacoBinding.ts` | `src/app/workspace/collab/` | Monaco ↔ Y.Text 바인딩 |
| `collab/AwarenessCursors.tsx` | `src/app/workspace/collab/` | 원격 커서 CSS |
| `collab/collabSessionHolder.ts` | `src/app/workspace/collab/` | 세션 모듈 공유 |
| `stores/useCollabStore.ts` | `src/app/workspace/stores/` | Zustand 전역 상태 |
| `CollabPanel.tsx` | `src/app/workspace/` | 사이드 패널 UI (기존) |
| `WorkspaceEditorPane.tsx` | `src/app/workspace/` | Monaco 바인딩 (기존) |
| `collaboration/useCollaboration.ts` | `src/app/workspace/collaboration/` | 훅 래퍼 (신규) |
| `collaboration/CollabBar.tsx` | `src/app/workspace/collaboration/` | 인라인 툴바 UI (신규) |
| `collaboration/CollabInviteModal.tsx` | `src/app/workspace/collaboration/` | 초대 모달 (신규) |

`useCollaboration` 훅은 기존 `collab/` 인프라를 재사용합니다 — 중복 구현 없음.

---

## API 참고

`/api/collab` (GET / POST) — Supabase `collab_docs` 테이블 기반 세션 목록/생성.
WebRTC 신호 서버: `wss://signaling.yjs.dev` (기본) 또는 `NEXT_PUBLIC_COLLAB_SIGNAL_URL` 환경변수로 교체.

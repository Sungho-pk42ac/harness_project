# NAA-7 (#78) — 시그니처 + 테스트 시나리오

> 삭제 도구 + 확인 게이트 (ADR-0004). "확인 없이는 삭제 없음"을 로직·UI 양쪽에서 보장.

## 확정 시그니처

### `src/lib/agent/toolDispatcher.ts` (확장)

```ts
export interface ToolDeps {
  // ...기존
  confirmDelete?: (id: string) => Promise<boolean>; // 삭제 실행 전 사용자 확인(ADR-0004)
}
```

- deleteNote: `confirmDelete`가 없거나 false면 `removeNote`를 호출하지 않고 `{deleted:false, cancelled?}` 반환.

### `src/components/ChatPanel.tsx` (확장)

```ts
export interface PendingConfirm {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}
// props에 pendingConfirm?: PendingConfirm | null — 설정 시 하단에 확인 카드(role=alertdialog) 표시
```

### `src/components/AssistantContainer.tsx`

- `confirmDelete(id)`가 확인 카드를 띄우고 사용자의 선택을 Promise<boolean>으로 resolve.

## 시나리오 (should…when…)

### toolDispatcher (단위)

- should 확인 후에만 removeNote 호출 when 승인됨
- should removeNote 미호출 + {cancelled:true} when 취소됨
- should 확인 콜백 없으면 삭제 안 함 when confirmDelete 미주입

### ChatPanel (컴포넌트)

- should 확인 카드를 띄우고 [확인]/[취소]가 콜백 호출 when pendingConfirm 설정

## 메커니즘 노트 (ADR-0004 정련)

spec의 "PendingAction" 일시정지 대신 **비동기 confirmDelete 콜백**으로 구현 — 결과(확인 없이는 삭제 없음)는 동일하고, 디스패처에서 순수하게 단위 테스트되며 UI는 얇게 얹힌다.

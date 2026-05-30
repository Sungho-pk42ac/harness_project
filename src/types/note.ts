export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[]; // 기본값 []. 읽기 시 note.tags ?? [] 로 구버전 노트 방어 (ADR-0001)
  isPinned: boolean; // 핀 고정 여부. 기본 false, 읽기 시 note.isPinned ?? false 로 구버전 방어 (pin ADR-0001)
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[]; // 기본값 []. 읽기 시 note.tags ?? [] 로 구버전 노트 방어 (ADR-0001)
  isPinned: boolean; // 핀 고정 여부. 기본 false, 읽기 시 note.isPinned ?? false 로 구버전 방어 (pin ADR-0001)
  deletedAt?: string | null; // 소프트 삭제 시각(ISO). 없거나 null이면(falsy) 활성 노트. 복원 시 null PATCH (trash ADR-0001)
}

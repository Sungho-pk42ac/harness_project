export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[]; // 기본값 []. 읽기 시 note.tags ?? [] 로 구버전 노트 방어 (ADR-0001)
}

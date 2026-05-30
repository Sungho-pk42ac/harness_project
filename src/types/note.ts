export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[]; // 신규. 기본값 [] (RED 단계: 타입만 추가, 동작 미구현)
}

import type { SortBy, SortDir } from '../utils/sortNotes';

interface SortControlProps {
  sortBy: SortBy;
  sortDir: SortDir;
  onSortByChange: (sortBy: SortBy) => void;
  onSortDirChange: (sortDir: SortDir) => void;
}

const SORT_LABELS: Record<SortBy, string> = {
  updatedAt: '수정일',
  createdAt: '생성일',
  title: '제목',
};

/**
 * 정렬 컨트롤 — 기준 드롭다운 + 방향 토글 버튼 (sort spec-fixed §2).
 * 화면 상태(App 소유)를 value/onChange로만 받는 프레젠테이션 컴포넌트.
 */
export function SortControl({
  sortBy,
  sortDir,
  onSortByChange,
  onSortDirChange,
}: SortControlProps) {
  return (
    <div className="flex items-center gap-2 px-1 pb-1">
      <select
        aria-label="정렬 기준"
        value={sortBy}
        onChange={(e) => onSortByChange(e.target.value as SortBy)}
        className="text-xs text-foreground bg-card border border-border rounded-lg px-2 py-1 outline-none cursor-pointer"
      >
        {(Object.keys(SORT_LABELS) as SortBy[]).map((key) => (
          <option key={key} value={key}>
            {SORT_LABELS[key]}
          </option>
        ))}
      </select>
      <button
        type="button"
        aria-label={`정렬 방향: ${sortDir === 'asc' ? '오름차순' : '내림차순'}`}
        onClick={() => onSortDirChange(sortDir === 'asc' ? 'desc' : 'asc')}
        className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-2 py-1 transition-colors cursor-pointer"
      >
        {sortDir === 'asc' ? '↑ 오름' : '↓ 내림'}
      </button>
    </div>
  );
}

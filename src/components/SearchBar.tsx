interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * 검색 입력창 — value/onChange만 받는 프레젠테이션 컴포넌트 (search spec-fixed §2).
 * 값이 있을 때만 ×(지우기) 버튼을 노출하고, 클릭 시 빈 문자열로 onChange한다.
 */
export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative px-1 pb-1">
      <input
        type="search"
        aria-label="노트 검색"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="검색어를 입력하세요"
        className="w-full text-sm text-foreground bg-card border border-border rounded-lg pl-3 pr-8 py-1.5 outline-none placeholder:text-muted-foreground/60"
      />
      {value && (
        <button
          type="button"
          aria-label="검색어 지우기"
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm transition-colors cursor-pointer"
        >
          ×
        </button>
      )}
    </div>
  );
}

import ReactMarkdown from 'react-markdown';

interface MarkdownPreviewProps {
  content: string;
}

// 마크다운 태그에 최소 타이포·간격을 입힌다(시맨틱 토큰만, 임의값 없음). react-markdown 기본값은
// raw HTML 미허용이라 rehype-raw 등을 쓰지 않으면 XSS가 차단된다 (markdown-preview ADR-0002).
const components = {
  h1: (props: React.ComponentProps<'h1'>) => (
    <h1 className="text-xl font-bold text-foreground mt-4 mb-2" {...props} />
  ),
  h2: (props: React.ComponentProps<'h2'>) => (
    <h2 className="text-lg font-bold text-foreground mt-3 mb-2" {...props} />
  ),
  h3: (props: React.ComponentProps<'h3'>) => (
    <h3 className="text-base font-semibold text-foreground mt-2 mb-1" {...props} />
  ),
  p: (props: React.ComponentProps<'p'>) => (
    <p className="text-foreground/80 leading-relaxed mb-2" {...props} />
  ),
  ul: (props: React.ComponentProps<'ul'>) => (
    <ul className="list-disc pl-5 mb-2 space-y-1 text-foreground/80" {...props} />
  ),
  ol: (props: React.ComponentProps<'ol'>) => (
    <ol className="list-decimal pl-5 mb-2 space-y-1 text-foreground/80" {...props} />
  ),
  strong: (props: React.ComponentProps<'strong'>) => (
    <strong className="font-bold text-foreground" {...props} />
  ),
  em: (props: React.ComponentProps<'em'>) => <em className="italic" {...props} />,
  code: (props: React.ComponentProps<'code'>) => (
    <code className="bg-muted text-foreground rounded px-1 py-0.5 text-sm font-mono" {...props} />
  ),
  pre: (props: React.ComponentProps<'pre'>) => (
    <pre
      className="bg-muted text-foreground rounded-lg p-3 overflow-x-auto mb-2 text-sm font-mono"
      {...props}
    />
  ),
  a: (props: React.ComponentProps<'a'>) => <a className="text-primary underline" {...props} />,
};

/**
 * 본문(content)을 마크다운으로 렌더하는 읽기 전용 컴포넌트 (markdown-preview spec-fixed §4).
 * raw HTML은 렌더하지 않는다(react-markdown 기본값) — XSS 방어.
 * @param content 마크다운 원문
 */
export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  return (
    <div className="min-h-80 text-base">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}

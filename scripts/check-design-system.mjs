// 디자인 시스템 위반 검사 스크립트
// lint-staged가 staged된 .tsx/.css 파일 경로를 인자로 넘겨주면, 디자인 시스템
// Do/Don't(docs/design-system/do-and-dont.md)를 어기는 패턴을 찾아 보고한다.
// 위반이 하나라도 있으면 종료 코드 1로 끝나 커밋을 막는다.

import { readFileSync } from 'node:fs';

/**
 * 검사 규칙 목록. 각 규칙은 정규식과 안내 메시지를 가진다.
 * @type {{ id: string, pattern: RegExp, message: string }[]}
 */
const rules = [
  {
    id: 'arbitrary-shadow',
    pattern: /shadow-\[/,
    message: '임의 그림자값(shadow-[...]) 대신 공통 그림자 클래스를 사용하세요.',
  },
  {
    id: 'arbitrary-hex-color',
    // bg-[#fff], text-[#3b82f6], border-[#...] 등 Tailwind 임의 hex 색상
    pattern: /\b(bg|text|border|ring|fill|stroke|from|via|to|outline|decoration)-\[#[0-9a-fA-F]{3,8}\b/,
    message: '임의 hex 색상 대신 시맨틱 토큰(bg-primary, text-foreground 등)을 사용하세요.',
  },
  {
    id: 'inline-style',
    pattern: /style=\{\{/,
    message: '인라인 style 매직넘버 대신 Tailwind 클래스/토큰을 사용하세요.',
  },
];

/** 인자로 받은 파일들을 검사한다. */
const files = process.argv.slice(2);
/** @type {{ file: string, line: number, ruleId: string, message: string, text: string }[]} */
const violations = [];

for (const file of files) {
  let content;
  try {
    content = readFileSync(file, 'utf8');
  } catch {
    // 읽을 수 없는 파일(삭제 등)은 건너뛴다.
    continue;
  }

  const lines = content.split(/\r?\n/);
  lines.forEach((text, idx) => {
    for (const rule of rules) {
      if (rule.pattern.test(text)) {
        violations.push({
          file,
          line: idx + 1,
          ruleId: rule.id,
          message: rule.message,
          text: text.trim(),
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error('\n✖ 디자인 시스템 위반이 발견되었습니다:\n');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}  [${v.ruleId}]`);
    console.error(`    ${v.message}`);
    console.error(`    > ${v.text}\n`);
  }
  console.error('자세한 기준: docs/design-system/do-and-dont.md\n');
  process.exit(1);
}

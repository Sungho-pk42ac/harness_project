# ADR — 핀 고정 기능 결정 기록

[ADR(Architecture Decision Record)](https://adr.github.io/)는 **하나의 중요한 기술 결정**을 그 맥락·대안·결과와 함께 남기는 기록입니다. 한 번 Accepted 되면 내용은 바꾸지 않고, 번복이 필요하면 새 ADR로 기존 것을 **Superseded** 처리합니다.

> 관련 제품 요구사항은 [`../PRD.md`](../PRD.md) 참고.

## 상태 값

- **Proposed**: 제안됨, 합의 전
- **Accepted**: 채택됨(현행)
- **Superseded by ADR-XXXX**: 다른 ADR로 대체됨
- **Deprecated**: 더 이상 유효하지 않음

## 목록

| #                                        | 제목                                             | 상태     |
| ---------------------------------------- | ------------------------------------------------ | -------- |
| [0001](0001-pin-data-model.md)           | 핀 데이터 모델: note 내 `isPinned` 불리언 임베드 | Accepted |
| [0002](0002-pin-state-ownership.md)      | 핀 상태 소유 위치: `NotesContext`(서버 데이터)   | Accepted |
| [0003](0003-toggle-pin-and-partition.md) | `togglePin` 변경 함수 + 정렬 분기 순수 함수      | Accepted |

## 새 ADR 작성 규칙

- 파일명: `NNNN-kebab-제목.md` (4자리 번호, 1씩 증가)
- 양식: 아래 섹션을 따른다 — **Status / Context / Decision / Consequences / Alternatives Considered**

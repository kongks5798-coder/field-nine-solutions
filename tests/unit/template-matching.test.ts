import { describe, it, expect } from "vitest";
import { matchTemplate } from "../../src/app/workspace/workspace.templates";

describe("matchTemplate", () => {
  describe("strict mode (default)", () => {
    it("matches short, simple template requests", () => {
      expect(matchTemplate("테트리스 만들어줘")).not.toBeNull();
      expect(matchTemplate("snake game")).not.toBeNull();
      expect(matchTemplate("계산기")).not.toBeNull();
      expect(matchTemplate("2048")).not.toBeNull();
    });

    it("rejects long/complex prompts even with template keywords", () => {
      // Long prompt with "카드" — should NOT match a memory card game
      expect(matchTemplate("신용카드 결제 시스템이 포함된 쇼핑몰을 만들어줘. 상품 목록, 장바구니, 결제 페이지가 필요해")).toBeNull();
      // Long prompt with "메모리" — should NOT match a memory card game
      expect(matchTemplate("메모리 관리 대시보드를 만들어줘. CPU 사용량, RAM 사용량, 디스크 사용량을 차트로 보여줘")).toBeNull();
    });

    it("rejects prompts with commercial/platform signals", () => {
      expect(matchTemplate("유튜브 클론 만들어줘")).toBeNull();
      expect(matchTemplate("쇼핑몰 만들어줘")).toBeNull();
      expect(matchTemplate("대시보드 만들어줘")).toBeNull();
    });

    it("returns null for prompts longer than 60 chars", () => {
      const longPrompt = "테트리스 게임을 만들어줘. 레벨 시스템과 점수판 그리고 배경음악도 추가해줘. 모바일 반응형도 지원해야 하고 멀티플레이어 모드도 넣어줘. 다크 모드도 지원해야해.";
      expect(longPrompt.length).toBeGreaterThan(60);
      expect(matchTemplate(longPrompt)).toBeNull();
    });
  });

  describe("fallback mode", () => {
    it("matches regardless of prompt length", () => {
      const longPrompt = "테트리스 게임을 만들어줘. 레벨 시스템, 점수판, 배경음악도 추가해줘. 모바일 반응형도 지원해야해.";
      expect(matchTemplate(longPrompt, "fallback")).not.toBeNull();
    });

    it("matches template keywords in longer prompts", () => {
      expect(matchTemplate("재미있는 snake 게임을 화려하게 만들어줘. 장애물도 추가하고 점수 시스템도 넣어줘.", "fallback")).not.toBeNull();
    });

    it("returns null when no keywords match at all", () => {
      expect(matchTemplate("블록체인 네트워크 시뮬레이터를 구현해줘", "fallback")).toBeNull();
    });
  });
});

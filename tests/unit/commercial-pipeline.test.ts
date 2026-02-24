import { describe, it, expect } from "vitest";
import {
  detectCommercialRequest,
  buildStepPrompt,
  getStepLabel,
} from "../../src/app/workspace/ai/commercialPipeline";

describe("detectCommercialRequest", () => {
  it("returns pipeline for Korean e-commerce request", () => {
    const result = detectCommercialRequest("무신사 스타일 쇼핑몰 만들어줘");
    expect(result).not.toBeNull();
    expect(result!.platformType).toBe("ecommerce");
    expect(result!.steps).toHaveLength(3);
  });

  it("returns pipeline for YouTube request", () => {
    const result = detectCommercialRequest("유튜브 같은 동영상 플랫폼 만들어줘");
    expect(result).not.toBeNull();
    expect(result!.platformType).toBe("videoplatform");
  });

  it("returns pipeline for Instagram request", () => {
    const result = detectCommercialRequest("인스타그램 클론 만들어줘");
    expect(result).not.toBeNull();
    expect(result!.platformType).toBe("socialmedia");
  });

  it("returns pipeline for dashboard request", () => {
    const result = detectCommercialRequest("관리자 대시보드 만들어줘");
    expect(result).not.toBeNull();
    expect(result!.platformType).toBe("dashboard");
  });

  it("returns pipeline for music player request", () => {
    const result = detectCommercialRequest("음악 플레이어 만들어줘");
    expect(result).not.toBeNull();
    expect(result!.platformType).toBe("musicplayer");
  });

  it("returns pipeline for portfolio request", () => {
    const result = detectCommercialRequest("포트폴리오 사이트 만들어줘");
    expect(result).not.toBeNull();
    expect(result!.platformType).toBe("portfolio");
  });

  it("returns pipeline for messenger request", () => {
    const result = detectCommercialRequest("카카오톡 클론 만들어줘");
    expect(result).not.toBeNull();
    expect(result!.platformType).toBe("messenger");
  });

  it("returns pipeline for English commercial request", () => {
    const result = detectCommercialRequest("build a complete e-commerce platform");
    expect(result).not.toBeNull();
    expect(result!.platformType).toBe("ecommerce");
  });

  it("returns pipeline for quality + scale keywords", () => {
    const result = detectCommercialRequest("상용급 전체 플랫폼 만들어줘");
    expect(result).not.toBeNull();
  });

  it("returns null for simple request", () => {
    const result = detectCommercialRequest("버튼 하나 추가해줘");
    expect(result).toBeNull();
  });

  it("returns null for generic coding request", () => {
    const result = detectCommercialRequest("hello world 앱 만들어줘");
    expect(result).toBeNull();
  });

  it("returns null for empty prompt", () => {
    expect(detectCommercialRequest("")).toBeNull();
  });

  describe("pipeline structure", () => {
    it("has 3 steps: structure, styling, logic", () => {
      const result = detectCommercialRequest("무신사 쇼핑몰");
      expect(result).not.toBeNull();
      const phases = result!.steps.map(s => s.phase);
      expect(phases).toEqual(["structure", "styling", "logic"]);
    });

    it("step 1 targets index.html", () => {
      const result = detectCommercialRequest("유튜브 클론");
      expect(result!.steps[0].targetFile).toBe("index.html");
    });

    it("step 2 targets style.css and depends on step 1", () => {
      const result = detectCommercialRequest("유튜브 클론");
      expect(result!.steps[1].targetFile).toBe("style.css");
      expect(result!.steps[1].dependsOn).toContain("step-html");
    });

    it("step 3 targets script.js and depends on steps 1+2", () => {
      const result = detectCommercialRequest("유튜브 클론");
      expect(result!.steps[2].targetFile).toBe("script.js");
      expect(result!.steps[2].dependsOn).toContain("step-html");
      expect(result!.steps[2].dependsOn).toContain("step-css");
    });
  });
});

describe("buildStepPrompt", () => {
  it("returns step prompt without context for first step", () => {
    const config = detectCommercialRequest("쇼핑몰 만들어줘")!;
    const prompt = buildStepPrompt(config.steps[0], {});
    expect(prompt).toContain("STEP 1/3");
    expect(prompt).toContain("HTML");
    expect(prompt).not.toContain("Context from previous steps");
  });

  it("includes previous output as context for dependent steps", () => {
    const config = detectCommercialRequest("쇼핑몰 만들어줘")!;
    const outputs = { "step-html": "<html><body>test</body></html>" };
    const prompt = buildStepPrompt(config.steps[1], outputs);
    expect(prompt).toContain("STEP 2/3");
    expect(prompt).toContain("Context from previous steps");
    expect(prompt).toContain("<html><body>test</body></html>");
  });

  it("includes multiple contexts for step 3", () => {
    const config = detectCommercialRequest("쇼핑몰 만들어줘")!;
    const outputs = {
      "step-html": "<html>structure</html>",
      "step-css": "body { color: red; }",
    };
    const prompt = buildStepPrompt(config.steps[2], outputs);
    expect(prompt).toContain("STEP 3/3");
    expect(prompt).toContain("<html>structure</html>");
    expect(prompt).toContain("body { color: red; }");
  });
});

describe("getStepLabel", () => {
  it("returns Korean label for structure phase", () => {
    const label = getStepLabel("structure", 0, 3);
    expect(label).toContain("1/3");
    expect(label).toContain("HTML 구조 생성");
  });

  it("returns Korean label for styling phase", () => {
    const label = getStepLabel("styling", 1, 3);
    expect(label).toContain("2/3");
    expect(label).toContain("CSS 스타일링");
  });

  it("returns Korean label for logic phase", () => {
    const label = getStepLabel("logic", 2, 3);
    expect(label).toContain("3/3");
    expect(label).toContain("JavaScript 로직");
  });
});

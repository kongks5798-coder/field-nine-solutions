// @vitest-environment jsdom
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// Mock Monaco Editor (dynamic import)
vi.mock("@monaco-editor/react", () => ({
  default: ({ value, language, onChange }: any) => (
    <textarea
      data-testid="mock-monaco"
      data-language={language}
      value={value}
      onChange={(e: any) => onChange?.(e.target.value)}
    />
  ),
}));

// Mock next/dynamic to just return the component
vi.mock("next/dynamic", () => ({
  default: (importFn: any) => {
    const mod = { default: ({ value, language, onChange }: any) => (
      <textarea
        data-testid="mock-monaco"
        data-language={language}
        value={value}
        onChange={(e: any) => onChange?.(e.target.value)}
      />
    )};
    return mod.default;
  },
}));

import CodeEditor from "@/components/CodeEditor";

describe("CodeEditor - component-code-editor", () => {
  it("renders the editor title", () => {
    render(<CodeEditor />);
    expect(screen.getByText(/필드나인 에디터/)).toBeInTheDocument();
  });

  it("renders the Monaco editor textarea mock", () => {
    render(<CodeEditor />);
    const editor = screen.getByTestId("mock-monaco");
    expect(editor).toBeInTheDocument();
  });

  it("defaults to typescript language", () => {
    render(<CodeEditor />);
    const editor = screen.getByTestId("mock-monaco");
    expect(editor).toHaveAttribute("data-language", "typescript");
  });

  it("renders default TypeScript code when no value prop given", () => {
    render(<CodeEditor />);
    const editor = screen.getByTestId("mock-monaco") as HTMLTextAreaElement;
    expect(editor.value).toContain("Hello, Dalkak!");
  });

  it("uses provided value prop as initial code", () => {
    render(<CodeEditor value="const x = 42;" />);
    const editor = screen.getByTestId("mock-monaco") as HTMLTextAreaElement;
    expect(editor.value).toBe("const x = 42;");
  });

  it("calls onChange when editor content changes", () => {
    const onChangeSpy = vi.fn();
    render(<CodeEditor onChange={onChangeSpy} />);
    const editor = screen.getByTestId("mock-monaco");
    fireEvent.change(editor, { target: { value: "new code" } });
    expect(onChangeSpy).toHaveBeenCalledWith("new code");
  });
});

// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

import { Skeleton, SkeletonCard, SkeletonText } from "@/components/Skeleton";

describe("Skeleton", () => {
  it("renders with default props", () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.getAttribute("aria-hidden")).toBe("true");
    expect(el.style.width).toBe("100%");
    expect(el.style.height).toBe("16px");
  });

  it("renders with custom width and height", () => {
    const { container } = render(<Skeleton width={200} height={40} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("200px");
    expect(el.style.height).toBe("40px");
  });

  it("renders with string width", () => {
    const { container } = render(<Skeleton width="50%" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe("50%");
  });

  it("applies custom borderRadius", () => {
    const { container } = render(<Skeleton borderRadius={12} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.borderRadius).toBe("12px");
  });

  it("merges custom style", () => {
    const { container } = render(
      <Skeleton style={{ marginBottom: 8 }} />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.marginBottom).toBe("8px");
  });
});

describe("SkeletonCard", () => {
  it("renders a card with three skeleton lines", () => {
    const { container } = render(<SkeletonCard />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBe(3);
  });

  it("applies custom style to wrapper", () => {
    const { container } = render(<SkeletonCard style={{ marginTop: 16 }} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.marginTop).toBe("16px");
  });
});

describe("SkeletonText", () => {
  it("renders 3 lines by default", () => {
    const { container } = render(<SkeletonText />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBe(3);
  });

  it("renders custom number of lines", () => {
    const { container } = render(<SkeletonText lines={5} />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeletons.length).toBe(5);
  });

  it("last line is shorter (60% width)", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    const lastSkeleton = skeletons[skeletons.length - 1] as HTMLElement;
    expect(lastSkeleton.style.width).toBe("60%");
  });

  it("non-last lines are 100% width", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const skeletons = container.querySelectorAll('[aria-hidden="true"]');
    const firstSkeleton = skeletons[0] as HTMLElement;
    expect(firstSkeleton.style.width).toBe("100%");
  });
});

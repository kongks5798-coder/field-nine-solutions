"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { T } from "@/lib/theme";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
            fontFamily: T.fontStack,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>{"⚠️"}</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: T.red,
              marginBottom: 8,
            }}
          >
            {"문제가 발생했습니다"}
          </div>
          <div
            style={{
              fontSize: 14,
              color: T.muted,
              marginBottom: 24,
              maxWidth: 400,
              lineHeight: 1.5,
            }}
          >
            {this.state.error?.message || "알 수 없는 오류가 발생했습니다."}
          </div>
          <button
            onClick={this.handleReset}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: T.accent,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: T.fontStack,
            }}
          >
            {"다시 시도"}
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

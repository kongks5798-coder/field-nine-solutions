"use client";
// A blinking "|" cursor shown in editor tab while file is being streamed

interface Props {
  isStreaming: boolean;
  filename: string;
  activeStreamingFile?: string; // Which file is currently streaming
}

export function StreamingCursor({
  isStreaming,
  filename,
  activeStreamingFile,
}: Props) {
  if (!isStreaming || activeStreamingFile !== filename) return null;
  return (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: "1em",
        background: "#f97316",
        marginLeft: 4,
        verticalAlign: "middle",
        animation: "sc-blink 1s step-end infinite",
      }}
    >
      <style>{`@keyframes sc-blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </span>
  );
}

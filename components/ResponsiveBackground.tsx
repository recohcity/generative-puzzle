import React from "react";

const PROGRAMMATIC_BACKGROUND = `
  radial-gradient(ellipse 72% 34% at 15% 24%, rgba(214, 219, 58, 0.88) 0%, rgba(214, 219, 58, 0.5) 35%, rgba(214, 219, 58, 0) 78%),
  radial-gradient(ellipse 76% 31% at 68% 51%, rgba(218, 57, 224, 0.84) 0%, rgba(177, 79, 232, 0.56) 42%, rgba(177, 79, 232, 0) 80%),
  radial-gradient(ellipse 54% 29% at 103% 76%, rgba(85, 218, 255, 0.92) 0%, rgba(85, 218, 255, 0.42) 34%, rgba(85, 218, 255, 0) 76%),
  radial-gradient(ellipse 82% 38% at 46% 63%, rgba(112, 90, 235, 0.58) 0%, rgba(112, 90, 235, 0) 76%),
  linear-gradient(135deg, #4f328d 0%, #40358f 46%, #273e87 100%)
`;

/**
 * 使用 CSS 渐变生成背景，避免加载外部图片资源。
 */
export default function ResponsiveBackground({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`absolute inset-0 w-full h-full z-0 pointer-events-none select-none ${className}`}
      style={{
        ...style,
        overflow: "hidden",
        backgroundColor: "#40358f",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "max(100vw, 56.25vh)",
          aspectRatio: "9 / 16",
          transform: "translate(-50%, -50%)",
          background: PROGRAMMATIC_BACKGROUND,
        }}
      />
    </div>
  );
}

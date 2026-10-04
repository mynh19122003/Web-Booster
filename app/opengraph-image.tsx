import { ImageResponse } from "next/og";
export const alt = "ASCEND — Your game. Your rise.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function SocialImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: "#09090c",
        color: "#f4f3ef",
        padding: "70px 80px",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 30,
          letterSpacing: 8,
          color: "#ff984e",
        }}
      >
        ASCEND
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 90,
          fontWeight: 700,
          letterSpacing: -5,
          lineHeight: 1.08,
        }}
      >
        <span>YOUR GAME.</span>
        <span style={{ color: "#ff984e" }}>YOUR RISE.</span>
      </div>
      <div style={{ display: "flex", fontSize: 24, color: "#a6a6ae" }}>
        A higher standard of play.
      </div>
      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 100,
          top: 170,
          width: 235,
          height: 290,
          border: "2px solid #ad7b4e",
          transform: "rotate(30deg)",
          background: "linear-gradient(140deg,#dfb780,#403326 45%,#a37846)",
        }}
      />
    </div>,
    size,
  );
}

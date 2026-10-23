import { ImageResponse } from "next/og";
import { perfil } from "@/content/perfil";

export const alt = "Guilherme Rabelo · Desenvolvedor Web";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          background: "radial-gradient(ellipse at 80% 0%, #3a2a05 0%, #121212 55%, #0b0b0c 100%)",
          color: "#ecebe8",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            backgroundImage: "linear-gradient(90deg, #f5b301, #ff8a00)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          GR.
        </div>
        <div style={{ fontSize: 88, fontWeight: 800, color: "#ffffff", marginTop: 24 }}>{perfil.nome}</div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            backgroundImage: "linear-gradient(90deg, #f5b301, #ff8a00)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {perfil.cargo}
        </div>
        <div style={{ fontSize: 30, color: "#9a9893", marginTop: 28 }}>
          Engenharia de Software · Sistemas que resolvem problemas reais
        </div>
      </div>
    ),
    size,
  );
}

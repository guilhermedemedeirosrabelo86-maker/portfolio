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
          background: "radial-gradient(ellipse at 80% 0%, #2a2f8a 0%, #0b0d24 55%, #080a1a 100%)",
          color: "#e8eaf6",
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            backgroundImage: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
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
            backgroundImage: "linear-gradient(90deg, #3b82f6, #8b5cf6)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {perfil.cargo}
        </div>
        <div style={{ fontSize: 30, color: "#9da2c8", marginTop: 28 }}>
          Engenharia de Software · Sistemas que resolvem problemas reais
        </div>
      </div>
    ),
    size,
  );
}

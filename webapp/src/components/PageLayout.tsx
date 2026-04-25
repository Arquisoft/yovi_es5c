import { styled } from "@mui/material/styles";

export const PageWrapper = styled("div")({
  width: "100%",
  minHeight: "100dvh",
  flex: 1,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  boxSizing: "border-box",
  padding: "clamp(16px, 4vw, 32px)",
  gap: "clamp(24px, 5vw, 40px)",
  background:
    "radial-gradient(circle at top, rgba(200, 168, 75, 0.12), transparent 32%), #0d0d0d",
});

export const ContentShell = styled("div")<{ maxWidth?: number }>(
  ({ theme, maxWidth = 1100 }) => ({
    width: `min(100%, ${maxWidth}px)`,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "clamp(24px, 5vw, 40px)",
    padding: "clamp(20px, 4vw, 40px)",
    boxSizing: "border-box",
    borderRadius: 28,
    border: "1px solid rgba(232, 216, 154, 0.14)",
    background:
      "linear-gradient(180deg, rgba(21, 21, 21, 0.98), rgba(10, 10, 10, 0.95))",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.35)",
    [theme.breakpoints.down("sm")]: {
      borderRadius: 20,
    },
  })
);

export const DivColumn = styled("div")<{ minHeight?: number; gap?: number }>(
  ({ minHeight = 160, gap = 8 }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    gap,
    minHeight,
    padding: "20px 18px",
    boxSizing: "border-box",
    borderRadius: 20,
    border: "1px solid rgba(200, 168, 75, 0.18)",
    background:
      "linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.015))",
    backdropFilter: "blur(6px)",
  })
);

export const Title = styled("h1")({
  fontFamily: "Georgia, serif",
  fontSize: "clamp(2.1rem, 5vw, 3.4rem)",
  color: "#e8d89a",
  letterSpacing: "0.08em",
  margin: 0,
  textAlign: "center",
});

export const SubTitle = styled("p")({
  fontFamily: "Georgia, serif",
  fontSize: "clamp(0.95rem, 2.7vw, 1.08rem)",
  color: "#9d9d9d",
  letterSpacing: "0.05em",
  margin: 0,
  textAlign: "center",
  maxWidth: 680,
});
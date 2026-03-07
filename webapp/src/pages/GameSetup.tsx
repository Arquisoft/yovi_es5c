import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useSession } from "../SessionContext";
import { Navigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────
type GameMode = "pvp" | "bot";
type Difficulty = "Easy" | "Medium" | "Hard";

// ─── Constants ───────────────────────────────────────────────
const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

// ─── Styled components ───────────────────────────────────────

const PageWrapper = styled("div")({
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  paddingTop: 60,
  gap: 40,
  backgroundColor: "#0d0d0d",
});

const Title = styled("h1")({
  fontFamily: "Georgia, serif",
  fontSize: "2rem",
  color: "#e8d89a",
  letterSpacing: "0.08em",
});

const DivRow = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: 16,
});

const DivColumn = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  gap: 6,
  maxWidth: 600,
});

const ModeButton = styled(Button)({
  width: 220,
  padding: "14px 0",
  fontSize: "0.9rem",
  letterSpacing: "0.06em",
  borderColor: "#c8a84b",
  color: "#c8a84b",
  borderRadius: 4,
  transition: "all 0.2s ease",
  minWidth: "150px",
  "&:hover": {
    backgroundColor: "rgba(200, 168, 75, 0.07)",
    borderColor: "#e8d89a",
    color: "#e8d89a",
  },
});

const DifficultyButton = styled(Button)({
  color: "#888",
  fontSize: "0.78rem",
  letterSpacing: "0.05em",
  padding: "6px 10px",
  minWidth: "100px",
  "&:hover": {
    color: "#c8a84b",
    backgroundColor: "transparent",
  },
});

const DifficultyMenu = styled(Menu)({
  "& .MuiPaper-root": {
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 4,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
  },
});

const DifficultyMenuItem = styled(MenuItem)({
  fontSize: "0.85rem",
  color: "#888",
  letterSpacing: "0.04em",
  transition: "color 0.15s ease",
  "&:hover": {
    color: "#c8a84b",
    backgroundColor: "rgba(200, 168, 75, 0.07)",
  },
  "&.Mui-selected": {
    color: "#c8a84b",
    backgroundColor: "rgba(200, 168, 75, 0.07)",
  },
  "&.Mui-selected:hover": {
    backgroundColor: "rgba(200, 168, 75, 0.12)",
  },
});

const SubTitle = styled("p")({
  fontFamily: "Georgia, serif",
  fontSize: "0.9rem",
  color: "#666",
  letterSpacing: "0.05em",
  margin: 0,
});

const ModeDescription = styled("p")({
  fontSize: "0.75rem",
  color: "#555",
  margin: "4px 0 0 0",
  letterSpacing: "0.03em",
  textAlign: "center",
});

// ─── Component ───────────────────────────────────────────────
const GameSetup = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const { isLoggedIn } = useSession();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const handleStart = (mode: GameMode) => {
    if (isLoggedIn) {
      navigate("/game");
      console.log(mode, difficulty);
    } else {
      navigate("/login");
    }
  };

  const handleDifficultyOpen = (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
  };

  const handleDifficultySelect = (d: Difficulty) => {
    setDifficulty(d);
    setAnchorEl(null);
  };

  return (
    <PageWrapper>
      <DivColumn>
        <Title>New Game</Title>
        <SubTitle>Select a game mode to start playing</SubTitle>
      </DivColumn>

      <img
        src="/logo.svg"
        alt="game logo"
        style={{ width: "20vw", height: "20vw" }}
      />
      <DivRow>
        <DivColumn>
          <ModeButton variant="outlined" onClick={() => handleStart("pvp")}>
            ▲ Player vs Player ▲
          </ModeButton>
          <ModeDescription>Play locally against a friend</ModeDescription>
        </DivColumn>

        <DivColumn>
          <DivRow>
            <ModeButton variant="outlined" onClick={() => handleStart("bot")}>
              ▲ Player vs Bot 🤖
            </ModeButton>

            <DifficultyButton onClick={handleDifficultyOpen}>
              {difficulty} ▾
            </DifficultyButton>

            <DifficultyMenu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              {DIFFICULTIES.map((d) => (
                <DifficultyMenuItem
                  key={d}
                  selected={d === difficulty}
                  onClick={() => handleDifficultySelect(d)}
                >
                  {d}
                </DifficultyMenuItem>
              ))}
            </DifficultyMenu>
          </DivRow>
          <ModeDescription>Challenge the AI at your own pace</ModeDescription>
        </DivColumn>
      </DivRow>
    </PageWrapper>
  );
};

export default GameSetup;

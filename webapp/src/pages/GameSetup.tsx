import { useState } from "react";
import { Button, Divider, Menu, MenuItem, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useSession } from "../SessionContext";
import { Navigate, useNavigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────
type GameMode = "pvp" | "bot";
type Difficulty = "Easy" | "Medium" | "Hard";

interface BotOption {
  bot_id: string;
  label: string;
  description: string;
}

// ─── Constants ───────────────────────────────────────────────

const BOT_OPTIONS: BotOption[] = [
  {
    bot_id: "random_bot",
    label: "Random Bot",
    description: "Makes random moves",
  },
  {
    bot_id: "center_bot",
    label: "Center bot",
    description: "Controls the center",
  },
  {
    bot_id: "edge_bot",
    label: "Edge bot",
    description: "Controls the sides",
  },
  {
    bot_id: "smart_bot",
    label: "Smart bot",
    description: "Always searchs the victory",
  },
  {
    bot_id: "mirror_bot",
    label: "Mirror bot",
    description: "Mirrors the opponent's moves",
  },
  {
    bot_id: "alpha_bot",
    label: "Alpha bot",
    description: "The best bot, try to win it",
  },
];

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Easy: "#4caf50",
  Medium: "#ff9800",
  Hard: "#f44336",
};

export const minBoardSize = 3;
export const maxBoardSize = 15;

// ─── Helpers ─────────────────────────────────────────────────

export function getInitialBoardSize(): number {
  const savedSize = sessionStorage.getItem('boardSize');
  if (!savedSize) return 5;

  const parsedSize = Number.parseInt(savedSize, 10);
  if (Number.isNaN(parsedSize)) return 5;

  return Math.max(minBoardSize, Math.min(maxBoardSize, parsedSize));
}

// ─── Styled components ───────────────────────────────────────

const PageWrapper = styled("div")({
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

const ContentShell = styled("div")(({ theme }) => ({
  width: "min(100%, 1080px)",
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
}));

const Title = styled("h1")({
  fontFamily: "Georgia, serif",
  fontSize: "clamp(2.1rem, 5vw, 3.4rem)",
  color: "#e8d89a",
  letterSpacing: "0.08em",
  margin: 0,
  textAlign: "center",
});

const DivRow = styled("div")(({ theme }) => ({
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  alignItems: "stretch",
  gap: "clamp(14px, 2vw, 20px)",
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  },
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
  },
}));

const DivColumn = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  gap: 10,
  minHeight: 188,
  padding: "20px 18px",
  boxSizing: "border-box",
  borderRadius: 20,
  border: "1px solid rgba(200, 168, 75, 0.18)",
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.015))",
  backdropFilter: "blur(6px)",
});

const ModeButton = styled(Button)({
  width: "100%",
  maxWidth: 280,
  padding: "14px 18px",
  fontSize: "clamp(0.88rem, 2.5vw, 0.96rem)",
  letterSpacing: "0.06em",
  borderColor: "#c8a84b",
  color: "#c8a84b",
  borderRadius: 999,
  transition: "all 0.2s ease",
  minWidth: 0,
  "&:hover": {
    backgroundColor: "rgba(200, 168, 75, 0.07)",
    borderColor: "#e8d89a",
    color: "#e8d89a",
  },
});


const StyledMenu = styled(Menu)({
  "& .MuiPaper-root": {
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
    minWidth: 220,
    maxWidth: "min(320px, calc(100vw - 32px))",
  },
});

const BotMenuItem = styled(MenuItem)({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  padding: "10px 16px",
  gap: 2,
  "&:hover": { backgroundColor: "rgba(200, 168, 75, 0.07)" },
  "&.Mui-selected": { backgroundColor: "rgba(200, 168, 75, 0.07)" },
  "&.Mui-selected:hover": { backgroundColor: "rgba(200, 168, 75, 0.12)" },
});

const BotLabel = styled(Typography)({
  fontSize: "0.85rem",
  color: "#c8a84b",
  letterSpacing: "0.04em",
  fontWeight: 500,
});

const BotDescription = styled(Typography)({
  fontSize: "0.72rem",
  color: "#8a8a8a",
  letterSpacing: "0.03em",
});

const MenuHeader = styled(Typography)({
  fontSize: "0.7rem",
  color: "#444",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "8px 16px 4px",
  userSelect: "none",
});

const DifficultyMenuItem = styled(MenuItem)({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  padding: "9px 16px",
  "&:hover": { backgroundColor: "rgba(200, 168, 75, 0.07)" },
});

const DifficultyDot = styled("span")<{ color: string }>(({ color }) => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  backgroundColor: color,
  flexShrink: 0,
}));

const DifficultyLabel = styled(Typography)({
  fontSize: "0.85rem",
  color: "#aaa",
  letterSpacing: "0.04em",
});

const SubTitle = styled("p")({
  fontFamily: "Georgia, serif",
  fontSize: "clamp(0.95rem, 2.7vw, 1.08rem)",
  color: "#9d9d9d",
  letterSpacing: "0.05em",
  margin: 0,
  textAlign: "center",
  maxWidth: 680,
});

const ModeDescription = styled("p")({
  fontSize: "0.82rem",
  color: "#949494",
  margin: "4px 0 0 0",
  letterSpacing: "0.03em",
  textAlign: "center",
  maxWidth: 280,
});

// ─── Estilos del Spinner Numérico ────────────────────────────

const SpinnerContainer = styled("div")({
  display: "flex",
  alignItems: "center",
  border: "1px solid #c8a84b",
  borderRadius: "999px",
  overflow: "hidden",
  backgroundColor: "#1a1a1a",
  width: "fit-content",
  maxWidth: "100%",
});

const SpinnerBtn = styled("button")({
  backgroundColor: "transparent",
  color: "#c8a84b",
  border: "none",
  padding: "14px 14px",
  fontSize: "1.2rem",
  cursor: "pointer",
  transition: "all 0.2s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  "&:hover:not(:disabled)": {
    backgroundColor: "rgba(200, 168, 75, 0.15)",
    color: "#e8d89a",
  },
  "&:disabled": {
    color: "#444",
    cursor: "not-allowed",
  },
});

const SpinnerValue = styled(Typography)({
  color: "#e8d89a",
  fontSize: "0.95rem",
  minWidth: "48px",
  textAlign: "center",
  fontWeight: "bold",
  letterSpacing: "0.05em",
  userSelect: "none",
});

const Logo = styled("img")(({ theme }) => ({
  width: "clamp(112px, 26vw, 196px)",
  height: "auto",
  aspectRatio: "1 / 1",
  objectFit: "contain",
  filter: "drop-shadow(0 18px 28px rgba(0, 0, 0, 0.45))",
  [theme.breakpoints.down("sm")]: {
    width: "clamp(96px, 34vw, 148px)",
  },
}));

// ─── Component ───────────────────────────────────────────────
const GameSetup = () => {
  const [boardSize, setBoardSize] = useState(getInitialBoardSize);
  const [botAnchorEl, setBotAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBot, setSelectedBot] = useState<BotOption | null>(null);
  const [diffAnchorEl, setDiffAnchorEl] = useState<null | HTMLElement>(null);

  const navigate = useNavigate();
  const { isLoggedIn } = useSession();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // ── Tamaño de tablero ───────────────────────────

  const handleDecreaseSize = () => {
    if (boardSize > minBoardSize) {
      const newSize = boardSize - 1;
      setBoardSize(newSize);
      sessionStorage.setItem("boardSize", newSize.toString());
    }
  };

  const handleIncreaseSize = () => {
    if (boardSize < maxBoardSize) {
      const newSize = boardSize + 1;
      setBoardSize(newSize);
      sessionStorage.setItem("boardSize", newSize.toString());
    }
  };

  // ── Menú de bots ──────────────────────────────────────────

  const handleBotMenuOpen = (e: React.MouseEvent<HTMLElement>) => {
    setBotAnchorEl(e.currentTarget);
  };

  const handleBotMenuClose = () => {
    setBotAnchorEl(null);
    setDiffAnchorEl(null);
    setSelectedBot(null);
  };

  
  const handleBotClick = (e: React.MouseEvent<HTMLElement>, bot: BotOption) => {
    setSelectedBot(bot);
    setDiffAnchorEl(e.currentTarget);
  };

  // ── Menú de dificultad ────────────────────────────────────

  const handleDiffMenuClose = () => {
    setDiffAnchorEl(null);
    setSelectedBot(null);
  };

  const handleDifficultySelect = (difficulty: Difficulty) => {
    if (!selectedBot) return;

    setBotAnchorEl(null);
    setDiffAnchorEl(null);
    setSelectedBot(null);

    navigate("/game", {
      state: {
        mode: "bot" as GameMode,
        bot_id: selectedBot.bot_id,
        difficulty,
      },
    });
  };

  // ── PvP ──────────────────────────────────────────────────

  const handleStartPvp = () => {
    navigate("/game", { state: { mode: "pvp" as GameMode } });
  };

  return (
    <PageWrapper>
      <ContentShell>
      <DivColumn
        style={{
          minHeight: "auto",
          padding: 0,
          border: "none",
          background: "transparent",
          backdropFilter: "none",
        }}
      >
        <Title>New Game</Title>
        <SubTitle>Select a game mode to start playing</SubTitle>
      </DivColumn>

      <Logo
        src="/logo.svg"
        alt="game logo"
      />

      <DivRow>
        {/* ── Modo PvP ── */}
        <DivColumn>
          <ModeButton data-testid="start-pvp-game" variant="outlined" onClick={handleStartPvp}>
            ▲ Player vs Player ▲
          </ModeButton>
          <ModeDescription>Play locally against a friend</ModeDescription>
        </DivColumn>

        {/* ── Modo Bot ── */}
        <DivColumn>
          <ModeButton  variant="outlined" onClick={handleBotMenuOpen}>
            ▲ Player vs Bot 🤖 ▾
          </ModeButton >
          <ModeDescription>Play against our bots</ModeDescription>

          {/* Primer nivel: lista de bots */}
          <StyledMenu
            anchorEl={botAnchorEl}
            open={Boolean(botAnchorEl)}
            onClose={handleBotMenuClose}
            disableAutoFocusItem
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            {BOT_OPTIONS.map((bot) => (
              <BotMenuItem
                key={bot.bot_id}
                selected={selectedBot?.bot_id === bot.bot_id}
                onClick={(e) => handleBotClick(e, bot)}
              >
                <BotLabel>{bot.label} ▸</BotLabel>
                <BotDescription>{bot.description}</BotDescription>
              </BotMenuItem>
            ))}
          </StyledMenu>

          {/* Segundo nivel: dificultades del bot seleccionado */}
          <StyledMenu
            anchorEl={diffAnchorEl}
            open={Boolean(diffAnchorEl)}
            onClose={handleDiffMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
          >
            <MenuHeader>{selectedBot?.label} — difficulty</MenuHeader>
            <Divider sx={{ borderColor: "#2a2a2a", mb: 0.5 }} />

            {DIFFICULTIES.map((d) => (
              <DifficultyMenuItem
                key={d}
                onClick={() => handleDifficultySelect(d)}
              >
                <DifficultyDot color={DIFFICULTY_COLOR[d]} />
                <DifficultyLabel>{d}</DifficultyLabel>
              </DifficultyMenuItem>
            ))}
          </StyledMenu>
        </DivColumn>
        <DivColumn>
        
        <SpinnerContainer>
          <SpinnerBtn 
            onClick={handleDecreaseSize} 
            disabled={boardSize <= minBoardSize}
            aria-label="Decrease board size"
          >
            −
          </SpinnerBtn>
          
          <SpinnerValue>{boardSize}</SpinnerValue>
          
          <SpinnerBtn 
            onClick={handleIncreaseSize} 
            disabled={boardSize >= maxBoardSize}
            aria-label="Increase board size"
          >
            +
          </SpinnerBtn>
        </SpinnerContainer>
        <ModeDescription>Board size</ModeDescription>
        
      </DivColumn>
      </DivRow>
      </ContentShell>
    </PageWrapper>
  );
};

export default GameSetup;

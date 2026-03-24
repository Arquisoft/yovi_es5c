import { useState } from "react";
import { Button, Divider, Menu, MenuItem, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { useSession } from "../SessionContext";
import { Navigate } from "react-router-dom";

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
];

const DIFFICULTIES: Difficulty[] = ["Easy", "Medium", "Hard"];

const DIFFICULTY_COLOR: Record<Difficulty, string> = {
  Easy: "#4caf50",
  Medium: "#ff9800",
  Hard: "#f44336",
};

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

const BotMenuButton = styled(Button)({
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

const StyledMenu = styled(Menu)({
  "& .MuiPaper-root": {
    backgroundColor: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 4,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.6)",
    minWidth: 220,
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
  color: "#555",
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

  const [botAnchorEl, setBotAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBot, setSelectedBot] = useState<BotOption | null>(null);
  const [diffAnchorEl, setDiffAnchorEl] = useState<null | HTMLElement>(null);

  const navigate = useNavigate();
  const { isLoggedIn } = useSession();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

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
        {/* ── Modo PvP ── */}
        <DivColumn>
          <ModeButton variant="outlined" onClick={handleStartPvp}>
            ▲ Player vs Player ▲
          </ModeButton>
          <ModeDescription>Play locally against a friend</ModeDescription>
        </DivColumn>

        {/* ── Modo Bot ── */}
        <DivColumn>
          <BotMenuButton variant="outlined" onClick={handleBotMenuOpen}>
            ▲ Player vs Bot 🤖 ▾
          </BotMenuButton>
          <ModeDescription>Play against our bots</ModeDescription>

          {/* Primer nivel: lista de bots */}
          <StyledMenu
            anchorEl={botAnchorEl}
            open={Boolean(botAnchorEl)}
            onClose={handleBotMenuClose}
            disableAutoFocusItem
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
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
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
      </DivRow>
    </PageWrapper>
  );
};

export default GameSetup;

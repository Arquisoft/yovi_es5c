import { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import { useNavigate, Navigate } from "react-router-dom";
import { useSession } from "../SessionContext";
import axios from "axios";
import { PageWrapper, ContentShell, DivColumn, Title, SubTitle } from "../components/PageLayout";

const apiEndpoint = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Types ───────────────────────────────────────────────────
type Result = "won" | "lost";

interface GameSession {
  _id: string;
  userId: string;
  rival: string;
  level: number;
  duration: number;
  result: Result;
  createdAt: string;
}

// ─── Helpers ─────────────────────────────────────────────────
const formatDuration = (seconds: number): string => {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const formatDate = (iso: string): string => {
  const now = new Date();
  const date = new Date(iso);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "hace unos segundos";
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffHour < 24) return `hace ${diffHour} h`;
  if (diffDay < 7) return `hace ${diffDay} día${diffDay > 1 ? "s" : ""}`;

  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Colores centralizados ────────────────────────────────────
const RESULT_COLORS: Record<Result, { solid: string; muted: string }> = {
  won:  { solid: "#4a7c59", muted: "rgba(74,124,89,0.25)" },
  lost: { solid: "#7c4a4a", muted: "rgba(124,74,74,0.25)" },
};

const rivalColors = (rival: string) =>
  rival === "multiplayer"
    ? { color: "#6a9cc8", bg: "rgba(100,140,200,0.08)", border: "rgba(100,140,200,0.2)" }
    : { color: "#c8a84b", bg: "rgba(200,168,75,0.08)",  border: "rgba(200,168,75,0.2)" };

const resultColors = (result: Result) =>
  result === "won"
    ? { color: "#6aab7e", bg: "rgba(74,124,89,0.1)",  border: RESULT_COLORS.won.muted }
    : { color: "#ab6a6a", bg: "rgba(124,74,74,0.1)", border: RESULT_COLORS.lost.muted };

// ─── Styled components ───────────────────────────────────────
const Badge = styled("span")<{ color: string; bg: string; border: string }>(
  ({ color, bg, border }) => ({
    fontSize: "0.72rem",
    padding: "3px 8px",
    borderRadius: 999,
    letterSpacing: "0.05em",
    backgroundColor: bg,
    color,
    border: `1px solid ${border}`,
  })
);

const StatsRow = styled("div")({
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: "clamp(12px, 2vw, 20px)",
});

const StatCard = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "18px 20px",
  border: "1px solid rgba(200, 168, 75, 0.14)",
  borderRadius: 18,
  backgroundColor: "#111",
});

const StatValue = styled("span")({
  fontFamily: "Georgia, serif",
  fontSize: "1.6rem",
  color: "#c8a84b",
  letterSpacing: "0.04em",
});

const StatLabel = styled("span")({
  fontSize: "0.7rem",
  color: "#777",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
});

const TableWrapper = styled("div")(({ theme }) => ({
  width: "100%",
  maxWidth: 1000,
  borderRadius: 22,
  border: "1px solid #1e1e1e",
  overflow: "hidden",
  [theme.breakpoints.down("sm")]: {
    border: "none",
    backgroundColor: "transparent",
  },
}));

const TableHeader = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 200px 80px 90px 80px",
  padding: "10px 20px",
  backgroundColor: "#111",
  borderBottom: "1px solid #222",
  [theme.breakpoints.down("sm")]: {
    display: "none",
  },
}));

const HeaderCell = styled("span")({
  fontSize: "0.65rem",
  color: "#444",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
});

const TableRow = styled("div")<{ result: Result }>(({ result, theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 200px 80px 90px 80px",
  padding: "14px 20px",
  borderBottom: "1px solid #161616",
  alignItems: "center",
  transition: "background-color 0.15s ease",
  borderLeft: `2px solid ${RESULT_COLORS[result].solid}`,
  "&:last-child": { borderBottom: "none" },
  "&:hover": { backgroundColor: "#131313" },
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "1fr",
    gap: 12,
    padding: "16px",
    marginBottom: 12,
    border: `1px solid ${RESULT_COLORS[result].muted}`,
    borderLeft: `3px solid ${RESULT_COLORS[result].solid}`,
    borderRadius: 18,
    backgroundColor: "#111",
    "&:last-child": { marginBottom: 0 },
  },
}));

const Cell = styled("span")(({ theme }) => ({
  fontSize: "0.82rem",
  color: "#888",
  letterSpacing: "0.03em",
  [theme.breakpoints.down("sm")]: {
    display: "grid",
    gridTemplateColumns: "92px minmax(0, 1fr)",
    gap: 12,
    alignItems: "center",
    "&::before": {
      content: "attr(data-label)",
      fontSize: "0.68rem",
      color: "#666",
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    },
  },
}));

const EmptyState = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  padding: "40px 0",
  color: "#333",
});

const EmptyIcon = styled("span")({
  fontSize: "2.5rem",
  opacity: 0.3,
});

const EmptyText = styled("p")({
  fontFamily: "Georgia, serif",
  fontSize: "0.9rem",
  color: "#444",
  letterSpacing: "0.05em",
  margin: 0,
  textAlign: "center",
});

const BackButton = styled("button")({
  background: "none",
  border: "1px solid #2a2a2a",
  color: "#555",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  padding: "8px 20px",
  borderRadius: 999,
  cursor: "pointer",
  transition: "all 0.2s ease",
  textTransform: "uppercase",
  width: "100%",
  maxWidth: 320,
  "&:hover": {
    borderColor: "#c8a84b",
    color: "#c8a84b",
  },
});

const LoadingText = styled("p")({
  fontFamily: "Georgia, serif",
  fontSize: "0.85rem",
  color: "#444",
  letterSpacing: "0.08em",
  animation: "pulse 1.5s ease-in-out infinite",
  "@keyframes pulse": {
    "0%, 100%": { opacity: 0.4 },
    "50%": { opacity: 1 },
  },
});

// ─── Component ───────────────────────────────────────────────
const GameHistory = () => {
  const [history, setHistory] = useState<GameSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isLoggedIn, username } = useSession();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await axios.get<GameSession[]>(
          `${apiEndpoint}/user/${username}/history`
        );
        setHistory(res.data);
      } catch (err: any) {
        const backendError = err.response?.data?.error || err.message || "Error fetching history";
        setError(backendError);
      } finally {
        setLoading(false);
      }
    };

    if (username) fetchHistory();
  }, [username]);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  const wins = history.filter((g) => g.result === "won").length;
  const losses = history.filter((g) => g.result === "lost").length;
  const winRate = history.length > 0 ? Math.round((wins / history.length) * 100) : 0;

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
          <Title>Game History</Title>
          <SubTitle>Your past matches</SubTitle>
        </DivColumn>

      {!loading && history.length > 0 && (
        <StatsRow>
          <StatCard>
            <StatValue>{history.length}</StatValue>
            <StatLabel>Played</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{wins}</StatValue>
            <StatLabel>Wins</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{losses}</StatValue>
            <StatLabel>Losses</StatLabel>
          </StatCard>
          <StatCard>
            <StatValue>{winRate}%</StatValue>
            <StatLabel>Win rate</StatLabel>
          </StatCard>
        </StatsRow>
      )}

      {loading && <LoadingText>Loading matches...</LoadingText>}

      {error && (
        <SubTitle style={{ color: "#7c4a4a" }}>
          Could not load history.
        </SubTitle>
      )}

      {!loading && !error && history.length === 0 && (
        <EmptyState>
          <EmptyIcon>♟</EmptyIcon>
          <EmptyText>No games played yet</EmptyText>
        </EmptyState>
      )}

      {!loading && !error && history.length > 0 && (
        <TableWrapper>
          <TableHeader>
            <HeaderCell>Date</HeaderCell>
            <HeaderCell>Rival</HeaderCell>
            <HeaderCell>Level</HeaderCell>
            <HeaderCell>Duration</HeaderCell>
            <HeaderCell>Result</HeaderCell>
          </TableHeader>

          {history.map((game) => (
            <TableRow key={game._id} result={game.result}>
              <Cell data-label="Date">{formatDate(game.createdAt)}</Cell>
              <Cell data-label="Rival">
                <Badge {...rivalColors(game.rival)}>
                  {game.rival === "multiplayer" ? "👤 Player" : "🤖 " + game.rival}
                </Badge>
              </Cell>
              <Cell data-label="Level" style={{ color: "#666" }}>{game.level ?? "—"}</Cell>
              <Cell data-label="Duration">{formatDuration(game.duration)}</Cell>
              <Cell data-label="Result">
                <Badge {...resultColors(game.result)}>
                  {game.result === "won" ? "Win" : "Lost"}
                </Badge>
              </Cell>
            </TableRow>
          ))}
        </TableWrapper>
        )}

        <BackButton onClick={() => navigate("/set")}>← Back to select Mode</BackButton>
      </ContentShell>
    </PageWrapper>
  );
};

export default GameHistory;
import { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import { useNavigate, Navigate } from "react-router-dom";
import { useSession } from "../SessionContext";
import axios from "axios";

//endpoint
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

  // Si es más antiguo, mostramos fecha normal
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─── Styled components ───────────────────────────────────────
const PageWrapper = styled("div")({
  flex: 1,
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  paddingTop: 32,
  paddingBottom: 32,
  gap: 40,
  backgroundColor: "#0d0d0d",
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

const Title = styled("h1")({
  fontFamily: "Georgia, serif",
  fontSize: "2rem",
  color: "#e8d89a",
  letterSpacing: "0.08em",
  margin: 0,
});

const SubTitle = styled("p")({
  fontFamily: "Georgia, serif",
  fontSize: "0.9rem",
  color: "#666",
  letterSpacing: "0.05em",
  margin: 0,
});

const StatsRow = styled("div")({
  display: "flex",
  gap: 24,
  justifyContent: "center",
});

const StatCard = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 4,
  padding: "16px 28px",
  border: "1px solid #222",
  borderRadius: 4,
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
  color: "#555",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
});

const TableWrapper = styled("div")({
  width: "100%",
  maxWidth: 1000,
  borderRadius: 4,
  border: "1px solid #1e1e1e",
  overflow: "hidden",
});

const TableHeader = styled("div")({
  display: "grid",
  gridTemplateColumns: "1fr 200px 80px 90px 80px",
  padding: "10px 20px",
  backgroundColor: "#111",
  borderBottom: "1px solid #222",
});

const HeaderCell = styled("span")({
  fontSize: "0.65rem",
  color: "#444",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
});

const TableRow = styled("div")<{ result: Result }>(({ result }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 200px 80px 90px 80px",
  padding: "14px 20px",
  borderBottom: "1px solid #161616",
  alignItems: "center",
  transition: "background-color 0.15s ease",
  borderLeft: `2px solid ${result === "won" ? "#4a7c59" : "#7c4a4a"}`,
  "&:last-child": {
    borderBottom: "none",
  },
  "&:hover": {
    backgroundColor: "#131313",
  },
}));

const Cell = styled("span")({
  fontSize: "0.82rem",
  color: "#888",
  letterSpacing: "0.03em",
});

const RivalBadge = styled("span")<{ rival: string }>(({ rival }) => ({
  fontSize: "0.72rem",
  padding: "3px 8px",
  borderRadius: 2,
  letterSpacing: "0.05em",
  backgroundColor:
  rival === "multiplayer" ? "rgba(100, 140, 200, 0.08)" : "rgba(200, 168, 75, 0.08)",
  color: rival === "multiplayer" ? "#6a9cc8" : "#c8a84b",
  border: `1px solid ${rival === "multiplayer" ? "rgba(100,140,200,0.2)" : "rgba(200,168,75,0.2)" }`,
}));

const ResultBadge = styled("span")<{ result: Result }>(({ result }) => ({
  fontSize: "0.72rem",
  padding: "3px 8px",
  borderRadius: 2,
  letterSpacing: "0.05em",
  backgroundColor:
    result === "won" ? "rgba(74, 124, 89, 0.1)" : "rgba(124, 74, 74, 0.1)",
  color: result === "won" ? "#6aab7e" : "#ab6a6a",
  border: `1px solid ${result === "won" ? "rgba(74,124,89,0.25)" : "rgba(124,74,74,0.25)"}`,
}));

const EmptyState = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  padding: "60px 0",
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
});

const BackButton = styled("button")({
  background: "none",
  border: "1px solid #2a2a2a",
  color: "#555",
  fontSize: "0.75rem",
  letterSpacing: "0.08em",
  padding: "8px 20px",
  borderRadius: 4,
  cursor: "pointer",
  transition: "all 0.2s ease",
  textTransform: "uppercase",
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
  const winRate =
    history.length > 0 ? Math.round((wins / history.length) * 100) : 0;

  return (
    <PageWrapper>
      <DivColumn>
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
              <Cell>{formatDate(game.createdAt)}</Cell>
              <Cell>
                <RivalBadge rival={game.rival}>
                  {game.rival === "multiplayer" ? "👤 Player" : "🤖 "+game.rival}
                </RivalBadge>
              </Cell>
              <Cell style={{ color: "#666" }}>{game.level ?? "—"}</Cell>
              <Cell>{formatDuration(game.duration)}</Cell>
              <Cell>
                <ResultBadge result={game.result}>
                  {game.result === "won" ? "Win" : "Lose"}
                </ResultBadge>
              </Cell>
            </TableRow>
          ))}
        </TableWrapper>
      )}

      <BackButton onClick={() => navigate("/set")}>← Back to select Mode</BackButton>
    </PageWrapper>
  );
};

export default GameHistory;

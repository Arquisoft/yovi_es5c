import { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import { useNavigate,Navigate } from "react-router-dom";
import { useSession } from "../SessionContext";
import axios from "axios";

const apiEndpoint = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ─── Types ───────────────────────────────────────────────────
interface RankingEntry {
  username: string;
  played: number;
  wins: number;
  losses: number;
  winRate: number;
}
type SortField = 'wins' | 'winRate' | 'played' | 'losses';
type SortOrder = 'asc' | 'desc';

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



// ─── Table ───────────────────────────────────────────────────
const TableWrapper = styled("div")({
  width: "100%",
  maxWidth: 1000,
  borderRadius: 4,
  border: "1px solid #1e1e1e",
  overflow: "hidden",
});

const TableHeader = styled("div")({
  display: "grid",
  gridTemplateColumns: "60px 1fr 120px 120px 120px 200px",
  padding: "10px 20px",
  backgroundColor: "#111",
  borderBottom: "1px solid #222",
});

const HeaderCell = styled("span")({
  fontSize: "0.8rem",
  color: "#444",
  letterSpacing: "0.15em",
  textTransform: "uppercase",
});

const TableRow = styled("div")<{ isMe: boolean }>(({ isMe }) => ({
  display: "grid",
  gridTemplateColumns: "60px 1fr 120px 120px 120px 200px",
  padding: "14px 20px",
  borderBottom: "1px solid #161616",
  alignItems: "center",
  transition: "background-color 0.15s ease",
  backgroundColor: isMe ? "rgba(200,168,75,0.04)" : "transparent",
  borderLeft: isMe ? "2px solid #c8a84b" : "2px solid transparent",
  "&:last-child": { borderBottom: "none" },
  "&:hover": { backgroundColor: "#131313" },
}));

const Cell = styled("span")({
  fontSize: "0.9 rem",
  color: "#888",
  letterSpacing: "0.03em",
});

const RankCell = styled("span")<{ rank: number }>(({ rank }) => ({
  fontFamily: "Georgia, serif",
  fontSize: "0.85rem",
  color: rank === 1 ? "#c8a84b" : rank === 2 ? "#888" : rank === 3 ? "#7a5c3a" : "#444",
  letterSpacing: "0.04em",
}));

const NameCell = styled("span")<{ isMe: boolean }>(({ isMe }) => ({
  fontSize: "0.9 rem",
  color: isMe ? "#e8d89a" : "#aaa",
  fontFamily: isMe ? "Georgia, serif" : "inherit",
  letterSpacing: "0.03em",
  display: "flex",
  alignItems: "center",
  gap: 6,
}));

const YouBadge = styled("span")({
  fontSize: "0.6rem",
  padding: "2px 6px",
  borderRadius: 2,
  backgroundColor: "rgba(200,168,75,0.1)",
  color: "#c8a84b",
  border: "1px solid rgba(200,168,75,0.25)",
  letterSpacing: "0.06em",
  textTransform: "uppercase",
});

const WinRateBar = styled("div")<{ rate: number }>(({ rate }) => ({
  position: "relative",
  width: "100%",
  height: 3,
  backgroundColor: "#1a1a1a",
  borderRadius: 2,
  overflow: "hidden",
  "&::after": {
    content: '""',
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    width: `${rate}%`,
    backgroundColor: rate >= 60 ? "#4a7c59" : rate >= 40 ? "#c8a84b" : "#7c4a4a",
    borderRadius: 2,
  },
}));

const EmptyState = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  padding: "60px 0",
  color: "#333",
});

const EmptyIcon = styled("span")({ fontSize: "2.5rem", opacity: 0.3 });

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
  "&:hover": { borderColor: "#c8a84b", color: "#c8a84b" },
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

const MEDALS = ["🥇", "🥈", "🥉"];

// ─── Component ───────────────────────────────────────────────
const Ranking = () => {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const navigate  = useNavigate();
  const { isLoggedIn, username } = useSession();
  const [sortBy, setSortBy] = useState<SortField>('wins');
  const [order, setOrder]   = useState<SortOrder>('desc');
  const sortLabels: Record<SortField, string> = {
    wins:    'wins',
    winRate: 'win rate',
    played:  'games played',
    losses:  'losses',
  };
  
  const orderLabel = order === 'desc' ? 'descending' : 'ascending';

  const SortableHeader = ({ field, label }: { field: SortField, label: string }) => (
    <HeaderCell
      onClick={() => handleSort(field)}
      style={{ cursor: 'pointer', color: sortBy === field ? '#c8a84b' : '#444' }}
    >
    {label} {sortBy === field ? (order === 'desc' ? '↓' : '↑') : ''}
    </HeaderCell>
  );

  const handleSort = (field: SortField) => {
    if (field === sortBy) {
      setOrder(prev => prev === 'desc' ? 'asc' : 'desc'); 
    } else {
      setSortBy(field);
      setOrder('desc'); 
    }
  };

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const res = await axios.get<RankingEntry[]>(`${apiEndpoint}/game/ranking`, {
        params: { sortBy, order }});
        setRanking(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || "Error fetching ranking");
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [sortBy, order]);

  if (!isLoggedIn) return <Navigate to="/login" replace />;



  return (
    <PageWrapper>
      <DivColumn>
        <Title>Ranking</Title>
        <SubTitle>
          Global leaderboard · sorted by {sortLabels[sortBy]} {orderLabel}
        </SubTitle>
      </DivColumn>

      {loading && <LoadingText>Loading ranking...</LoadingText>}

      {error && (
        <SubTitle style={{ color: "#7c4a4a" }}>Could not load ranking.</SubTitle>
      )}

      {!loading && !error && ranking.length === 0 && (
        <EmptyState>
          <EmptyIcon>♟</EmptyIcon>
          <EmptyText>No games played yet</EmptyText>
        </EmptyState>
      )}


      {/* ── Table ── */}
      {!loading && !error && ranking.length > 0 && (
        <TableWrapper>
          <TableHeader>
            <HeaderCell>#</HeaderCell>
            <HeaderCell>Player</HeaderCell>
            <SortableHeader field="played"  label="Played"   />
            <SortableHeader field="wins"    label="Wins"     />
            <SortableHeader field="losses"  label="Losses"   />
            <SortableHeader field="winRate" label="Win rate" />
          </TableHeader>

          {ranking.map((entry, idx) => {
            const isMe = entry.username === username;
            return (
              <TableRow key={entry.username} isMe={isMe}>
                <RankCell rank={idx + 1}>
                  {idx < 3 ? MEDALS[idx] : `${idx + 1}`}
                </RankCell>

                <NameCell isMe={isMe}>
                  {entry.username}
                  {isMe && <YouBadge>you</YouBadge>}
                </NameCell>

                <Cell>{entry.played}</Cell>
                <Cell style={{ color: "#6aab7e" }}>{entry.wins}</Cell>
                <Cell style={{ color: "#ab6a6a" }}>{entry.losses}</Cell>

                <Cell>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span>{entry.winRate}%</span>
                    <WinRateBar rate={entry.winRate} />
                  </div>
                </Cell>
              </TableRow>
            );
          })}
        </TableWrapper>
      )}

      <BackButton onClick={() => navigate("/set")}>← Back to select Mode</BackButton>
    </PageWrapper>
  );
};

export default Ranking;
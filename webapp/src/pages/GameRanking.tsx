import { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import { useNavigate,Navigate } from "react-router-dom";
import { useSession } from "../SessionContext";
import axios from "axios";
import { useTranslation } from 'react-i18next'
import { PageWrapper, DivColumn, Title, SubTitle, EmptyState, EmptyIcon, EmptyText, BackButton, LoadingText } from "../components/CommonComponents";

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
  color: "#ddd8c8",
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
  fontSize: "0.9rem",
  color: "#888",
  letterSpacing: "0.03em",
});

const getRankColor = (rank: number): string => {
  if (rank === 1) return "#c8a84b";
  if (rank === 2) return "#888";
  if (rank === 3) return "#7a5c3a";
  return "#444";
};

const RankCell = styled("span")<{ rank: number }>(({ rank }) => ({
  fontFamily: "Georgia, serif",
  fontSize: "0.85rem",
  color: getRankColor(rank),
  letterSpacing: "0.04em",
}));

const NameCell = styled("span")<{ isMe: boolean }>(({ isMe }) => ({
  fontSize: "0.9rem",
  color: isMe ? "#e8d89a" : "#ddd8c8",
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

const getWinRateColor = (rate: number): string => {
  if (rate >= 60) return "#4a7c59";
  if (rate >= 40) return "#c8a84b";
  return "#7c4a4a";
};

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
    backgroundColor: getWinRateColor(rate),
    borderRadius: 2,
  },
}));



const MEDALS = ["🥇", "🥈", "🥉"];


interface SortableHeaderProps {
  field: SortField;
  label: string;
  sortBy: SortField;
  order: SortOrder;
  onSort: (field: SortField) => void;
}

const getSortIndicator = (field: SortField, sortBy: SortField, order: SortOrder): string => {
  if (sortBy !== field) return '';
  return order === 'desc' ? '↓' : '↑';
};

const SortableHeader = ({ field, label, sortBy, order, onSort }: SortableHeaderProps) => (
  <HeaderCell
    onClick={() => onSort(field)}
    style={{ cursor: 'pointer', color: sortBy === field ? '#c8a84b' : '#ddd8c8' }}
  >
    {label} {getSortIndicator(field, sortBy, order)}
  </HeaderCell>
);

// ─── Component ───────────────────────────────────────────────
const Ranking = () => {
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const navigate  = useNavigate();
  const { isLoggedIn, username } = useSession();
  const [sortBy, setSortBy] = useState<SortField>('wins');
  const [order, setOrder]   = useState<SortOrder>('desc');
  const { t } = useTranslation()


  

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
        <Title>{t('ranking.title')}</Title>
        <SubTitle>
          {t('ranking.subtitle', {
          sort: t(`ranking.sort.${sortBy}`),
          order: t(`ranking.order.${order}`)
           })}
        </SubTitle>
      </DivColumn>

      {loading && <LoadingText>{t('ranking.loading')}</LoadingText>}

      {error && (
        <SubTitle style={{ color: "#7c4a4a" }}>{t('ranking.error')}</SubTitle>
      )}

      {!loading && !error && ranking.length === 0 && (
        <EmptyState>
          <EmptyIcon>♟</EmptyIcon>
          <EmptyText>{t('ranking.empty')}</EmptyText>
        </EmptyState>
      )}


      {/* ── Table ── */}
      {!loading && !error && ranking.length > 0 && (
        <TableWrapper>
          <TableHeader>
            <HeaderCell>#</HeaderCell>
            <HeaderCell>{t('ranking.player')}</HeaderCell>
            <SortableHeader field="played"  label={t('ranking.played')}    sortBy={sortBy} order={order} onSort={handleSort} />
            <SortableHeader field="wins"    label={t('ranking.wins')}       sortBy={sortBy} order={order} onSort={handleSort} />
            <SortableHeader field="losses"  label={t('ranking.losses')}     sortBy={sortBy} order={order} onSort={handleSort} />
            <SortableHeader field="winRate" label={t('ranking.winRate')}   sortBy={sortBy} order={order} onSort={handleSort} />
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
                  {isMe && <YouBadge>{t('ranking.you')}</YouBadge>}
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

      <BackButton onClick={() => navigate("/set")}>{t('ranking.back')}</BackButton>
    </PageWrapper>
  );
};

export default Ranking;
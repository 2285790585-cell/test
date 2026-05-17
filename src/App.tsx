import { useCallback, useEffect, useRef, useState } from "react";
import questionsPool from "./data/questions.json";
import type { Question } from "./types/question";
import { isoToMonthIndex, monthIndexToIso, TIMELINE_MONTH_COUNT } from "./lib/dates";
import { haversineKm } from "./lib/geo";
import { scoreRound, type RoundScore } from "./lib/scoring";
import { panoramaSrc } from "./lib/assets";
import { PanoramaViewer } from "./components/PanoramaViewer";
import { MapPanel, type LngLat } from "./components/MapPanel";
import { TimeSlider } from "./components/TimeSlider";
import { CountdownBar } from "./components/CountdownBar";
import { FeedbackPanel } from "./components/FeedbackPanel";

const ROUNDS = 5;
const SECONDS = 30;

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function pickDeck(pool: Question[]): Question[] {
  if (pool.length < ROUNDS) {
    throw new Error(`题库至少需要 ${ROUNDS} 道题`);
  }
  return shuffle(pool).slice(0, ROUNDS);
}

export default function App() {
  const amapKey = import.meta.env.VITE_AMAP_KEY as string | undefined;

  const [screen, setScreen] = useState<"home" | "play" | "summary">("home");
  const [deck, setDeck] = useState<Question[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [phase, setPhase] = useState<"answer" | "feedback">("answer");
  const [guess, setGuess] = useState<LngLat | null>(null);
  const [monthIdx, setMonthIdx] = useState(() => Math.floor(TIMELINE_MONTH_COUNT / 2));
  const [scores, setScores] = useState<number[]>([]);
  const [lastScore, setLastScore] = useState<RoundScore | null>(null);
  const [lastPlayerMonth, setLastPlayerMonth] = useState<string>("");

  const submittedRef = useRef(false);

  useEffect(() => {
    if (phase === "answer") submittedRef.current = false;
  }, [qIdx, phase]);

  const question = deck[qIdx];

  const startGame = () => {
    const next = pickDeck(questionsPool as Question[]);
    setDeck(next);
    setQIdx(0);
    setPhase("answer");
    setGuess(null);
    setMonthIdx(Math.floor(TIMELINE_MONTH_COUNT / 2));
    setScores([]);
    setLastScore(null);
    setLastPlayerMonth("");
    setScreen("play");
  };

  const submitRound = useCallback(() => {
    if (!question || phase !== "answer") return;
    if (submittedRef.current) return;
    submittedRef.current = true;

    const truth: LngLat = { lat: question.latitude, lng: question.longitude };
    const g = guess ?? { lat: 0, lng: 0 };
    const distanceKm = haversineKm(g.lat, g.lng, truth.lat, truth.lng);
    const playerMonth = monthIndexToIso(monthIdx);
    const s = scoreRound(distanceKm, playerMonth, question.date);

    setLastScore(s);
    setLastPlayerMonth(playerMonth);
    setScores((prev) => [...prev, s.total]);
    setPhase("feedback");
  }, [guess, monthIdx, phase, question]);

  const goNext = () => {
    if (qIdx + 1 >= ROUNDS) {
      setScreen("summary");
      return;
    }
    setQIdx((i) => i + 1);
    setPhase("answer");
    setGuess(null);
    setMonthIdx(Math.floor(TIMELINE_MONTH_COUNT / 2));
  };

  const onPick = useCallback((p: LngLat) => {
    setGuess(p);
  }, []);

  const total = scores.reduce((a, b) => a + b, 0);

  if (screen === "home") {
    return (
      <div className="shell hero">
        <span className="hero__era">一九三四 — 一九三六</span>
        <h1 className="hero__title">长征·时空谜踪</h1>
        <p className="hero__subtitle">
          透过历史场景影像，在地图上标定地点、在时间轴上锁定月份，还原红军长征的关键瞬间。
        </p>
        <ul className="hero__rules">
          <li>每局 {ROUNDS} 题，每题 {SECONDS} 秒</li>
          <li>点击地图选点，拖动时间轴选月份</li>
          <li>提交后查看偏差与史实解读</li>
        </ul>
        <div className="btn-row">
          <button className="btn btn--primary" type="button" onClick={startGame}>
            开始征程
          </button>
        </div>
      </div>
    );
  }

  if (screen === "summary") {
    return (
      <div className="shell summary">
        <span className="hero__era">征程告捷</span>
        <h2>本局总成绩</h2>
        <div className="score-big">{total.toFixed(1)}</div>
        <p className="muted">五题得分累加 · 越接近史实越高分</p>
        <div className="btn-row">
          <button className="btn btn--primary" type="button" onClick={startGame}>
            再来一局
          </button>
          <button className="btn" type="button" onClick={() => setScreen("home")}>
            返回首页
          </button>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="shell">
        <p>题库加载异常，请刷新页面。</p>
      </div>
    );
  }

  const truth: LngLat = { lat: question.latitude, lng: question.longitude };

  return (
    <div className="shell game">
      <section className="panorama-section">
        <div className="panorama-frame">
          <header className="panorama-frame__head">
            <h2 className="panorama-frame__title">{question.event_name}</h2>
            <span className="panorama-frame__badge">
              第 {qIdx + 1} / {ROUNDS} 题
            </span>
          </header>
          <PanoramaViewer
            className="panorama-host"
            panoramaUrl={panoramaSrc(question.panorama_url)}
            eventName={question.event_name}
          />
        </div>
      </section>

      <aside className="side">
        <div className="floating">
          <CountdownBar
            roundKey={question.id}
            seconds={SECONDS}
            active={phase === "answer"}
            onComplete={submitRound}
          />
          {phase === "answer" ? (
            <button className="btn btn--primary" type="button" onClick={submitRound}>
              提交本题
            </button>
          ) : (
            <button className="btn btn--primary" type="button" onClick={goNext}>
              {qIdx + 1 >= ROUNDS ? "查看总结" : "下一题"}
            </button>
          )}
        </div>

        <div className="card">
          <p className="card__label">长征时间轴</p>
          <TimeSlider
            value={monthIdx}
            onChange={setMonthIdx}
            disabled={phase === "feedback"}
            mode={phase === "feedback" ? "result" : "pick"}
            truthIndex={phase === "feedback" ? isoToMonthIndex(question.date) : null}
          />
        </div>

        <div className="card card--map">
          <p className="card__label">地图选点</p>
          <MapPanel
            amapKey={amapKey}
            question={question}
            mode={phase === "answer" ? "pick" : "result"}
            guess={guess}
            truth={truth}
            onPick={phase === "answer" ? onPick : undefined}
          />
          {phase === "answer" && !guess ? (
            <p className="muted" style={{ margin: "8px 8px 0", fontSize: 12 }}>
              点击地图标记你认为的事件发生位置
            </p>
          ) : null}
        </div>

        {phase === "feedback" && lastScore ? (
          <div className="card">
            <FeedbackPanel question={question} score={lastScore} playerMonthIso={lastPlayerMonth} />
          </div>
        ) : null}
      </aside>
    </div>
  );
}

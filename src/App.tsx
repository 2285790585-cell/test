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
        <div className="pill">纯前端演示工程 · 题库与规则可继续扩展</div>
        <h1>长征·时空谜踪</h1>
        <p>
          一局 {ROUNDS} 题：观察全景图，在地图上点选地点，并用时间轴选择月份。每题{" "}
          {SECONDS} 秒，提交后查看偏差与得分。
        </p>
        <div className="btn-row">
          <button className="btn btn--primary" type="button" onClick={startGame}>
            开始游戏
          </button>
        </div>
      </div>
    );
  }

  if (screen === "summary") {
    return (
      <div className="shell summary">
        <h2>本局结束</h2>
        <div className="score-big">{total.toFixed(1)}</div>
        <p className="muted">以上为 {ROUNDS} 题得分总和（示例公式，可在代码中调整权重）。</p>
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
      <section className="panorama-wrap">
        <PanoramaViewer
          className="panorama-host"
          panoramaUrl={panoramaSrc(question.panorama_url)}
        />
      </section>

      <aside className="side">
        <div className="card">
          <div className="topbar">
            <strong>
              第 {qIdx + 1} / {ROUNDS} 题
            </strong>
          </div>
        </div>

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
          <TimeSlider
            value={monthIdx}
            onChange={setMonthIdx}
            disabled={phase === "feedback"}
            mode={phase === "feedback" ? "result" : "pick"}
            truthIndex={phase === "feedback" ? isoToMonthIndex(question.date) : null}
          />
        </div>

        <div className="card" style={{ padding: 8 }}>
          <MapPanel
            amapKey={amapKey}
            question={question}
            mode={phase === "answer" ? "pick" : "result"}
            guess={guess}
            truth={truth}
            onPick={phase === "answer" ? onPick : undefined}
          />
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

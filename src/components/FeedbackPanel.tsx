import type { Question } from "../types/question";
import type { RoundScore } from "../lib/scoring";

type Props = {
  question: Question;
  score: RoundScore;
  playerMonthIso: string;
};

export function FeedbackPanel({ question, score, playerMonthIso }: Props) {
  return (
    <div className="feedback">
      <h3 className="feedback__title">{question.event_name}</h3>
      <p className="feedback__desc">{question.description}</p>
      <ul className="feedback__stats">
        <li>
          地点偏差：<strong>{score.distanceKm.toFixed(1)}</strong> km
        </li>
        <li>
          时间偏差：<strong>{score.monthDelta}</strong> 个月
        </li>
        <li>
          你的时间选择：<strong>{playerMonthIso}</strong>（正确{" "}
          <strong>{question.date}</strong>）
        </li>
        <li>
          本题得分：<strong>{score.total.toFixed(1)}</strong>
        </li>
      </ul>
    </div>
  );
}

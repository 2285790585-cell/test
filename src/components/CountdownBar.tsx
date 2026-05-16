import { useEffect, useRef, useState } from "react";

type Props = {
  roundKey: string | number;
  seconds: number;
  active: boolean;
  onComplete: () => void;
};

export function CountdownBar({ roundKey, seconds, active, onComplete }: Props) {
  const [leftMs, setLeftMs] = useState(seconds * 1000);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    setLeftMs(seconds * 1000);
  }, [seconds, roundKey]);

  useEffect(() => {
    if (!active) return;

    const started = performance.now();
    const duration = seconds * 1000;

    const id = window.setInterval(() => {
      const elapsed = performance.now() - started;
      const left = Math.max(0, duration - elapsed);
      setLeftMs(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onCompleteRef.current();
      }
    }, 100);

    return () => window.clearInterval(id);
  }, [active, seconds, roundKey]);

  const ratio = seconds > 0 ? leftMs / (seconds * 1000) : 0;
  const urgent = leftMs <= 5000 && active;

  return (
    <div className={`countdown ${urgent ? "countdown--urgent" : ""}`}>
      <div className="countdown__label">
        剩余 {(leftMs / 1000).toFixed(1)} 秒
      </div>
      <div className="countdown__track">
        <div className="countdown__fill" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

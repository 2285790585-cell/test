import { useEffect, useRef } from "react";
import AMapLoader from "@amap/amap-jsapi-loader";
import type { Question } from "../types/question";

export type LngLat = { lat: number; lng: number };

type Props = {
  amapKey?: string;
  question: Question;
  mode: "pick" | "result";
  guess: LngLat | null;
  truth: LngLat;
  onPick?: (p: LngLat) => void;
};

export function MapPanel({ amapKey, question, mode, guess, truth, onPick }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    if (!amapKey) {
      wrap.innerHTML =
        '<div class="map-fallback">请在项目根目录创建 <code>.env</code> 并设置 <code>VITE_AMAP_KEY</code>（见 <code>.env.example</code>）。</div>';
      return () => {
        wrap.innerHTML = "";
      };
    }

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;

    const clickHandler = (e: {
      lnglat: { getLng: () => number; getLat: () => number };
    }) => {
      if (mode !== "pick" || !onPick) return;
      onPick({ lat: e.lnglat.getLat(), lng: e.lnglat.getLng() });
    };

    void AMapLoader.load({
      key: amapKey,
      version: "2.0",
    }).then((AMap) => {
      if (cancelled || !wrapRef.current) return;

      map = new AMap.Map(wrapRef.current, {
        zoom: 5,
        center: [truth.lng, truth.lat],
        viewMode: "2D",
      });

      if (cancelled) {
        map.destroy();
        map = null;
        return;
      }

      if (mode === "pick") {
        map.on("click", clickHandler);
        if (guess) {
          const mk = new AMap.Marker({
            position: [guess.lng, guess.lat],
            label: { content: "你的选择", direction: "top" },
          });
          map.add(mk);
        }
        return;
      }

      const truthMarker = new AMap.Marker({
        position: [truth.lng, truth.lat],
        label: { content: "正确位置", direction: "top" },
      });

      const gLng = guess ? guess.lng : truth.lng;
      const gLat = guess ? guess.lat : truth.lat;
      const guessMarker = new AMap.Marker({
        position: [gLng, gLat],
        label: { content: guess ? "你的选择" : "未选点", direction: "top" },
      });

      const line = new AMap.Polyline({
        path: [
          [truth.lng, truth.lat],
          [gLng, gLat],
        ],
        strokeColor: "#c45c26",
        strokeWeight: 3,
        strokeOpacity: 0.9,
      });

      map.add(truthMarker);
      map.add(guessMarker);
      map.add(line);
      map.setFitView([truthMarker, guessMarker, line]);
    });

    return () => {
      cancelled = true;
      if (map) {
        if (mode === "pick") {
          map.off("click", clickHandler);
        }
        map.destroy();
        map = null;
      }
      if (wrapRef.current) wrapRef.current.innerHTML = "";
    };
  }, [amapKey, question.id, mode, truth.lat, truth.lng, guess?.lat, guess?.lng, onPick]);

  return <div ref={wrapRef} className="map-panel" />;
}

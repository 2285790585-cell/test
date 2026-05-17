import { useEffect, useRef, useState } from "react";
import "pannellum/build/pannellum.css";
import "pannellum/build/pannellum.js";

type PannellumApi = {
  viewer: (
    container: HTMLElement,
    config: Record<string, unknown>
  ) => { destroy(): void };
};

type Props = {
  panoramaUrl: string;
  className?: string;
  eventName?: string;
};

/** 宽高比 ≥ 1.65 视为等距柱状全景，否则用平面沉浸展示（避免上下黑块） */
const PANORAMA_RATIO = 1.65;

function useImageAspect(url: string): number | null {
  const [ratio, setRatio] = useState<number | null>(null);

  useEffect(() => {
    setRatio(null);
    const img = new Image();
    img.onload = () => {
      if (img.naturalHeight > 0) {
        setRatio(img.naturalWidth / img.naturalHeight);
      }
    };
    img.onerror = () => setRatio(1);
    img.src = url;
  }, [url]);

  return ratio;
}

export function PanoramaViewer({ panoramaUrl, className, eventName }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const aspect = useImageAspect(panoramaUrl);
  const isSphere = aspect !== null && aspect >= PANORAMA_RATIO;

  useEffect(() => {
    if (!isSphere) return;
    const el = hostRef.current;
    if (!el) return;

    const api = (window as unknown as { pannellum?: PannellumApi }).pannellum;
    if (!api) return;

    el.innerHTML = "";

    const v = api.viewer(el, {
      type: "equirectangular",
      panorama: panoramaUrl,
      autoLoad: true,
      showControls: false,
      compass: false,
      hfov: 96,
      minHfov: 50,
      maxHfov: 110,
      minPitch: -28,
      maxPitch: 28,
      vaov: aspect && aspect > 2 ? 88 : 62,
      backgroundColor: [0.18, 0.1, 0.07],
    });

    return () => {
      v.destroy();
    };
  }, [panoramaUrl, isSphere, aspect]);

  if (aspect === null) {
    return (
      <div className={`panorama-viewer panorama-viewer--loading ${className ?? ""}`}>
        <div className="panorama-viewer__loader" />
        <span>场景加载中…</span>
      </div>
    );
  }

  if (!isSphere) {
    return (
      <div className={`panorama-viewer panorama-viewer--flat ${className ?? ""}`}>
        <img className="panorama-viewer__flat-bg" src={panoramaUrl} alt="" aria-hidden />
        <img className="panorama-viewer__flat-img" src={panoramaUrl} alt={eventName ?? "历史场景"} />
        <div className="panorama-viewer__vignette" aria-hidden />
        <span className="panorama-viewer__hint">历史场景影像</span>
      </div>
    );
  }

  return (
    <div className={`panorama-viewer panorama-viewer--sphere ${className ?? ""}`}>
      <div ref={hostRef} className="panorama-viewer__sphere-host" />
      <div className="panorama-viewer__vignette" aria-hidden />
      <span className="panorama-viewer__hint">拖动环视 · 滚轮缩放</span>
    </div>
  );
}

import { useEffect, useRef } from "react";
import "pannellum/build/pannellum.css";
import "pannellum/build/pannellum.js";

type PannellumApi = {
  viewer: (
    container: HTMLElement,
    config: Record<string, unknown>
  ) => { destroy(): void };
};

export function PanoramaViewer({
  panoramaUrl,
  className,
}: {
  panoramaUrl: string;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const api = (window as unknown as { pannellum?: PannellumApi }).pannellum;
    if (!api) {
      // eslint-disable-next-line no-console
      console.error("Pannellum 未加载到 window.pannellum");
      return;
    }

    const v = api.viewer(el, {
      type: "equirectangular",
      panorama: panoramaUrl,
      autoLoad: true,
      showControls: false,
      compass: false,
      hfov: 100,
      minHfov: 40,
      maxHfov: 120,
    });

    return () => {
      v.destroy();
    };
  }, [panoramaUrl]);

  return <div ref={hostRef} className={className} />;
}

import React, { useMemo } from "react";
import Svg, { Circle, G, Line, Polygon, Defs, LinearGradient, Stop, Polyline, Rect } from "react-native-svg";

interface Props {
  size?: number;
  color?: string;
}

export function RadarChart({ size = 200, color = "#00C4F0", data = [], labels = [], T }: { size?: number; color?: string; data: number[]; labels: string[]; T: any }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const axes = data.length || 5;
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getPoint = (angle: number, ratio: number) => ({
    x: cx + r * ratio * Math.cos(angle - Math.PI / 2),
    y: cy + r * ratio * Math.sin(angle - Math.PI / 2),
  });

  const gridPts = useMemo(() => levels.map((lv) =>
    Array.from({ length: axes }, (_, i) => {
      const angle = (i / axes) * Math.PI * 2;
      return getPoint(angle, lv);
    })
  ), [axes]);

  const dataPts = useMemo(() => data.map((v, i) => {
    const angle = (i / axes) * Math.PI * 2;
    return getPoint(angle, Math.max(v, 0) / 100);
  }), [data, axes]);

  const polyStr = dataPts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
      {gridPts.map((pts, li) => (
        <Polygon key={`grid-${li}`} points={pts.map((p) => `${p.x},${p.y}`).join(" ")} fill="none" stroke={T.bord} strokeWidth="0.8" />
      ))}
      {Array.from({ length: axes }, (_, i) => {
        const angle = (i / axes) * Math.PI * 2;
        const end = getPoint(angle, 1);
        return <Line key={`axis-${i}`} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke={T.bord} strokeWidth="0.8" />;
      })}
      <Polygon points={polyStr} fill={`${color}30`} stroke={color} strokeWidth="2" />
      {dataPts.map((p, i) => (
        <G key={`pt-${i}`}>
          <Circle cx={p.x} cy={p.y} r="4" fill={color} stroke={T.card} strokeWidth="1.5" />
        </G>
      ))}
    </Svg>
  );
}

export function BarChart({ data = [], maxValue = 1, width = 300, height = 100, color = "#00C4F0", T }: { data: { label: string; value: number }[]; maxValue?: number; width?: number; height?: number; color?: string; T: any }) {
  const barW = 28;
  const barGap = 8;
  const chartH = height;
  const totalWidth = data.length * (barW + barGap);

  return (
    <Svg height={chartH + 30} width={totalWidth + 10}>
      {data.map((d, i) => {
        const x = 5 + i * (barW + barGap);
        const h = Math.max(1, (d.value / Math.max(maxValue, 1)) * (chartH - 20));
        return (
          <G key={`bar-${i}`}>
            <Rect x={x} y={chartH - h - 10} width={barW} height={h} rx="4" fill={d.value > 0 ? color : T.lo} />
          </G>
        );
      })}
    </Svg>
  );
}

export function AreaChart({ data = [], width = 300, height = 100, color = "#FFD600", T, showDots = false }: { data: number[]; width?: number; height?: number; color?: string; T: any; showDots?: boolean }) {
  const pts = useMemo(() => data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * width,
    y: height - (v / Math.max(...data, 1)) * (height - 15),
  })), [data, width, height]);

  const polyStr = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const areaStr = `0,${height} ${polyStr} ${width},${height}`;

  return (
    <Svg height={height + 10} width={width} viewBox={`0 0 ${width} ${height + 10}`}>
      <Defs>
        <LinearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.3" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Polygon points={areaStr} fill={`url(#grad-${color.replace("#", "")})`} />
      <Polyline points={polyStr} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
      {showDots && pts.map((p, i) => (
        <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r="4" fill={color} />
      ))}
    </Svg>
  );
}

export function LineChart({ data = [], width = 300, height = 80, color = "#00C4F0", T }: { data: number[]; width?: number; height?: number; color?: string; T: any }) {
  const pts = useMemo(() => data.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * width,
    y: height - (v / 5) * (height - 10),
  })), [data, width, height]);

  const polyStr = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <Svg height={height + 10} width={width} viewBox={`0 0 ${width} ${height + 10}`}>
      <Polyline points={polyStr} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <Circle key={`pt-${i}`} cx={p.x} cy={p.y} r="3" fill={color} />
      ))}
    </Svg>
  );
}

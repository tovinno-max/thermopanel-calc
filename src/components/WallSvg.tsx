import { useId } from 'react';
import type { BrickColor, JointColor } from '../domain/colors';
import { PANEL_H_MM, PANEL_W_MM, brickRectsOf, outlineOf } from '../domain/geometry';
import type { PlacedPanel } from '../domain/layout';

type Props = {
  widthMm: number;
  heightMm: number;
  panels: PlacedPanel[];
  brick: BrickColor;
  joint: JointColor;
  drawBricks: boolean;
  label: string;
};

function screenPoint(x: number, y: number, heightMm: number): string {
  return `${x},${heightMm - y}`;
}

export function WallSvg({ widthMm, heightMm, panels, brick, joint, drawBricks, label }: Props) {
  const clipId = `clip${useId().replace(/:/g, '')}`;
  const stroke = Math.max(widthMm, heightMm) / 480;
  const pad = stroke * 3;
  const outlineOfPanel = (panel: PlacedPanel) =>
    outlineOf(panel.orientation)
      .map(([x, y]) => screenPoint(panel.xMm + x, panel.yMm + y, heightMm))
      .join(' ');
  const wholeStroke = joint.id === 'temnyj' ? '#f4efe6' : '#2b2622';
  const ordered = [...panels].sort((a, b) => Number(a.cut) - Number(b.cut));

  return (
    <svg
      className="wall-svg"
      viewBox={`${-pad} ${-pad} ${widthMm + pad * 2} ${heightMm + pad * 2}`}
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={widthMm} height={heightMm} />
        </clipPath>
      </defs>
      <rect x="0" y="0" width={widthMm} height={heightMm} fill="#f3eadc" />
      <g clipPath={`url(#${clipId})`}>
        {panels.map((panel) => (
          <g key={`${panel.row}-${panel.column}`}>
            <polygon points={outlineOfPanel(panel)} fill={joint.fill} />
            {drawBricks &&
              brickRectsOf(panel.orientation).map((face) => {
                const x = panel.xMm + face.x;
                const y = heightMm - (panel.yMm + face.y + face.h);
                return (
                  <rect
                    key={`${face.x}-${face.y}`}
                    x={x}
                    y={y}
                    width={face.w}
                    height={face.h}
                    fill={brick.fill}
                    stroke={brick.stroke}
                    strokeWidth={stroke * 0.18}
                  />
                );
              })}
            {panel.cut && <polygon points={outlineOfPanel(panel)} fill="#d35400" opacity="0.13" />}
            <PanelMark panel={panel} widthMm={widthMm} heightMm={heightMm} />
          </g>
        ))}
        {ordered.map((panel) => (
          <polygon
            key={`edge-${panel.row}-${panel.column}`}
            points={outlineOfPanel(panel)}
            fill="none"
            stroke={panel.cut ? '#c2410c' : wholeStroke}
            strokeWidth={panel.cut ? stroke * 1.7 : stroke * 1.15}
            strokeDasharray={panel.cut ? `${stroke * 7} ${stroke * 4.5}` : undefined}
            strokeLinejoin="miter"
          />
        ))}
      </g>
      <rect
        x="0"
        y="0"
        width={widthMm}
        height={heightMm}
        fill="none"
        stroke="#2b2622"
        strokeWidth={stroke * 1.35}
      />
    </svg>
  );
}

function PanelMark({
  panel,
  widthMm,
  heightMm,
}: {
  panel: PlacedPanel;
  widthMm: number;
  heightMm: number;
}) {
  const left = Math.max(panel.xMm, 0);
  const right = Math.min(panel.xMm + PANEL_W_MM, widthMm);
  const bottom = Math.max(panel.yMm, 0);
  const top = Math.min(panel.yMm + PANEL_H_MM, heightMm);
  const spanX = right - left;
  const spanY = top - bottom;
  if (spanX < 140 || spanY < 90) return null;
  const size = Math.min(spanX, spanY, 280) * 0.42;
  return (
    <text
      x={(left + right) / 2}
      y={heightMm - (bottom + top) / 2}
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={size}
      fontFamily="Manrope, sans-serif"
      fontWeight={700}
      fill="#6e2c18"
      opacity={0.72}
    >
      {panel.orientation}
    </text>
  );
}

import React from 'react';
import { View } from 'react-native';

type Props = {
  /** 0–100 */
  percent: number;
  size?: number;
  thickness?: number;
  /** Arc (progress) color. */
  color: string;
  /** Unfilled track color. */
  trackColor: string;
  /** Color punched into the centre to turn the disc into a ring — usually the card background. */
  holeColor: string;
  children?: React.ReactNode;
};

// A real circular progress **ring**, drawn with pure Views (no react-native-svg,
// which is absent and would force a native rebuild). Technique: fill each
// semicircle with the arc color, then cover it with a track-colored rectangle
// pinned at the circle centre; rotating that cover 0°→180° sweeps a straight
// radial edge, so the *uncovered* region is a true circular sector. Two halves
// give a full 0–100% sweep. A centre hole converts the disc into a donut ring.
//
// Fill magnitude is exact for any percent; the second-half sweep direction is
// purely cosmetic (both halves read as one continuous arc).
export const ProgressRing = React.memo(
  ({ percent, size = 104, thickness = 12, color, trackColor, holeColor, children }: Props) => {
    const clamped = Math.min(Math.max(percent, 0), 100);
    const r = size / 2;
    const inner = size - thickness * 2;

    // Right half fills during 0–50%, left half during 50–100%.
    const rightCoverRotate = (Math.min(clamped, 50) / 50) * 180; // 0° = covered, 180° = revealed
    const leftCoverRotate = clamped <= 50 ? 0 : ((clamped - 50) / 50) * 180;

    return (
      <View style={{ width: size, height: size, borderRadius: r, overflow: 'hidden' }}>
        {/* Track disc */}
        <View
          style={{ position: 'absolute', width: size, height: size, borderRadius: r, backgroundColor: trackColor }}
        />

        {/* Right half: colour semicircle + rotating track cover */}
        <View style={{ position: 'absolute', left: r, top: 0, width: r, height: size, overflow: 'hidden' }}>
          <View
            style={{ position: 'absolute', left: -r, top: 0, width: size, height: size, borderRadius: r, backgroundColor: color }}
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: r,
              height: size,
              backgroundColor: trackColor,
              transformOrigin: 'left center',
              transform: [{ rotate: `${rightCoverRotate}deg` }],
            }}
          />
        </View>

        {/* Left half: colour semicircle + rotating track cover (only relevant past 50%) */}
        <View style={{ position: 'absolute', left: 0, top: 0, width: r, height: size, overflow: 'hidden' }}>
          <View
            style={{ position: 'absolute', left: 0, top: 0, width: size, height: size, borderRadius: r, backgroundColor: color }}
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: r,
              height: size,
              backgroundColor: trackColor,
              transformOrigin: 'right center',
              transform: [{ rotate: `${leftCoverRotate}deg` }],
            }}
          />
        </View>

        {/* Centre hole → ring, holds the label */}
        <View
          style={{
            position: 'absolute',
            top: thickness,
            left: thickness,
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: holeColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </View>
      </View>
    );
  }
);

ProgressRing.displayName = 'ProgressRing';

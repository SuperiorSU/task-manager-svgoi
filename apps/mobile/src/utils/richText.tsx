import React from 'react';
import { Text, type TextStyle, type StyleProp } from 'react-native';

type Props = {
  text: string;
  ranges: [start: number, end: number][];
  style?: StyleProp<TextStyle>;
  boldStyle?: StyleProp<TextStyle>;
};

// Renders `text` with the given [start, end) character ranges bolded —
// used wherever a data-driven sentence needs inline emphasis (e.g. "You
// created admin — A. Sharma") without the UI hardcoding which words are bold.
export function BoldSegments({ text, ranges, style, boldStyle }: Props) {
  if (ranges.length === 0) {
    return <Text style={style}>{text}</Text>;
  }

  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const nodes: React.ReactNode[] = [];
  let cursor = 0;

  sorted.forEach(([start, end], idx) => {
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      <Text key={idx} style={[{ fontFamily: 'Inter-SemiBold' }, boldStyle]}>
        {text.slice(start, end)}
      </Text>
    );
    cursor = end;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));

  return <Text style={style}>{nodes}</Text>;
}

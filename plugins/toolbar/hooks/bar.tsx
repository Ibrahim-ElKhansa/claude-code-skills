// The context window as a stacked bar, one colour per /context category. It draws the context only, no usage-limit
// rows.
import type { BoxProps, ElementConstructor, TextProps } from 'claude-code'

import type { ContextBarSegment, ContextBarSnapshot } from '../types'

type Draw = {
  Box: ElementConstructor<BoxProps>
  Text: ElementConstructor<TextProps>
}

export const formatTokens = (n: number): string => {
  if (n >= 1_000_000) return `${+(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`

  return `${n}`
}

export const summary = (s: ContextBarSnapshot): string =>
  `${s.percent}% · ${formatTokens(s.tokens)} / ${formatTokens(s.window)}`

// The reading turns amber at 70% and red at 85%.
export const toneFor = (percent: number): 'error' | 'warning' | null =>
  percent >= 85 ? 'error' : percent >= 70 ? 'warning' : null

// Splits `width` cells between the segments by their share of `total`: every
// used segment with tokens gets at least one cell, and the cells always add
// up to `width` (largest remainder first, the widest segment giving back).
export const cellsFor = (
  segments: readonly ContextBarSegment[],
  total: number,
  width: number,
): number[] => {
  if (segments.length === 0 || total <= 0) return segments.map(() => 0)
  const exact = segments.map(s => (s.tokens / total) * width)
  const cells = exact.map((x, i) =>
    Math.max(segments[i]?.kind === 'used' && (segments[i]?.tokens ?? 0) > 0 ? 1 : 0, Math.floor(x)),
  )
  let left = width - cells.reduce((a, b) => a + b, 0)
  const order = exact
    .map((x, i) => ({ rest: x - Math.floor(x), i }))
    .sort((a, b) => b.rest - a.rest)
  for (let k = 0; left > 0; k = (k + 1) % order.length, left--) {
    const i = order[k]?.i ?? 0
    cells[i] = (cells[i] ?? 0) + 1
  }
  while (left < 0) {
    const i = cells.indexOf(Math.max(...cells))
    cells[i] = (cells[i] ?? 0) - 1
    left++
  }

  return cells
}

export const bar = ({ Box, Text }: Draw, s: ContextBarSnapshot, columns: number) => {
  const width = Math.max(10, columns - 1)
  const cells = cellsFor(s.segments, s.measuredAgainst, width)
  const top = s.segments
    .filter(seg => seg.kind === 'used' && seg.tokens > 0)
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 4)
  const tone = toneFor(s.percent)

  return (
    <Box flexDirection="column">
      <Box key="bar" flexDirection="row">
        {s.segments.map((seg, i) => {
          const n = cells[i] ?? 0
          if (n === 0) return null
          if (seg.kind === 'used') return <Text color={seg.color}>{'█'.repeat(n)}</Text>
          return <Text dimColor>{(seg.kind === 'free' ? '░' : '▒').repeat(n)}</Text>
        })}
      </Box>
      <Box key="legend" flexDirection="row" flexWrap="wrap" columnGap={2}>
        {tone ? (
          <Text color={tone} bold>
            {summary(s)}
          </Text>
        ) : (
          <Text dimColor>{summary(s)}</Text>
        )}
        {top.map(seg => (
          <Text>
            <Text color={seg.color}>■</Text>
            <Text dimColor>
              {' '}
              {seg.name} {formatTokens(seg.tokens)}
            </Text>
          </Text>
        ))}
      </Box>
    </Box>
  )
}

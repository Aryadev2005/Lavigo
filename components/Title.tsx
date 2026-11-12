'use client'
import type { ReactNode } from 'react'
import SplitText, { type SplitTextProps } from './SplitText'

/** Site-wide heading reveal: words rise out of a mask as the heading scrolls into view (React Bits SplitText). */
export function Title({ text, children, tag = 'h2', ...rest }: Partial<SplitTextProps> & { text: string; children?: ReactNode }) {
  return (
    <SplitText
      text={text}
      tag={tag}
      splitType="words"
      effect="rise"
      mask
      delay={70}
      duration={0.95}
      ease="power4.out"
      textAlign="inherit"
      rootMargin="-40px"
      {...rest}
    >
      {children}
    </SplitText>
  )
}

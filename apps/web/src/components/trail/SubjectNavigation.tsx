import { useEffect, useRef, type ReactNode } from 'react'

export default function SubjectNavigation({ children, activeId }: { children: ReactNode; activeId: string | null | undefined }) {
  const rail = useRef<HTMLDivElement>(null)
  useEffect(() => {
    rail.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeId])
  return <nav aria-label="Matérias da trilha">
    <div ref={rail} className="trail-subject-tabs">{children}</div>
  </nav>
}

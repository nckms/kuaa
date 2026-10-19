import { useEffect, useRef, useState, type ReactNode } from 'react'

export default function SubjectNavigation({ children, activeId }: { children: ReactNode; activeId: string | null | undefined }) {
  const rail = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  function update() {
    const element = rail.current
    if (element) setEdges({ start: element.scrollLeft < 2, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 })
  }
  useEffect(() => {
    const element = rail.current
    if (!element) return
    const observer = new ResizeObserver(update)
    observer.observe(element)
    update()
    return () => observer.disconnect()
  }, [children])
  useEffect(() => {
    rail.current?.querySelector('.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    update()
  }, [activeId])
  function move(direction: number) {
    const element = rail.current
    element?.scrollBy({ left: direction * element.clientWidth * 0.75, behavior: 'smooth' })
  }
  return <nav aria-label="Matérias da trilha" className="trail-subject-navigation">
    <button className="trail-subject-arrow" type="button" aria-label="Matérias anteriores" title="Matérias anteriores" disabled={edges.start} onClick={() => move(-1)}><i className="bi bi-chevron-left" aria-hidden="true" /></button>
    <div ref={rail} onScroll={update} className="trail-subject-tabs d-flex gap-2 pb-1">{children}</div>
    <button className="trail-subject-arrow" type="button" aria-label="Próximas matérias" title="Próximas matérias" disabled={edges.end} onClick={() => move(1)}><i className="bi bi-chevron-right" aria-hidden="true" /></button>
  </nav>
}

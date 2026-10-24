import type { CSSProperties } from 'react'

export type LessonState = 'COMPLETED' | 'AVAILABLE' | 'LOCKED'

export type LessonNode = {
  number: number
  state: LessonState
}

type LessonConstellationProps = {
  lessons: LessonNode[]
  icon: string
}

const STATE_LABEL: Record<LessonState, string> = {
  COMPLETED: 'Concluída',
  AVAILABLE: 'Disponível',
  LOCKED: 'Bloqueada',
}

export function LessonConstellation({ lessons, icon }: LessonConstellationProps) {
  const total = Math.max(lessons.length, 1)
  const dense = lessons.length > 7
  const completedCount = lessons.filter((lesson) => lesson.state === 'COMPLETED').length
  const progress = Math.round((completedCount / total) * 100)

  return (
    <div
      className="relative h-[180px] w-full sm:h-[280px]"
      role="list"
      aria-label="Lições do módulo"
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1000 260"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="trail-progress-gradient" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        <path d="M 60 182 Q 500 -26 940 182" stroke="#242428" strokeWidth="2" />

        {lessons.length > 1 && (
          <path
            className="trail-shimmer-path"
            d="M 60 182 Q 500 -26 940 182"
            stroke="url(#trail-progress-gradient)"
            strokeWidth="1.5"
            strokeOpacity="0.45"
            strokeLinecap="round"
          />
        )}

        {lessons.length > 1 && progress > 0 && (
          <>
            <path
              d="M 60 182 Q 500 -26 940 182"
              stroke="url(#trail-progress-gradient)"
              strokeWidth="8"
              strokeOpacity="0.1"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${progress} 100`}
            />
            <path
              d="M 60 182 Q 500 -26 940 182"
              stroke="url(#trail-progress-gradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength={100}
              strokeDasharray={`${progress} 100`}
            />
          </>
        )}
      </svg>

      {lessons.map((lesson, index) => {
        const t = total === 1 ? 0.5 : index / (total - 1)
        const x = 6 + 88 * t
        const y = 30 + 40 * Math.pow(2 * t - 1, 2)
        const position: CSSProperties = { left: `${x}%`, top: `${y}%` }
        const isActive = lesson.state === 'AVAILABLE'

        const nodeClass =
          lesson.state === 'COMPLETED'
            ? 'border-[0.5px] border-trail-line bg-white/[0.05] text-white shadow-[0_0_18px_rgba(255,255,255,0.1)]'
            : isActive
              ? 'border border-trail-cyan bg-[#07131c] text-trail-cyan shadow-[0_0_32px_rgba(56,189,248,0.38)] ring-4 ring-trail-cyan/10'
              : 'border-[0.5px] border-trail-line bg-trail-subtle text-trail-muted'

        const sizeClass = dense
          ? isActive
            ? 'h-[22px] w-[22px] sm:h-11 sm:w-11 md:h-8 md:w-8 lg:h-11 lg:w-11'
            : 'h-5 w-5 sm:h-10 sm:w-10 md:h-7 md:w-7 lg:h-10 lg:w-10'
          : isActive
            ? 'h-8 w-8 sm:h-14 sm:w-14'
            : 'h-7 w-7 sm:h-12 sm:w-12'

        const ringClass = dense
          ? 'h-7 w-7 sm:h-14 sm:w-14 md:h-10 md:w-10 lg:h-14 lg:w-14'
          : 'h-10 w-10 sm:h-20 sm:w-20'

        const nodeIcon =
          lesson.state === 'COMPLETED' ? 'check' : lesson.state === 'LOCKED' ? 'lock' : icon

        return (
          <div
            key={lesson.number}
            role="listitem"
            aria-label={`Lição ${lesson.number}, ${STATE_LABEL[lesson.state]}`}
            aria-current={isActive ? 'step' : undefined}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={position}
          >
            <div className="relative flex items-center justify-center">
              {isActive && (
                <span
                  className={`pointer-events-none absolute inset-0 m-auto rounded-full border-[0.5px] border-trail-cyan/20 trail-pulse-ring ${ringClass}`}
                  aria-hidden="true"
                />
              )}
              <div
                className={`relative flex items-center justify-center rounded-full transition-colors ${sizeClass} ${nodeClass}`}
              >
                <span
                  className={`material-symbols-outlined ${
                    dense
                      ? 'text-[10px] sm:text-[18px] md:text-[13px] lg:text-[18px]'
                      : 'text-[14px] sm:text-[22px]'
                  }`}
                  aria-hidden="true"
                >
                  {nodeIcon}
                </span>
                <span
                  className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border-[0.5px] border-trail-line bg-trail-background font-mono font-medium text-neutral-300 ${
                    dense
                      ? 'h-2.5 min-w-2.5 px-0.5 text-[6px] sm:h-4 sm:min-w-4 sm:text-[9px] md:h-3 md:min-w-3 md:text-[7px] lg:h-4 lg:min-w-4 lg:text-[9px]'
                      : 'h-3 min-w-3 px-0.5 text-[7px] sm:h-4 sm:min-w-4 sm:text-[9px]'
                  }`}
                  aria-hidden="true"
                >
                  {String(lesson.number).padStart(2, '0')}
                </span>
              </div>
            </div>
            <span
              className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] ${
                dense ? 'hidden lg:block' : 'hidden sm:block'
              } ${
                lesson.state === 'AVAILABLE'
                  ? 'text-white'
                  : lesson.state === 'COMPLETED'
                    ? 'text-neutral-300'
                    : 'text-trail-muted'
              }`}
              aria-hidden="true"
            >
              Lição {String(lesson.number).padStart(2, '0')}
            </span>
          </div>
        )
      })}
    </div>
  )
}

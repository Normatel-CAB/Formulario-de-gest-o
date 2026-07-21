import { cn } from '../../lib/cn'

const PATHS: Record<string, string> = {
  shield: 'M12 3l7 3v6c0 4.5-3 7.7-7 9-4-1.3-7-4.5-7-9V6l7-3z',
  crown: 'M4 18h16M5 18l-1.5-9L8 12l4-6 4 6 4.5-3L19 18',
  eye: 'M2 12c1.6-3.6 5.4-7 10-7s8.4 3.4 10 7c-1.6 3.6-5.4 7-10 7s-8.4-3.4-10-7z|circle:12,12,3',
  wrench: 'M14.7 6.3a4 4 0 10-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 005.4-5.4l-2.8 2.8-2-2z',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20c0-3.3 3.6-6 8-6s8 2.7 8 6',
  users: 'M9 8a3.2 3.2 0 100 6.4A3.2 3.2 0 009 8zM3.5 19c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2|path:M16 8.5a2.8 2.8 0 100 5.6M18.5 19c0-2.4-1.6-4.4-3.8-5',
  star: 'M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3-4.8-4.3 6.4-.6z',
  'check-circle': 'M12 21a9 9 0 100-18 9 9 0 000 18z|path:M8.5 12.5l2.2 2.2L15.5 9.3',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6z|path:M19.4 13a7.6 7.6 0 000-2l2-1.6-2-3.4-2.4.6a7.7 7.7 0 00-1.7-1L15 3h-4l-.3 2.6a7.7 7.7 0 00-1.7 1l-2.4-.6-2 3.4L6.6 11a7.6 7.6 0 000 2l-2 1.6 2 3.4 2.4-.6c.5.4 1.1.8 1.7 1L11 21h4l.3-2.6c.6-.2 1.2-.6 1.7-1l2.4.6 2-3.4L19.4 13z',
  lock: 'M6 11V8a6 6 0 1112 0v3|rect:4,11,16,10,2',
  briefcase: 'M4 8h16v11H4z|path:M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2',
  clipboard: 'M9 4h6a1 1 0 011 1v2H8V5a1 1 0 011-1z|rect:5,6,14,15,2',
}

export function RbacIcon({ nome, className }: { nome: string; className?: string }) {
  const spec = PATHS[nome] ?? PATHS.shield
  const partes = spec.split('|')

  return (
    <svg className={cn('h-4 w-4', className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {partes.map((parte, i) => {
        if (parte.startsWith('circle:')) {
          const [cx, cy, r] = parte.replace('circle:', '').split(',').map(Number)
          return <circle key={i} cx={cx} cy={cy} r={r} />
        }
        if (parte.startsWith('rect:')) {
          const [x, y, w, h, rx] = parte.replace('rect:', '').split(',').map(Number)
          return <rect key={i} x={x} y={y} width={w} height={h} rx={rx} />
        }
        if (parte.startsWith('path:')) {
          return <path key={i} d={parte.replace('path:', '')} strokeLinecap="round" strokeLinejoin="round" />
        }
        return <path key={i} d={parte} strokeLinecap="round" strokeLinejoin="round" />
      })}
    </svg>
  )
}

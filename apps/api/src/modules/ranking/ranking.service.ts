import { prisma } from '../../lib/prisma'

// LGPD: nunca expõe o nome completo de terceiros.
// "Nicolas Silva" → "Nicolas S."  |  "Nicolas" → "Nicolas"
function toDisplayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length <= 1) return parts[0] ?? ''
  return `${parts[0]} ${parts[parts.length - 1]![0]}.`
}

export async function getRanking(vestibularId: string, requestingUserId: string) {
  // Query única: JOIN implícito via Enrollment, ORDER BY xp DESC, LIMIT 50 — sem N+1
  const [top50, requestingUser] = await Promise.all([
    prisma.user.findMany({
      where: { enrollments: { some: { vestibularId } } },
      orderBy: { xp: 'desc' },
      take: 50,
      select: { id: true, name: true, avatarUrl: true, xp: true, level: true },
    }),
    prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { xp: true, name: true, level: true },
    }),
  ])

  const entries = top50.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    // displayName truncado para todos — requisito LGPD
    displayName: toDisplayName(u.name),
    avatarUrl: u.avatarUrl,
    xp: u.xp,
    level: u.level,
  }))

  if (!requestingUser) return { entries, myRank: null }

  // Conta quantos usuários matriculados têm xp estritamente maior
  const usersAhead = await prisma.user.count({
    where: {
      enrollments: { some: { vestibularId } },
      xp: { gt: requestingUser.xp },
    },
  })

  return {
    entries,
    // myRank usa name completo: é o próprio usuário vendo a si mesmo
    myRank: {
      rank: usersAhead + 1,
      xp: requestingUser.xp,
      name: requestingUser.name,
      level: requestingUser.level,
    },
  }
}

import { prisma } from '../../lib/prisma'

export async function getRanking(vestibularId: string, requestingUserId: string) {
  // Query única: JOIN implícito via Enrollment, ORDER BY xp DESC, LIMIT 50 — sem N+1
  const [top50, requestingUser] = await Promise.all([
    prisma.user.findMany({
      where: { enrollments: { some: { vestibularId } } },
      orderBy: [{ xp: 'desc' }, { id: 'asc' }],
      take: 50,
      select: { xp: true, level: true },
    }),
    prisma.user.findUnique({
      where: { id: requestingUserId },
      select: { xp: true, name: true, level: true },
    }),
  ])

  const entries = top50.map((u, i) => ({
    rank: i + 1,
    displayName: `Estudante ${i + 1}`,
    xp: u.xp,
    level: u.level,
  }))

  if (!requestingUser) return { entries, myRank: null }

  // Usa o mesmo desempate da lista para manter a posicao pessoal consistente.
  const usersAhead = await prisma.user.count({
    where: {
      enrollments: { some: { vestibularId } },
      OR: [
        { xp: { gt: requestingUser.xp } },
        { xp: requestingUser.xp, id: { lt: requestingUserId } },
      ],
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

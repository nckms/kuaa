export interface RankEntry {
  rank: number
  displayName: string
  xp: number
  level: number
}

export interface MyRank {
  rank: number
  xp: number
  name: string
  level: number
}

export interface RankingData {
  entries: RankEntry[]
  myRank: MyRank | null
}

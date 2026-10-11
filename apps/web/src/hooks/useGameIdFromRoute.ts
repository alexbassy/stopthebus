import { useRouter } from 'next/router'

export default function useGameIdFromRoute() {
  const { query } = useRouter()
  const { id } = query
  return id as string
}

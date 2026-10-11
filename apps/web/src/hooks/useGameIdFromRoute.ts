import { useParams } from 'wouter'

export default function useGameIdFromRoute() {
  return useParams<{ id: string }>().id
}

import { useLayoutEffect, useState } from 'react'
import { SMALL_SCREEN_BREAKPOINT } from '../constants/styles'

export default function useIsSmallScreen(): boolean {
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(false)

  useLayoutEffect(() => {
    const onResize = () => {
      const isNowSmallScreen = window.matchMedia(
        `screen and (max-width: ${SMALL_SCREEN_BREAKPOINT}px)`
      ).matches

      if (isSmallScreen !== isNowSmallScreen) setIsSmallScreen(isNowSmallScreen)
    }

    window.addEventListener('resize', onResize)

    onResize()

    return () => {
      window.removeEventListener('resize', onResize)
    }
  })

  return isSmallScreen
}

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import useSound from 'use-sound'
import { OverlayContainer, TextContainer, Text, Button } from '@/components/overlay/visual'

interface EndRoundOverlayProps {
  duration?: number
  text: string
}

const overlayStates = {
  shown: { opacity: 1 },
  hidden: { opacity: 0 },
}

const EndRoundOverlay: React.FC<EndRoundOverlayProps> = ({ text, duration }) => {
  const [isOverlayShown, setIsOverlayShown] = useState<boolean>(true)
  const [playGameOver, { stop: stopGameOver }] = useSound('/sounds/game-over.mp3', {
    volume: 0.5,
  })

  useEffect(() => {
    playGameOver()
  }, [playGameOver])

  useEffect(() => {
    if (duration === 0) {
      return
    }
    setTimeout(() => {
      setIsOverlayShown(false)
    }, duration)
  }, [duration])

  return (
    <OverlayContainer
      variants={overlayStates}
      initial='shown'
      animate={isOverlayShown ? 'shown' : 'hidden'}
      transition={{ duration: 0.25 }}
    >
      <AnimatePresence>
        <TextContainer
          key='message'
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.5, type: 'spring', bounce: 0.25 }}
        >
          <Text>{text}</Text>
        </TextContainer>
      </AnimatePresence>
    </OverlayContainer>
  )
}

EndRoundOverlay.defaultProps = {
  duration: 1000,
}

export default EndRoundOverlay

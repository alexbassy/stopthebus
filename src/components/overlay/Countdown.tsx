import React, { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import useSound from 'use-sound'
import { OverlayContainer, TextContainer, Text, Button } from '@/components/overlay/visual'

interface CountdownProps {
  from: number
  interval?: number
  showAfter?: React.ReactNode
  afterMessageDuration?: number
  onComplete?: () => void
  onCancel?: () => void
}

const overlayStates = {
  shown: { opacity: 1 },
  hidden: { opacity: 0 },
}

const Countdown: React.FC<CountdownProps> = ({
  from,
  onComplete,
  interval,
  showAfter,
  afterMessageDuration,
  onCancel,
}) => {
  const [isOverlayShown, setIsOverlayShown] = useState<boolean>(true)
  const [isAfterMessageShown, setIsAfterMessageShown] = useState<boolean>(false)
  const intervalRef = useRef<number>()
  const [timeLeft, setTimeLeft] = useState<number>(from)
  const [playCountdown, { stop: stopCountdown }] = useSound('/sounds/countdown.mp3', {
    volume: 0.5,
  })

  useEffect(() => {
    playCountdown()
  }, [playCountdown])

  const handleCancel = () => {
    if (onCancel) {
      stopCountdown()
      onCancel()
    }
  }

  const onTimerComplete = useCallback(() => {
    // If there is no message to display, immediately hide the overlay
    if (!showAfter) {
      setIsOverlayShown(false)
    }

    setIsAfterMessageShown(true)

    window.setTimeout(() => {
      setIsOverlayShown(false)
    }, afterMessageDuration)
  }, [showAfter, afterMessageDuration])

  const updateTime = useCallback(() => {
    setTimeLeft((timeLeft) => {
      if (timeLeft <= 1 && intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      const newTime = timeLeft - 1

      if (newTime > 0) {
        return newTime
      }

      onTimerComplete()
      return Math.max(newTime, 1)
    })
  }, [onTimerComplete])

  useEffect(() => {
    intervalRef.current = window.setInterval(updateTime, interval)
    return () => window.clearInterval(intervalRef.current)
  }, [updateTime, interval])

  const displayedText = isAfterMessageShown ? showAfter : timeLeft

  return (
    <OverlayContainer
      variants={overlayStates}
      initial='shown'
      animate={isOverlayShown ? 'shown' : 'hidden'}
      onAnimationComplete={() => {
        if (!isOverlayShown && onComplete) onComplete()
      }}
      transition={{ duration: 0.25 }}
    >
      <AnimatePresence>
        <TextContainer
          key={isAfterMessageShown ? 'afterMessage' : timeLeft}
          initial={{ scale: 0.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.5, type: 'spring', bounce: 0.25 }}
        >
          <Text isLarger={isAfterMessageShown}>{displayedText}</Text>
        </TextContainer>
      </AnimatePresence>
      {onCancel && <Button onClick={handleCancel}>Cancel</Button>}
    </OverlayContainer>
  )
}

Countdown.defaultProps = {
  from: 3,
  interval: 1000,
  afterMessageDuration: 1500,
}

export default Countdown

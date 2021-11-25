import React, { useState, useCallback, useRef, useEffect } from 'react'
import { css } from '@emotion/react'
import styled from '@emotion/styled'
import { motion, AnimatePresence } from 'framer-motion'

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  background: radial-gradient(#000000bb, #000000dd);
`

const TextContainer = styled(motion.div)`
  width: 100%;
  height: 100%;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
`

interface TextProps {
  isLarger?: boolean
}

const Text = styled(motion.p)<TextProps>`
  font-size: ${(props) => (props.isLarger ? 30 : 20)}vw;
  font-weight: ${(props) => (props.isLarger ? 600 : 400)};
  color: #fff;
  margin: 0;
  ${(props) =>
    props.isLarger &&
    css`
      text-shadow: 0 0 50px #ffff00aa;
    `}
`

const Button = styled.button`
  appearance: none;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 1.5rem;
  font-size: 1.1rem;
  background: #222;
  color: #adadad;
  border: none;
  padding: 0.5rem 1.25rem;
  border-radius: 100px;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  transition-property: transform, opacity;
  transition: 0.15s ease;
  cursor: pointer;

  :active {
    transform: translateX(-50%) scale(0.95);
    opacity: 0.8;
  }

  :focus {
    outline: none;
  }
`

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
    <Overlay
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
      {onCancel && <Button onClick={onCancel}>Cancel</Button>}
    </Overlay>
  )
}

Countdown.defaultProps = {
  from: 3,
  interval: 1000,
  afterMessageDuration: 1500,
}

export default Countdown

import React, { useState, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { OverlayContainer } from '@/components/overlay/visual'

interface BaseOverlayProps {
  isShown: boolean
  onShown?: () => void
  onCancel?: () => void
}

const overlayStates = {
  shown: { opacity: 1 },
  hidden: { opacity: 0 },
}

const Base: React.FC<BaseOverlayProps> = ({ isShown, onShown, children }) => {
  return (
    <OverlayContainer
      variants={overlayStates}
      initial='shown'
      animate={isShown ? 'shown' : 'hidden'}
      onAnimationComplete={() => {
        if (isShown && onShown) onShown()
      }}
      transition={{ duration: 0.25 }}
    >
      <AnimatePresence>{children}</AnimatePresence>
    </OverlayContainer>
  )
}

export default Base

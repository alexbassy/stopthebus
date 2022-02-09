import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import styled from '@emotion/styled'

const Underlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgb(0 0 0 / 75%);
  display: flex;
  justify-content: center;
  align-items: center;
`

const Modal = styled(motion.div)`
  width: 70vh;
  max-width: 300px;
  border-radius: 8px;
  padding: 1rem;
  background: ${(props) => props.theme?.colours?.gameBackground};
  text-align: center;
  color: ${(props) => props.theme?.colours?.text};
`

interface DialogProps {
  children: React.ReactNode
}

function DialogWithOverlay(props: DialogProps) {
  return (
    <AnimatePresence>
      {props.children && (
        <Underlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {props.children}
        </Underlay>
      )}
    </AnimatePresence>
  )
}

export default function Dialog(props: DialogProps) {
  return createPortal(
    <DialogWithOverlay {...props} />,
    document.getElementById('dialog-portal') as Element
  )
}

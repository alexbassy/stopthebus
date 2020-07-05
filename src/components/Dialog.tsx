import React from 'react'
import { createPortal } from 'react-dom'
import styled from './styled'

const Underlay = styled('div')`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgb(0 0 0 / 50%);
  display: flex;
  justify-content: center;
  align-items: center;
`

const Modal = styled('div')`
  width: 70vh;
  max-width: 300px;
  box-shadow: 0 0 0 10px ${(props) => props.theme.colours.pink};
  border-radius: 8px;
  padding: 1rem;
  background: ${(props) => props.theme.colours.blue};
  text-align: center;
  color: ${(props) => props.theme.colours.text};
`

interface DialogProps {
  children: React.ReactNode
}

function DialogWithOverlay(props: DialogProps) {
  return (
    <Underlay>
      <Modal>{props.children}</Modal>
    </Underlay>
  )
}

export default function Dialog(props: DialogProps) {
  return createPortal(
    <DialogWithOverlay {...props} />,
    document.getElementById('dialog-portal') as Element
  )
}

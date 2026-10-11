import { motion } from 'framer-motion'
import styled from '@emotion/styled'
import isPropValid from '@emotion/is-prop-valid'
import { css } from '@emotion/react'

export const OverlayContainer = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  background: radial-gradient(#000000bb, #000000dd);
`

export const TextContainer = styled(motion.div)`
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

export const Text = styled(motion.p, {
  shouldForwardProp: (propName: string) => isPropValid(propName),
})<TextProps>`
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

export const Button = styled.button`
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

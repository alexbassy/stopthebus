import React, { SyntheticEvent } from 'react'
import styled from '@emotion/styled'
import { ExternalLink } from './visual'

const StyledLink = styled<'a'>('a')`
  text-decoration: none;
  --webkit-tap-highlight-color: transparent;
`.withComponent(ExternalLink)

const Title = styled.div`
  font-family: ${(props) => props.theme?.fonts?.title.name};
  color: ${(props) => props.theme?.colours?.yellow};
  background: linear-gradient(#f857a6, #ff5858);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
  font-size: 5rem;
  margin: 0;
  text-align: center;

  @media screen and (max-width: 760px) {
    font-size: 11vw;
  }
`

const Logo = styled.img`
  display: inline-block;
  height: 3.75rem;

  @media screen and (max-width: 760px) {
    height: 8vw;
    vertical-align: top;
  }
`

interface TitleProps {
  isInGame?: boolean
}

const PageTitle: React.FC<TitleProps> = (props) => {
  const handleClick = (event: SyntheticEvent<HTMLAnchorElement>) => {
    if (props.isInGame) {
      const isSure = window.confirm('Are you sure you want to leave the game?')
      if (!isSure) event.preventDefault()
    }
  }

  return (
    <StyledLink href='/' onClick={handleClick}>
      <Title>
        Stop The Bus <Logo src='/bus.svg' alt='Bus Icon' />
      </Title>
    </StyledLink>
  )
}

export default PageTitle

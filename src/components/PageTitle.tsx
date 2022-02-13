import React, { SyntheticEvent } from 'react'
import styled from '@emotion/styled'
import { ExternalLink } from './visual'

const StyledLink = styled.a`
  text-decoration: none;
  --webkit-tap-highlight-color: transparent;
`.withComponent(ExternalLink)

const Title = styled.div`
  font-family: ${(props) => props.theme?.fonts?.title.name};
  color: ${(props) => props.theme?.colours?.yellow};
  background: linear-gradient(60deg, #e23f90, #de40cb, #bd3fea, #783ee7, #4c6ce6, #4895ef);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 5rem;
  letter-spacing: -2px;
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
        <Logo src='/bus.svg' alt='' /> Stop The Bus
      </Title>
    </StyledLink>
  )
}

export default PageTitle

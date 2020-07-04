import React from 'react'
import { Helmet } from 'react-helmet'
import PageTitle from '../components/PageTitle'
import { ExternalLink, Spacing } from '../components/visual'
import styled from '../components/styled'

const StyledLink = styled<'a'>('a')`
  font-weight: bold;
`.withComponent(ExternalLink)

export default function Acknowledgements() {
  return (
    <div>
      <Helmet>
        <title>Acknowledgements - Stop The Bus</title>
      </Helmet>
      <PageTitle />
      <Spacing t={1} b={1}>
        <StyledLink onClick={() => window.history.back()}>← Go Back</StyledLink>
      </Spacing>
      <h1>Acknowledgements</h1>
      <ul>
        <li>
          “London Bus” icon by Oliver Guin from{' '}
          <ExternalLink href='https://thenounproject.com/term/london-bus/201348'>
            The Noun Project
          </ExternalLink>
        </li>
      </ul>
    </div>
  )
}

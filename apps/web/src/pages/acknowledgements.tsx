import React from 'react'
import Head from 'next/head'
import PageTitle from '@/components/PageTitle'
import { ExternalLink, Spacing } from '@/components/visual'
import styled from '@emotion/styled'

const StyledLink = styled.a`
  font-weight: bold;
`.withComponent(ExternalLink)

export default function Acknowledgements() {
  return (
    <div>
      <Head>
        <title>Acknowledgements - Stop The Bus</title>
      </Head>
      <PageTitle />
      <Spacing y={1}>
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

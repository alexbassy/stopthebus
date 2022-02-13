import styled from '@emotion/styled'
import React from 'react'

const Svg = styled.svg`
  position: fixed;
  pointer-events: none;
  z-index: -1;
`

const PageBackground: React.FC = (props) => (
  <Svg width={1147} height={932} fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
    <g opacity={0.3} filter='url(#a)' clipPath='url(#b)'>
      <path
        d='M836 233c0 128.682-101.855 233-227.5 233S381 361.682 381 233C381 104.318 482.855 0 608.5 0S836 104.318 836 233Z'
        fill='#E88585'
      />
      <path
        d='M480 184.5C480 338.864 357.774 464 207 464S-66 338.864-66 184.5 56.226-95 207-95 480 30.136 480 184.5Z'
        fill='#E89D85'
      />
      <path
        d='M1178 54c0 128.682-101.86 233-227.5 233C824.855 287 723 182.682 723 54c0-128.682 101.855-233 227.5-233C1076.14-179 1178-74.682 1178 54Zm66 576.5c0 179.769-142.37 325.5-318 325.5-175.627 0-318-145.731-318-325.5S750.373 305 926 305c175.63 0 318 145.731 318 325.5Z'
        fill='#85B8E8'
      />
      <path
        d='M663 716c0 221.466-175.281 401-391.5 401C55.28 1117-120 937.466-120 716S55.28 315 271.5 315C487.719 315 663 494.534 663 716Z'
        fill='#E885A9'
      />
      <path
        d='M691 786c0 128.682-101.855 233-227.5 233S236 914.682 236 786c0-128.682 101.855-233 227.5-233S691 657.318 691 786Z'
        fill='#E8B485'
      />
      <path
        d='M1208 338.5c0 58.266-46.11 105.5-103 105.5s-103-47.234-103-105.5S1048.11 233 1105 233s103 47.234 103 105.5Z'
        fill='#E88585'
      />
    </g>
    <defs>
      <clipPath id='b'>
        <path fill='#fff' d='M0 0h1147v932H0z' />
      </clipPath>
      <filter
        id='a'
        x={-270}
        y={-329}
        width={1664}
        height={1596}
        filterUnits='userSpaceOnUse'
        colorInterpolationFilters='sRGB'
      >
        <feFlood floodOpacity={0} result='BackgroundImageFix' />
        <feBlend in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
        <feGaussianBlur stdDeviation={75} result='effect1_foregroundBlur_108_717' />
      </filter>
    </defs>
  </Svg>
)

export default PageBackground

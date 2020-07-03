import React, { SyntheticEvent } from 'react'
import { Link, useHistory } from 'react-router-dom'
import styled from './styled'

const StyledLink = styled<'a'>('a')`
  text-decoration: none;
  --webkit-tap-highlight-color: transparent;
`.withComponent(Link)

const Text = styled<'h1'>('h1')`
  font-family: ${(props) => props.theme.fonts.title.name};
  color: ${(props) => props.theme.colours.yellow};
  background: linear-gradient(#f857a6, #ff5858);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
  font-size: 4.9rem;
  margin: 0;
  text-align: center;

  @media screen and (max-width: 760px) {
    font-size: 10vw;
  }
`

const Logo = styled<'div'>('div')`
  display: inline-block;
  height: 3.75rem;

  > svg {
    width: auto;
    height: 100%;
  }

  @media screen and (max-width: 760px) {
    height: 9vw;
    vertical-align: top;
  }
`

const BusIcon = `
<?xml version="1.0" encoding="UTF-8"?>
<svg width="91px" height="79px" viewBox="0 0 91 79" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>Bus Icon</title>
    <defs>
        <linearGradient x1="50%" y1="0%" x2="50%" y2="100%" id="linearGradient-1">
            <stop stop-color="#F857A6" offset="0%"></stop>
            <stop stop-color="#FF5858" offset="100%"></stop>
        </linearGradient>
    </defs>
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Group" fill="url(#linearGradient-1)" fill-rule="nonzero">
            <path d="M45.488,2.727 C45.809,2.586 53.477,-0.699 63.867,0.448 C71.677,1.312 80.837,3.993 83.691,8.037 L83.691,8.037 L84.324,8.956 C84.488,9.195 84.484,9.512 84.313,9.747 C84.296,9.772 84.27,9.79 84.249,9.812 C85.998,13.741 86.671,18.589 86.845,20.083 C87.364,20.276 87.693,20.501 87.767,20.871 C87.771,20.892 87.775,20.913 87.777,20.934 L87.777,20.934 L89.453,37.104 C89.479,37.354 89.365,37.599 89.157,37.741 C89.042,37.819 88.907,37.86 88.771,37.86 C88.758,37.86 88.746,37.856 88.734,37.856 L88.734,37.856 L89.857,60.521 C83.9000169,61.281322 73.8316162,61.3509632 71.9610876,61.3575161 L71.795,61.358 C71.284,61.146 70.761,60.931 70.229,60.714 C57.011,55.321 52.182,53.623 47.719,53.509 L47.719,53.509 L34.207,53.323 L39.211,37.164 C39.26,37.004 39.394,36.883 39.56,36.851 L39.56,36.851 L47.405,35.328 C47.422,35.324 47.437,35.322 47.454,35.321 C47.515,35.316 53.65,34.802 63.287,34.802 C66.173,34.802 69.115,34.848 72.032,34.939 C81.926,35.246 86.209,35.862 87.987,36.252 L87.987,36.252 L86.447,21.4 C86.406,21.383 86.353,21.363 86.293,21.342 C86.274,21.338 86.255,21.337 86.236,21.332 C84.957,20.949 81.216,20.19 70.537,19.398 C65.514,19.026 60.847,18.837 56.666,18.837 C53.173,18.837 50.688,18.972 49.219,19.085 C47.868,19.189 46.548,19.481 45.294,19.953 L45.294,19.953 L40.669,21.694 C39.353,22.189 38.341,23.236 37.89,24.567 L37.89,24.567 L27.958,53.794 C27.472,55.225 26.129,56.187 24.619,56.187 L24.619,56.187 L24.535,56.186 L5.438,55.731 C5.19,55.725 4.992,55.523 4.992,55.274 L4.992,55.274 L4.992,46 C4.992,45.771 5.163,45.576 5.391,45.547 L5.391,45.547 L24.84,43.052 L34.041,17.197 C35.383,13.428 38.104,10.394 41.704,8.652 L41.704,8.652 L46,6.574 C47.348,5.926 49.73,5.625 53.499,5.625 C57.444,5.625 62.631,5.96 67.649,6.322 C74.905,6.845 79.525,7.763 81.927,8.36 C81.901,8.321 81.876,8.279 81.85,8.24 C81.78,8.135 81.746,8.018 81.739,7.9 C79.151,5.514 72.875,2.823 63.718,1.811 C53.951,0.73 46.514,3.783 46.06,3.974 C44.195,4.963 8.494,23.896 7.228,24.414 C6.789,24.593 6.268,25.299 5.844,26.047 L5.844,26.047 L6.115,25.872 C6.13,25.862 6.147,25.853 6.164,25.844 L6.164,25.844 L29.632,14.491 C29.798,14.412 29.995,14.437 30.133,14.559 C30.271,14.68 30.323,14.872 30.264,15.047 L30.264,15.047 L26.41,26.581 C26.366,26.714 26.263,26.818 26.132,26.866 L26.132,26.866 L3.192,35.119 C2.69869231,36.7757692 2.63783432,38.174071 2.63078471,38.5754033 L2.63,38.691 L2.178,65.439 L3.374,66.293 L5.754,66.853 L5.754,64.6 C5.754,62.359 6.139,58.565 7.581,58.565 C8.988,58.565 9.387,62.166 9.407,64.424 C9.407,64.427 9.408,64.43 9.408,64.433 L9.408,64.433 L9.408,67.712 L29.239,72.376 L29.239,69.1 C29.239,64.658 30.513,59.935 32.876,59.935 C35.239,59.935 36.513,64.658 36.513,69.1 C36.513,69.358 36.508,69.619 36.5,69.879 L36.5,69.879 L36.5,74.083 L43.024,75.617 C44.286,75.913 45.582,76.035 46.881,75.973 L46.881,75.973 L48.069,75.917 L75.028,74.47 L89.181,73.377 L89.181,72.781 C89.181,72.757 89.186,72.732 89.189,72.708 C87.373,71.821 80.195,68.377 69.019,63.817 C56.125,58.556 51.461,56.901 47.403,56.798 L47.403,56.798 L33.844,56.452 C33.701,56.45 33.568,56.378 33.485,56.262 C33.402,56.146 33.378,55.998 33.42,55.861 L33.42,55.861 L33.783,54.689 L47.692,54.879 C51.931,54.987 56.67,56.662 69.711,61.983 C70.245,62.201 70.77,62.417 71.282,62.628 L71.282,62.628 L71.392,62.675 C71.476,62.71 71.566,62.729 71.657,62.729 L71.657,62.729 L72.0060508,62.7285444 C74.090875,62.7229414 84.5824375,62.65175 90.574,61.808 L90.574,61.808 L90.574,65.341 C90.211,64.851 89.731,64.553 89.197,64.553 C88.04,64.553 87.137,65.93 87.137,67.689 C87.137,69.448 88.042,70.826 89.199,70.826 C89.733,70.826 90.213,70.529 90.576,70.038 L90.576,70.038 L90.576,72.401 C90.576,72.47 90.556,72.535 90.527,72.595 C90.543,72.655 90.555,72.717 90.555,72.781 L90.555,72.781 L90.555,74.011 C90.555,74.37 90.279,74.668 89.922,74.695 L89.922,74.695 L75.118,75.838 L71.077,76.055 C70.412,77.262 69.699,77.536 69.193,77.536 L69.193,77.536 L65.48,77.536 C64.87,77.536 64.321,77.165 63.839,76.443 L63.839,76.443 L48.139,77.286 L46.947,77.342 C46.706,77.354 46.467,77.36 46.226,77.36 C45.043,77.36 43.863,77.223 42.711,76.952 L42.711,76.952 L39.873,76.285 C39.414,77.332 38.769,78.265 37.645,78.265 L37.645,78.265 L32.877,78.265 C31.391,78.265 30.338,76.396 29.759,73.906 L29.759,73.906 L13.019,69.969 C12.769,70.422 12.42,70.633 11.933,70.633 L11.933,70.633 L7.582,70.633 C6.839,70.633 6.377,69.624 6.104,68.342 L6.104,68.342 L2.93,67.596 C2.843,67.576 2.761,67.539 2.688,67.487 L2.688,67.487 L1.089,66.344 C0.906,66.213 0.799,66 0.80193855,65.774 L0.80193855,65.774 L1.26,38.692 C1.258,38.643 1.231,36.854 1.899,34.663 L1.899,34.663 L3.967,26.799 C3.974,26.771 3.983,26.743 3.994,26.717 C4.193,26.225 5.259,23.737 6.709,23.144 C7.729,22.726 35.014,8.28 45.441,2.749 C45.456,2.741 45.472,2.734 45.488,2.727 Z M58.841,73.707 C59.2198673,73.707 59.527,74.0141327 59.527,74.393 C59.527,74.7718673 59.2198673,75.079 58.841,75.079 C58.4621327,75.079 58.155,74.7718673 58.155,74.393 C58.155,74.0141327 58.4621327,73.707 58.841,73.707 Z M78.675,71.325 L78.725,73.554 C78.725,73.554 75.96,73.84 69.727,74.04 L69.727,71.678 L78.675,71.325 Z M87.024,72.054 C87.3592368,72.054 87.631,72.3611327 87.631,72.74 C87.631,73.1188673 87.3592368,73.426 87.024,73.426 C86.6887632,73.426 86.417,73.1188673 86.417,72.74 C86.417,72.3611327 86.6887632,72.054 87.024,72.054 Z M56.29,66.125 C58.117,66.125 59.603,67.555 59.6020005,69.312 C59.6020005,71.07 58.117,72.499 56.29,72.499 C54.463,72.499 52.977,71.07 52.977,69.312 C52.977,67.555 54.463,66.125 56.29,66.125 Z M89.197,65.01 C90.084,65.01 90.802,66.21 90.801001,67.69 C90.801001,69.171 90.083,70.371 89.197,70.371 C88.311,70.371 87.592,69.17 87.592,67.69 C87.592,66.21 88.31,65.01 89.197,65.01 Z M56.29,68.535 C55.841,68.535 55.476,68.883 55.476,69.312 C55.476,69.742 55.841,70.09 56.29,70.09 C56.739,70.09 57.104,69.742 57.103002,69.312 C57.103002,68.884 56.739,68.535 56.29,68.535 Z M74.565,67.435 C75.0648177,67.435 75.47,67.8961467 75.47,68.465 C75.47,69.0338533 75.0648177,69.495 74.565,69.495 C74.0651823,69.495 73.66,69.0338533 73.66,68.465 C73.66,67.8961467 74.0651823,67.435 74.565,67.435 Z M89.342,66.874 C89.072,66.874 88.853,67.24 88.853,67.691 C88.853,68.142 89.071,68.507 89.342,68.507 C89.612,68.507 89.831,68.142 89.831,67.691 C89.831,67.24 89.612,66.874 89.342,66.874 Z M57.8556539,23.354225 C60.7792133,23.3587898 65.4085161,23.4347419 71.304,23.757 C72.3,23.812 81.928,24.455 84.972,25.045 C85.56,25.16 86.003,25.636 86.073,26.23 L86.073,26.23 L86.895,33.196 C86.906,33.22 86.917,33.288 86.918,33.359 C86.918,33.737 86.61,34.045 86.232,34.045 L86.232,34.045 L86.228,34.045 L86.19,34.043 C86.191,34.045 86.157,34.043 86.124,34.038 C85.8534283,34.0062786 79.4526167,33.2812833 71.642,33.062 C70.8635,33.0395 68.78333,33.02753 65.448146,33.025361 L63.146598,33.0253261 C59.8239384,33.0271668 56.6913332,33.0362554 55.9211212,33.0384987 L55.742,33.039 C55.367,33.039 55.067,32.756 55.044,32.396 L55.044,32.396 L54.571,24.821 C54.547,24.446 54.68,24.074 54.935,23.8 C55.191,23.526 55.551,23.366 55.926,23.362 C56.395,23.357 56.964,23.354 57.569,23.354 Z" id="Combined-Shape"></path>
        </g>
    </g>
</svg>`

interface TitleProps {
  isInGame?: boolean
}

export default function PageTitle(props: TitleProps) {
  const history = useHistory()
  const handleClick = (event: SyntheticEvent<HTMLAnchorElement>) => {
    if (!props.isInGame) {
      history.push('/')
    }
  }
  return (
    <StyledLink to='/' onClick={handleClick}>
      <Text>
        Stop The Bus <Logo dangerouslySetInnerHTML={{ __html: BusIcon }} />
      </Text>
    </StyledLink>
  )
}

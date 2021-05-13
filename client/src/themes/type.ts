interface Typeface {
  name: string
  href: string
}

export interface Theme {
  fonts: { [typeface: string]: Typeface }
  props?: { [prop: string]: any }
  colours: { [colour: string]: string }
}

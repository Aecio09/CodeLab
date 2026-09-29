import type { SandpackTheme } from '@codesandbox/sandpack-react'

/**
 * Tema do Sandpack do Codelab.
 * Paleta e tokens de sintaxe fornecidos pelo design; os overrides de fundo
 * do CodeMirror ficam em `App.css` e usam `surface1` para não divergir daqui.
 */
export const codelabSandpackTheme: SandpackTheme = {
  colors: {
    surface1: '#151515',
    surface2: '#252525',
    surface3: '#2F2F2F',
    clickable: '#999999',
    base: '#808080',
    disabled: '#4D4D4D',
    hover: '#C5C5C5',
    accent: '#f1095a',
    error: '#ff1709',
    errorSurface: '#ffe8e6',
  },
  syntax: {
    plain: '#FFFFFF',
    comment: {
      color: '#757575',
      fontStyle: 'italic',
    },
    keyword: '#f1095a',
    tag: '#c34dff',
    punctuation: '#ffffff',
    definition: '#f99dbd',
    property: '#f1095a',
    static: '#ff1709',
    string: '#a900ff',
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    mono: '"Fira Mono", "DejaVu Sans Mono", Menlo, Consolas, "Liberation Mono", Monaco, "Lucida Console", monospace',
    size: '13px',
    lineHeight: '20px',
  },
}

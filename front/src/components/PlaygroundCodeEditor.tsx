import { useEffect } from 'react'
import { SandpackCodeEditor, useActiveCode } from '@codesandbox/sandpack-react'

export function PlaygroundCodeEditor({
  loading,
  onCodeChange,
}: {
  loading: boolean
  onCodeChange: (value: string) => void
}) {
  const { code } = useActiveCode()

  useEffect(() => {
    onCodeChange(code)
  }, [code, onCodeChange])

  return (
    <SandpackCodeEditor
      showLineNumbers
      showInlineErrors
      wrapContent={false}
      style={{ minHeight: 440 }}
      readOnly={loading}
    />
  )
}

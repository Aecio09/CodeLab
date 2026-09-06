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
          style={{
            height: '100%',
            minHeight: '100%',
            background: '#050a07',
            backgroundColor: '#050a07',
          }}
          className="!bg-[#050a07]"
          readOnly={loading}
      />
  )
}
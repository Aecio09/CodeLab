export function BackgroundDecor() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]"></div>
      <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-secondary-container/10 rounded-full blur-[100px]"></div>
    </div>
  )
}

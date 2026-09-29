export function SharedFooter() {
  return (
    <footer className="w-full border-t border-outline-variant bg-background px-6 py-5 text-xs text-on-surface-variant md:px-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true"></span>
          <span>© 2026 CodeLab. Todos os direitos reservados.</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <span>Política de Privacidade</span>
          <span>Termos de Serviço</span>
          <span>Configurações de Cookies</span>
          <span>Segurança</span>
        </div>
      </div>
    </footer>
  )
}

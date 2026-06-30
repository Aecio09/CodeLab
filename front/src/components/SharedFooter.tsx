export function SharedFooter() {
  return (
    <footer className="bg-surface-container-low w-full py-xl border-t border-outline-variant mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-lg md:px-margin-desktop max-w-max-width mx-auto gap-md">
        <div className="text-lg font-h2 font-bold text-primary tracking-tight">CodeLab</div>
        <div className="flex flex-wrap justify-center gap-md">
          <span className="text-label text-on-surface-variant">Política de Privacidade</span>
          <span className="text-label text-on-surface-variant">Termos de Serviço</span>
          <span className="text-label text-on-surface-variant">Configurações de Cookies</span>
          <span className="text-label text-on-surface-variant">Segurança</span>
        </div>
        <div className="text-label text-on-surface-variant">© 2024 CodeLab. Todos os direitos reservados.</div>
      </div>
    </footer>
  )
}

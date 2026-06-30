export function SharedFooter() {
  return (
    <footer className="bg-surface-container-low w-full py-xl border-t border-outline-variant mt-auto">
      <div className="flex flex-col md:flex-row justify-between items-center px-lg md:px-margin-desktop max-w-max-width mx-auto gap-md">
        <div className="text-lg font-h2 font-bold text-primary tracking-tight">CodeLab</div>
        <div className="flex flex-wrap justify-center gap-md">
          <a className="text-label text-on-surface-variant hover:text-primary underline transition-all" href="#">
            Política de Privacidade
          </a>
          <a className="text-label text-on-surface-variant hover:text-primary underline transition-all" href="#">
            Termos de Serviço
          </a>
          <a className="text-label text-on-surface-variant hover:text-primary underline transition-all" href="#">
            Configurações de Cookies
          </a>
          <a className="text-label text-on-surface-variant hover:text-primary underline transition-all" href="#">
            Segurança
          </a>
        </div>
        <div className="text-label text-on-surface-variant">© 2024 CodeLab. Todos os direitos reservados.</div>
      </div>
    </footer>
  )
}

type Props = {
  /** Área em que o usuário está agora; o botão leva para a outra. */
  area: 'code' | 'network'
}

export function AreaSwitch({ area }: Props) {
  const target =
    area === 'code'
      ? {
          href: '/trilha/redes',
          icon: 'lan',
          label: 'Redes',
          hint: 'Ir para a trilha de redes',
        }
      : {
          href: '/trilha',
          icon: 'terminal',
          label: 'Programação',
          hint: 'Ir para a trilha de programação',
        }

  return (
    <a
      href={target.href}
      title={target.hint}
      aria-label={target.hint}
      className="mt-2 flex w-full items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-left text-sm font-semibold text-primary transition-all hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <span className="material-symbols-outlined">{target.icon}</span>
      {target.label}
      <span className="material-symbols-outlined ml-auto text-[16px] opacity-70">swap_horiz</span>
    </a>
  )
}

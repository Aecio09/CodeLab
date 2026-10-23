/**
 * Fundo estático da autenticação: preto com grade sutil.
 * Fica atrás do conteúdo e não interfere na interação (pointer-events-none).
 */
export function AuthBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[#070709]" />

      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.13) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 65% at 50% 35%, black 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 65% at 50% 35%, black 20%, transparent 75%)',
        }}
      />
    </div>
  )
}

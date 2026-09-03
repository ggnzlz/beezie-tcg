const SURFACES = ['surface-0', 'surface-1', 'surface-2', 'surface-3'] as const;
const TEXT = ['foreground', 'foreground-muted', 'foreground-subtle'] as const;
const ACCENTS = ['accent', 'accent-hover', 'value', 'danger'] as const;
const RARITIES = ['ultra-rare', 'rare', 'uncommon', 'common', 'base'] as const;
const RADII = ['sm', 'md', 'lg', 'xl', '2xl'] as const;
const ELEVATIONS = ['card', 'raised', 'overlay'] as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold tracking-[0.12em] text-foreground-muted uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function TokensPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 p-8">
      <h1 className="text-2xl font-semibold">Design tokens</h1>

      <Section title="Surfaces">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {SURFACES.map((name) => (
            <div
              key={name}
              className="rounded-lg border border-border p-6 text-sm"
              style={{ background: `var(--${name})` }}
            >
              {name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Text">
        <div className="space-y-1 rounded-lg bg-surface-1 p-4">
          {TEXT.map((name) => (
            <p key={name} style={{ color: `var(--${name})` }}>
              {name} — The quick brown fox jumps over the lazy dog
            </p>
          ))}
        </div>
      </Section>

      <Section title="Accents">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ACCENTS.map((name) => (
            <div
              key={name}
              className="rounded-lg p-6 text-sm font-semibold"
              style={{
                background: `var(--${name})`,
                color: name === 'danger' ? 'var(--danger-foreground)' : 'var(--accent-foreground)',
              }}
            >
              {name}
            </div>
          ))}
        </div>
        <p className="text-xs text-foreground-muted">
          Accent on surface-0 measures 9.7:1 — comfortably past the 4.5:1 floor.
        </p>
      </Section>

      <Section title="Rarity pairs">
        <div className="flex flex-wrap gap-2">
          {RARITIES.map((name) => (
            <span
              key={name}
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                background: `var(--rarity-${name}-bg)`,
                color: `var(--rarity-${name})`,
              }}
            >
              {name}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Radii">
        <div className="flex flex-wrap gap-3">
          {RADII.map((name) => (
            <div
              key={name}
              className="grid size-24 place-items-center bg-surface-2 text-xs"
              style={{ borderRadius: `var(--radius-${name})` }}
            >
              {name}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Elevations">
        <div className="flex flex-wrap gap-6 p-4">
          {ELEVATIONS.map((name) => (
            <div
              key={name}
              className="grid size-28 place-items-center rounded-lg bg-surface-1 text-xs"
              style={{ boxShadow: `var(--elevation-${name})` }}
            >
              {name}
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

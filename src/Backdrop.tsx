export type BgKind = 'none' | 'galaxy' | 'aurora' | 'forest' | 'pixel' | 'ocean'

export const BACKDROPS: { id: BgKind; label: string; icon: string }[] = [
  { id: 'none', label: 'Plain', icon: '·' },
  { id: 'galaxy', label: 'Galaxy', icon: '✦' },
  { id: 'aurora', label: 'Aurora', icon: '≋' },
  { id: 'forest', label: 'Forest', icon: '❦' },
  { id: 'pixel', label: 'Pixel', icon: '▚' },
  { id: 'ocean', label: 'Ocean', icon: '◠' },
]

/** Fixed animated scene rendered behind the app. Pure CSS — cheap on battery.
 *  A theme-aware scrim (see styles.css) keeps content readable on top. */
export default function Backdrop({ kind }: { kind: BgKind }) {
  if (kind === 'none') return null
  return (
    <div className={`backdrop bg-${kind}`} aria-hidden>
      {kind === 'galaxy' && (
        <>
          <div className="stars s1" />
          <div className="stars s2" />
          <div className="stars s3" />
          <div className="nebula" />
        </>
      )}
      {kind === 'aurora' && (
        <>
          <div className="ribbon r1" />
          <div className="ribbon r2" />
          <div className="ribbon r3" />
        </>
      )}
      {kind === 'forest' && (
        <>
          <div className="hills h1" />
          <div className="hills h2" />
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="leaf" style={{ ['--i' as string]: i }}>❧</span>
          ))}
        </>
      )}
      {kind === 'pixel' && (
        <>
          <div className="px-sun" />
          <div className="px-cloud c1" />
          <div className="px-cloud c2" />
          <div className="px-ground" />
        </>
      )}
      {kind === 'ocean' && (
        <>
          <div className="wave w1" />
          <div className="wave w2" />
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="bubble" style={{ ['--i' as string]: i }} />
          ))}
        </>
      )}
    </div>
  )
}

export default function ThankYou() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="font-serif font-light text-5xl md:text-6xl tracking-tight">Thank you</h1>
      <p className="font-serif italic text-lg md:text-xl text-slate mt-4">your application is in</p>

      <div className="w-16 h-px bg-slate opacity-40 my-12" />

      <p className="text-slate leading-relaxed max-w-md">
        Our team reads every application by hand. We&apos;ll be in touch.
      </p>

      <a
        href="/"
        className="mt-12 text-xs tracking-widest uppercase text-slate hover:text-ink transition-colors"
      >
        ← Back to Manhattanite
      </a>
    </main>
  );
}

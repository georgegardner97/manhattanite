import Link from "next/link";

export default function ThankYou() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="mh-fade-in font-serif font-extralight text-6xl md:text-7xl tracking-tighter leading-none">
        Thank you
      </h1>
      <p className="mh-fade-in font-serif italic text-lg md:text-xl text-slate mt-6">
        your application is in
      </p>

      <div className="mh-fade-in-delay w-12 h-px bg-ink/30 my-14" />

      <p className="mh-fade-in-delay text-slate leading-[1.7] max-w-md">
        I read every application by hand. You&rsquo;ll hear from me.
      </p>

      <Link
        href="/"
        className="mh-fade-in-delay mh-link mt-16 text-[11px] tracking-[0.28em] uppercase text-ink"
      >
        Back to Manhattanite
      </Link>
    </main>
  );
}

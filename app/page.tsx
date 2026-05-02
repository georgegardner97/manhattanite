import { redirect } from "next/navigation";
import { Resend } from "resend";
import ApplyLink from "./components/ApplyLink";

export default function Home() {
  async function submitApplication(formData: FormData) {
    "use server";

    const data = Object.fromEntries(formData) as Record<string, string>;

    // Always log to server console as a backup, in case email delivery fails.
    console.log("New application:", data);

    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Manhattanite <applications@manhattanite.com>",
        to: "info@manhattanite.com",
        subject: `New Manhattanite Application: ${data.name}`,
        html: `
          <h2>New Manhattanite Application</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Neighborhood:</strong> ${data.neighborhood}</p>
          <p><strong>Referred By:</strong> ${data.referee || "—"}</p>
        `,
      });

      if (emailError) {
        console.error("Resend rejected the email:", emailError);
      } else {
        console.log("Email sent successfully:", emailData);
      }
    } catch (error) {
      // Catches network failures and other unexpected issues.
      console.error("Unexpected error sending email:", error);
    }

    redirect("/thank-you");
  }

  return (
    <>
    <main>
      {/* ============ HERO ============ */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6">
        <h1 className="font-serif font-light text-7xl md:text-8xl tracking-tight">Manhattan<span className="italic">ite</span></h1>
        <p className="font-serif italic text-lg md:text-xl text-slate mt-4">Better Listings</p>
        <ApplyLink className="mt-12 inline-block bg-park text-bone px-8 py-4 rounded text-sm tracking-widest uppercase hover:opacity-90 transition-opacity cursor-pointer">Apply for Membership</ApplyLink>
      </section>

      {/* ============ APPLICATION FORM ============ */}
      <section id="apply" className="min-h-screen px-6 flex items-center border-t border-ink/10">
        <div className="max-w-xl mx-auto w-full py-12">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.25em] uppercase text-slate mb-4">Membership</p>
            <h2 className="font-serif text-3xl md:text-4xl mb-6">Apply to join</h2>
            <p className="text-slate leading-relaxed max-w-md mx-auto">
              Tell us a little about yourself. We read every application personally.
            </p>
          </div>

          <form action={submitApplication} className="space-y-10">
            <div>
              <label htmlFor="name" className="block text-xs tracking-widest uppercase text-slate mb-3">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full bg-transparent border-b border-ink/20 pb-3 text-base focus:border-ink focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs tracking-widest uppercase text-slate mb-3">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full bg-transparent border-b border-ink/20 pb-3 text-base focus:border-ink focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="neighborhood" className="block text-xs tracking-widest uppercase text-slate mb-3">
                Manhattan Neighborhood
              </label>
              <input
                type="text"
                id="neighborhood"
                name="neighborhood"
                required
                placeholder="e.g. West Village, Upper East Side"
                className="w-full bg-transparent border-b border-ink/20 pb-3 text-base placeholder:text-slate/40 focus:border-ink focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="referee" className="block text-xs tracking-widest uppercase text-slate mb-3">
                Referred By <span className="normal-case tracking-normal text-slate/60">(optional)</span>
              </label>
              <input
                type="text"
                id="referee"
                name="referee"
                placeholder="If a member sent you, who?"
                className="w-full bg-transparent border-b border-ink/20 pb-3 text-base placeholder:text-slate/40 focus:border-ink focus:outline-none transition-colors"
              />
            </div>

            <div className="pt-4 text-center">
              <button
                type="submit"
                className="inline-block bg-park text-bone px-10 py-4 rounded text-sm tracking-widest uppercase hover:opacity-90 transition-opacity"
              >
                Submit Application
              </button>
              <p className="mt-6 text-xs text-slate">We&apos;ll be in touch.</p>
            </div>
          </form>
        </div>
      </section>
    </main>

    {/* ============ FOOTER ============ */}
    <footer className="border-t border-ink/10 px-6 py-10 text-center">
      <div className="max-w-5xl mx-auto">
        <p className="font-serif font-light text-2xl">Manhattan<span className="italic">ite</span></p>
        <p className="mt-2 text-xs tracking-[0.25em] uppercase text-slate">For New Yorkers</p>

        <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-xs text-slate">
          <a href="mailto:info@manhattanite.com" className="hover:text-ink transition-colors">Contact</a>
          <span className="hidden md:inline opacity-40">·</span>
          <span>New York City</span>
          <span className="hidden md:inline opacity-40">·</span>
          <span>© 2026 Manhattanite</span>
          <span className="hidden md:inline opacity-40">·</span>
          <a href="/privacy" className="hover:text-ink transition-colors">Privacy</a>
          <span className="hidden md:inline opacity-40">·</span>
          <a href="/terms" className="hover:text-ink transition-colors">Terms</a>
        </div>
      </div>
    </footer>
    </>
  );
}
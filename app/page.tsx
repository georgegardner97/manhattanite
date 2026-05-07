import { redirect } from "next/navigation";
import { Resend } from "resend";
import ApplyLink from "./components/ApplyLink";
import ApplicationForm from "./components/ApplicationForm";

// Airtable identifiers for the Manhattanite Applications base/table.
// These are not secrets (the API key is the secret); keeping them as constants
// here makes the integration easier to read.
const AIRTABLE_BASE_ID = "applBwtxAzzYfFELQ";
const AIRTABLE_TABLE_ID = "tblL1TAgU4LaNBZ7H";

export default function Home() {
  async function submitApplication(formData: FormData) {
    "use server";

    // Pluck fields explicitly. Next.js injects internal $ACTION_* keys into
    // formData, so we avoid Object.fromEntries when we plan to forward this
    // payload to a third-party API like Airtable.
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const neighborhood = String(formData.get("neighborhood") ?? "").trim();
    const otherNeighborhood = String(
      formData.get("otherNeighborhood") ?? ""
    ).trim();
    const social = String(formData.get("social") ?? "").trim();
    const about = String(formData.get("about") ?? "").trim();
    const referee = String(formData.get("referee") ?? "").trim();

    // Multi-select checkboxes share the same `name` attribute, so we use
    // getAll() to collect them as an array. Each value is the human-readable
    // label that matches an Airtable multi-select option.
    const useCases = formData
      .getAll("useCases")
      .map((v) => String(v).trim())
      .filter(Boolean);

    // Always log to the server console as a backup, in case both delivery
    // channels (email + Airtable) fail.
    console.log("New application:", {
      name,
      email,
      neighborhood,
      otherNeighborhood,
      social,
      useCases,
      about,
      referee,
    });

    // ============ 1. Send notification email via Resend ============
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      // Build a small helper string for the Neighborhood line. If the
      // applicant chose "Other", we want to show what they typed in too.
      const neighborhoodLine =
        neighborhood === "Other" && otherNeighborhood
          ? `${neighborhood} — ${otherNeighborhood}`
          : neighborhood;

      const { data: emailData, error: emailError } = await resend.emails.send({
        from: "Manhattanite <applications@manhattanite.com>",
        to: "info@manhattanite.com",
        subject: `New Manhattanite Application: ${name}`,
        html: `
          <h2>New Manhattanite Application</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Neighborhood:</strong> ${neighborhoodLine}</p>
          <p><strong>Instagram or LinkedIn:</strong> ${social}</p>
          <p><strong>Use Cases:</strong> ${
            useCases.length ? useCases.join(", ") : "—"
          }</p>
          <p><strong>About:</strong><br />${
            about ? about.replace(/\n/g, "<br />") : "—"
          }</p>
          <p><strong>Referred By:</strong> ${referee || "—"}</p>
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

    // ============ 2. Save the application to Airtable ============
    // Independent try/catch so that an Airtable failure doesn't break the
    // email path (and vice versa). Either channel surviving means we don't
    // lose the application.
    try {
      const fields: Record<string, unknown> = {
        Name: name,
        Email: email,
        Neighborhood: neighborhood,
        "Instagram or LinkedIn": social,
        Status: "New",
      };

      // Only set "Other Neighborhood" if the applicant chose "Other" from
      // the dropdown — keeps the column tidy for everyone else.
      if (neighborhood === "Other" && otherNeighborhood) {
        fields["Other Neighborhood"] = otherNeighborhood;
      }

      // Use Cases is a multi-select Airtable field, which expects an array
      // of strings matching the configured option labels.
      if (useCases.length) {
        fields["Use Cases"] = useCases;
      }

      if (about) {
        fields["About"] = about;
      }

      // Only set Referred By if the applicant provided one. With
      // typecast: true (below), Airtable will match this string against
      // existing applicants by name; if no match exists, it creates a stub
      // record so the link is preserved.
      if (referee) {
        fields["Referred By"] = [referee];
      }

      const airtableResponse = await fetch(
        `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ fields, typecast: true }),
        }
      );

      if (!airtableResponse.ok) {
        const errText = await airtableResponse.text();
        console.error(
          "Airtable rejected the record:",
          airtableResponse.status,
          errText
        );
      } else {
        const airtableData = await airtableResponse.json();
        console.log("Airtable record created:", airtableData.id);
      }
    } catch (error) {
      console.error("Unexpected error saving to Airtable:", error);
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

      {/* ============ FOUNDER'S NOTE ============ */}
      <section className="px-6 py-24 md:py-32 border-t border-ink/10">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.25em] uppercase text-slate mb-6 text-center">
            A note from the founder
          </p>
          <p className="font-serif text-xl md:text-2xl leading-relaxed text-ink">
            I&apos;m tired of the same thing everyone in New York is tired of:
            Marketplace scams, junk furniture, sublets that aren&apos;t real,
            photographers who never write back. So I made a smaller, better
            version — for the people who actually live in Manhattan. I read
            every application by hand. If you&apos;d bring something to it,
            I&apos;d like to hear from you.
          </p>
          <p className="mt-8 font-serif italic text-slate">— George</p>
        </div>
      </section>

      {/* ============ APPLICATION FORM ============ */}
      <section id="apply" className="px-6 py-24 md:py-32 border-t border-ink/10">
        <div className="max-w-xl mx-auto w-full">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.25em] uppercase text-slate mb-4">Membership</p>
            <h2 className="font-serif text-3xl md:text-4xl">Apply to join</h2>
          </div>

          <ApplicationForm submitAction={submitApplication} />
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
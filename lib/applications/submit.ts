// Dormant — preserved for the /apply slice.
//
// The membership application pipeline (Resend notification email + Airtable
// record), lifted out of app/page.tsx when the waitlist landing was replaced
// by the two-tier gating page in Slice 3.5. Not wired to any route yet — the
// /apply slice will revive and refactor this alongside
// app/components/ApplicationForm.tsx. The Airtable + Resend env vars stay in
// place for that revival.

"use server";

import { redirect } from "next/navigation";
import { Resend } from "resend";

// Airtable identifiers for the Manhattanite Applications base/table.
// These are not secrets (the API key is the secret); keeping them as constants
// here makes the integration easier to read.
const AIRTABLE_BASE_ID = "applBwtxAzzYfFELQ";
const AIRTABLE_TABLE_ID = "tblL1TAgU4LaNBZ7H";

export async function submitApplication(formData: FormData) {
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

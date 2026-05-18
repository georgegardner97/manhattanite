# Invoice template

Use this template when you need to create an invoice. Tell Claude the details and ask it to generate the invoice as a Word document (.docx) and/or PDF in your brand style. Claude will use the docx and pdf skills to create professional, formatted output.

---

## Invoice details

### Your business details

[These should be in your About Me files. If not, provide them here.]

- Business name: [Your business name]
- Address: [Your business address]
- Email: [Your business email]
- Phone: [Optional]
- VAT/Tax number: [If applicable]
- Payment details: [Bank name, sort code, account number / PayPal / payment link]

### Client details

- Client name: [Name or company]
- Client address: [Their address]
- Contact email: [Where to send the invoice]

### Invoice specifics

- Invoice number: [Your numbering system, e.g. INV-2026-001]
- Invoice date: [Date issued]
- Due date: [When payment is due]
- Currency: [GBP / USD / EUR]

### Line items

| Description | Quantity | Unit price | Total |
|-------------|----------|------------|-------|
| [Service or product] | [Number] | [Price] | [Amount] |
| [Service or product] | [Number] | [Price] | [Amount] |

### Totals

- Subtotal: [Sum of line items]
- VAT/Tax: [If applicable — rate and amount]
- **Total due: [Final amount]**

### Payment terms

[How you want to be paid. Bank transfer, PayPal, Stripe link. Include any late payment terms if you use them.]

### Notes (optional)

[Thank you message, project reference, purchase order number, or any other relevant notes.]

---

## How to use this

**Quick invoice:** Tell Claude: "Create an invoice for [client] for [service], [amount]. Invoice number [X], due in 30 days. Output as a Word doc and PDF."

**Branded invoice:** Tell Claude: "Create a professional invoice using my brand colours and logo. Here are the details: [paste the filled template above]." Claude will use the docx skill to create a formatted document and can convert to PDF.

**Recurring invoices:** If you invoice the same client regularly, tell Claude: "Same as last month's invoice for [client], but update the date and invoice number." If previous invoices are saved in a project's outputs/ folder, Claude can reference them.

---

## Notes

- Always double-check the numbers before sending. Claude does the formatting; you verify the maths.
- Save invoices to the relevant project's `outputs/` folder with a clear name: `[Client]_Invoice_[number].docx`
- If you have a logo or brand assets, mention where they are so Claude can include them.
- For your first invoice, you may need to provide all your business details. After that, they'll be in your About Me files or previous invoices for Claude to reference.
- Claude can create both .docx (editable) and .pdf (final) versions in one go.

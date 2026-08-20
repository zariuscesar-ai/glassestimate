// Standard glass & glazing installation agreement used on branded proposals.
// The dealer can override the wording in Settings (company.contract_terms);
// otherwise this default is used. Tokens in {{...}} are filled at render time.
//
// NOTE: This is a general-purpose template, not legal advice. Dealers should
// have it reviewed by an attorney for their state before relying on it.

export const DEFAULT_CONTRACT_TERMS = `GLASS & GLAZING INSTALLATION AGREEMENT

This Agreement is between {{company}} ("Contractor") and {{client}} ("Customer") for the work described in the proposal above (the "Work").

1. SCOPE OF WORK. Contractor will furnish and install the glass, framing, hardware, and related materials itemized in this proposal. Work not expressly listed is excluded.

2. PRICE & PAYMENT. The total price is {{total}}. A deposit of {{deposit_pct}}% ({{deposit_amount}}) is due upon acceptance of this proposal, and the remaining balance ({{balance_amount}}) is due upon completion of the Work, unless otherwise stated above. Accepted payment methods and any financing terms are as agreed in writing.

3. FIELD MEASUREMENTS. Final glass sizes are confirmed by field measurement after acceptance. Sizes shown are nominal and subject to shop deductions; tempered glass cannot be altered once fabricated.

4. SCHEDULE. Contractor will schedule fabrication and installation after the deposit is received and final measurements are confirmed. Lead times are estimates and may be affected by supplier availability and site conditions.

5. CUSTOMER RESPONSIBILITIES. Customer will provide safe, clear, and timely access to the work area and ensure the site is ready for installation. Delays caused by site conditions are not the responsibility of Contractor.

6. CHANGES. Any change to scope, materials, or sizes after acceptance must be agreed in writing and may adjust the price and schedule.

7. WARRANTY. Contractor warrants its workmanship for {{warranty_months}} months from the date of installation. Manufacturer warranties on glass and hardware pass through to Customer. This warranty excludes damage from misuse, accident, alteration, or normal wear.

8. EXCLUSIONS. Unless expressly included: permits, structural modifications, electrical, painting, patching, disposal of non-Contractor materials, and repair of pre-existing conditions are excluded.

9. VALIDITY. This proposal is valid for {{valid_days}} days from the issue date.

10. ACCEPTANCE. By signing below, Customer approves the scope and price above, agrees to these terms, and authorizes Contractor to proceed and to collect the deposit.`;

export interface ContractTokens {
  company: string;
  client: string;
  total: string;
  depositPct: number;
  depositAmount: string;
  balanceAmount: string;
  warrantyMonths: number;
  validDays: number;
}

/** Fill {{token}} placeholders in a contract terms string. */
export function fillContract(terms: string, t: ContractTokens): string {
  const balancePct = Math.max(0, 100 - (t.depositPct || 0));
  return (terms || DEFAULT_CONTRACT_TERMS)
    .replace(/\{\{company\}\}/g, t.company || 'the Contractor')
    .replace(/\{\{client\}\}/g, t.client || 'the Customer')
    .replace(/\{\{total\}\}/g, t.total)
    .replace(/\{\{deposit_pct\}\}/g, String(t.depositPct))
    .replace(/\{\{balance_pct\}\}/g, String(balancePct))
    .replace(/\{\{deposit_amount\}\}/g, t.depositAmount)
    .replace(/\{\{balance_amount\}\}/g, t.balanceAmount)
    .replace(/\{\{warranty_months\}\}/g, String(t.warrantyMonths))
    .replace(/\{\{valid_days\}\}/g, String(t.validDays));
}

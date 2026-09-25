import { matchPolicies, summarize } from "../src/lib/matcher";
import { demoCompanies } from "../src/lib/demoCompanies";

for (const c of demoCompanies) {
  const r = matchPolicies(c);
  const s = summarize(r);
  console.log("=== ", c.demoId, JSON.stringify(s));
  for (const m of r) {
    console.log("  ", m.policyId, m.status, m.amount ?? "-");
  }
}

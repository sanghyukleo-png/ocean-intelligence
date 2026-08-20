import { Columns3 } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function ComparePage() {
  return (
    <ComingSoon
      icon={Columns3}
      eyebrow="SIDE-BY-SIDE ANALYSIS"
      title="Compare"
      description="Compare 2–4 vessels side-by-side across DWT, age, speed, fuel consumption, and cargo capacity, with an AI commercial insight generated from structured data only."
      pipeline={["Select vessels", "Compute differentials", "Generate commercial insight"]}
    />
  );
}

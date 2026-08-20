import { FileScan } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

export default function VesselsPage() {
  return (
    <ComingSoon
      icon={FileScan}
      eyebrow="VESSEL DOCUMENT INTELLIGENCE"
      title="Vessels"
      description="Upload a vessel specification PDF or Q88 questionnaire and extract structured particulars via LLM — with strict no-hallucination rules and page-level source traceability."
      pipeline={[
        "PDF upload",
        "Text extraction",
        "LLM structured extraction",
        "Schema validation",
        "Source mapping",
        "Vessel intelligence",
      ]}
    />
  );
}

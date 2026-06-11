import { Suspense } from "react";
import DenemePageContent from "@/components/deneme/DenemePageContent";

export default function DenemePage() {
  return (
    <Suspense fallback={<div>Yükleniyor...</div>}>
      <DenemePageContent />
    </Suspense>
  );
}

import { StrategyDownload } from "@/components/strategy/StrategyDownload";
import { BrokerReview } from "@/components/strategy/BrokerReview";

export function StrategyPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 h-full overflow-auto">
      <div><h1 className="text-2xl font-bold text-ds-text-primary">Mortgage Strategy</h1><p className="text-sm text-ds-text-secondary mt-1">View and download your personalised mortgage strategy</p></div>
      <StrategyDownload />
      <BrokerReview />
    </div>
  );
}

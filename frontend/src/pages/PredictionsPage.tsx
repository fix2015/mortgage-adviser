import { LenderPredictor } from "@/components/dashboard/LenderPredictor";

export function PredictionsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 h-full overflow-auto">
      <div>
        <h1 className="text-2xl font-bold text-ds-text-primary">Lender Predictions</h1>
        <p className="text-sm text-ds-text-secondary mt-1">
          See how likely each UK mortgage lender is to approve your application
        </p>
      </div>
      <LenderPredictor />
    </div>
  );
}

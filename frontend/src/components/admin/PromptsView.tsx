import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPrompts, updatePrompts } from "@/api/admin";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { Save } from "lucide-react";

export function PromptsView() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: prompts, isLoading } = useQuery({
    queryKey: ["admin-prompts"],
    queryFn: getPrompts,
  });

  const [systemPrompt, setSystemPrompt] = useState("");
  const [analysisPrompt, setAnalysisPrompt] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (prompts && !initialized) {
    setSystemPrompt(prompts.system_prompt);
    setAnalysisPrompt(prompts.analysis_prompt);
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: () => updatePrompts({ system_prompt: systemPrompt, analysis_prompt: analysisPrompt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-prompts"] });
      toast("success", "Prompts updated successfully");
    },
    onError: () => {
      toast("error", "Failed to update prompts");
    },
  });

  if (isLoading) return <Spinner className="py-12" />;

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-lg font-semibold text-ds-text-primary mb-4">System Prompt</h3>
        <textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={10}
          className="w-full rounded-xl border border-ds-border-default bg-ds-bg-secondary px-4 py-3 text-sm text-ds-text-primary placeholder:text-ds-text-muted focus:border-ds-border-accent focus:outline-none focus:ring-1 focus:ring-ds-accent-primary/50 resize-y"
          placeholder="Enter the system prompt..."
        />
      </Card>

      <Card>
        <h3 className="text-lg font-semibold text-ds-text-primary mb-4">Analysis Prompt</h3>
        <textarea
          value={analysisPrompt}
          onChange={(e) => setAnalysisPrompt(e.target.value)}
          rows={10}
          className="w-full rounded-xl border border-ds-border-default bg-ds-bg-secondary px-4 py-3 text-sm text-ds-text-primary placeholder:text-ds-text-muted focus:border-ds-border-accent focus:outline-none focus:ring-1 focus:ring-ds-accent-primary/50 resize-y"
          placeholder="Enter the analysis prompt..."
        />
      </Card>

      <div className="flex justify-end">
        <Button
          variant="glow"
          leftIcon={<Save className="h-4 w-4" />}
          onClick={() => mutation.mutate()}
          isLoading={mutation.isPending}
        >
          Save Prompts
        </Button>
      </div>
    </div>
  );
}

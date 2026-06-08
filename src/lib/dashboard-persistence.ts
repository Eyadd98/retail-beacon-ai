import { supabase } from "@/integrations/supabase/client";
import type { RawRow, Schema } from "@/lib/dashboard-store";
import type { ChartConfig, ChartType } from "@/components/custom-chart-card";

export async function getOrCreateWorkspace(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: existing } = await supabase
    .from("workspaces")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created, error } = await supabase
    .from("workspaces")
    .insert({ user_id: user.id, name: "My Workspace" })
    .select("id")
    .single();
  if (error) {
    console.error("[workspace] create failed", error);
    return null;
  }
  return created.id;
}

export type LoadedState = {
  workspaceId: string;
  rows: RawRow[] | null;
  schema: Schema | null;
  charts: ChartConfig[];
};

export async function loadInitialState(): Promise<LoadedState | null> {
  const workspaceId = await getOrCreateWorkspace();
  if (!workspaceId) return null;
  const [{ data: ds }, { data: cs }] = await Promise.all([
    supabase
      .from("datasets")
      .select("raw_data, schema")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("charts")
      .select("id, chart_type, x_axis, y_axis, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true }),
  ]);
  return {
    workspaceId,
    rows: (ds?.raw_data as RawRow[] | null) ?? null,
    schema: (ds?.schema as Schema | null) ?? null,
    charts: (cs ?? []).map((c) => ({
      id: c.id,
      type: c.chart_type as ChartType,
      x: c.x_axis,
      y: c.y_axis,
    })),
  };
}

export async function saveDataset(
  workspaceId: string,
  fileName: string,
  rows: RawRow[],
  schema: Schema,
): Promise<void> {
  const { error } = await supabase.from("datasets").insert({
    workspace_id: workspaceId,
    file_name: fileName,
    raw_data: rows as unknown as object,
    schema: schema as unknown as object,
  });
  if (error) console.error("[dataset] save failed", error);
}

export async function insertChart(workspaceId: string, c: ChartConfig): Promise<ChartConfig | null> {
  const { data, error } = await supabase
    .from("charts")
    .insert({ workspace_id: workspaceId, chart_type: c.type, x_axis: c.x, y_axis: c.y })
    .select("id, chart_type, x_axis, y_axis")
    .single();
  if (error || !data) {
    console.error("[chart] insert failed", error);
    return null;
  }
  return { id: data.id, type: data.chart_type as ChartType, x: data.x_axis, y: data.y_axis };
}

export async function updateChart(c: ChartConfig): Promise<void> {
  const { error } = await supabase
    .from("charts")
    .update({ chart_type: c.type, x_axis: c.x, y_axis: c.y })
    .eq("id", c.id);
  if (error) console.error("[chart] update failed", error);
}

export async function deleteChart(id: string): Promise<void> {
  const { error } = await supabase.from("charts").delete().eq("id", id);
  if (error) console.error("[chart] delete failed", error);
}

export async function deleteAllCharts(workspaceId: string): Promise<void> {
  const { error } = await supabase.from("charts").delete().eq("workspace_id", workspaceId);
  if (error) console.error("[charts] delete-all failed", error);
}

export async function clearWorkspaceData(workspaceId: string): Promise<void> {
  await Promise.all([
    supabase.from("datasets").delete().eq("workspace_id", workspaceId),
    supabase.from("charts").delete().eq("workspace_id", workspaceId),
  ]);
}
type AnalyticsLearningOutput = {
  summary: string;
  wins: string[];
  opportunities: string[];
  nextExperiments: string[];
};

type MetricSnapshot = {
  platform?: string;
  impressions?: number;
  reach?: number;
  engagement?: number;
  clicks?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
};

type MetricTotals = Required<Omit<MetricSnapshot, "platform">>;

export function learnFromAnalytics(input: unknown): { output: AnalyticsLearningOutput } {
  const snapshots = normalizeSnapshots(input);
  const totals = snapshots.reduce<MetricTotals>(
    (acc, item) => ({
      impressions: acc.impressions + number(item.impressions),
      reach: acc.reach + number(item.reach),
      engagement: acc.engagement + number(item.engagement),
      clicks: acc.clicks + number(item.clicks),
      likes: acc.likes + number(item.likes),
      comments: acc.comments + number(item.comments),
      shares: acc.shares + number(item.shares),
      saves: acc.saves + number(item.saves),
    }),
    { impressions: 0, reach: 0, engagement: 0, clicks: 0, likes: 0, comments: 0, shares: 0, saves: 0 },
  );
  const engagementRate = totals.impressions ? totals.engagement / totals.impressions : 0;
  const clickRate = totals.impressions ? totals.clicks / totals.impressions : 0;
  const topPlatform = findTopPlatform(snapshots);

  return {
    output: {
      summary: `Across ${snapshots.length} analytics snapshots, the campaign generated ${totals.impressions} impressions, ${totals.engagement} engagements, and ${totals.clicks} clicks.`,
      wins: [
        topPlatform ? `${topPlatform} is currently the strongest platform by engagement.` : "The campaign has started collecting measurable performance data.",
        engagementRate >= 0.03 ? `Engagement rate is healthy at ${percent(engagementRate)}.` : `The campaign has ${totals.engagement} total engagements to build on.`,
      ],
      opportunities: [
        clickRate < 0.01 ? "Test clearer calls to action to improve click-through rate." : `Click-through rate is showing traction at ${percent(clickRate)}.`,
        totals.shares + totals.saves < totals.likes ? "Create more saveable or shareable formats, such as checklists, carousels, and short how-to posts." : "Lean into content formats that are already earning saves and shares.",
      ],
      nextExperiments: [
        "Run two caption hooks against the same creative and compare engagement rate.",
        "Promote the best organic post with a small budget before scaling spend.",
        "Test one educational carousel and one direct offer post on the highest-engagement platform.",
      ],
    },
  };
}

function normalizeSnapshots(input: unknown): MetricSnapshot[] {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is MetricSnapshot => Boolean(item) && typeof item === "object");
}

function findTopPlatform(snapshots: MetricSnapshot[]) {
  const byPlatform = new Map<string, number>();
  for (const snapshot of snapshots) {
    if (!snapshot.platform) continue;
    byPlatform.set(snapshot.platform, (byPlatform.get(snapshot.platform) || 0) + number(snapshot.engagement));
  }
  return [...byPlatform.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

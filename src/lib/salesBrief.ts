import { MarketSignal, SalesBrief, ScoredOpportunity } from "@/types";

// Deterministic "AI Sales Planning Brief" generator. In a production build
// this would call AIProvider.generateSalesBrief(); the template below is the
// explicit demo/fallback path so the product works end-to-end without an
// external API key, per the project's demo-mode requirement.

export function generateSalesBrief(o: ScoredOpportunity, signals: MarketSignal[]): SalesBrief {
  const topSignals = signals
    .filter((s) => s.importance !== "low")
    .slice(0, 3);

  const executiveSummary = `${o.customer} (${o.country}) presents a ${o.tier} commercial opportunity (${o.score}/100) in the ${o.segment} segment, driven by a ${o.averageFleetAge.toFixed(1)}-year average fleet age and an orderbook of ${o.orderbook} vessel${o.orderbook === 1 ? "" : "s"} against a ${o.fleetSize}-vessel fleet.`;

  const keyFindings = [
    `Fleet: ${o.fleetSize} vessels, average age ${o.averageFleetAge.toFixed(1)} years.`,
    `Orderbook coverage: ${o.orderbook} vessel${o.orderbook === 1 ? "" : "s"} (${o.factors.orderbookGap}/100 gap score).`,
    `Fleet growth trend: ${o.fleetGrowthPct >= 0 ? "+" : ""}${o.fleetGrowthPct.toFixed(1)}% YoY.`,
    `Alternative-fuel transition: ${o.fuelTransitionPct}% of fleet.`,
  ];

  const commercialAssessment =
    o.tier === "VERY HIGH" || o.tier === "HIGH"
      ? `The combination of aging tonnage and constrained newbuilding coverage indicates a near-term fleet-renewal decision window. Lifecycle economics and regulatory-readiness positioning are likely to resonate more than price alone.`
      : `Fleet fundamentals do not yet indicate an imminent newbuilding trigger. This account is better suited to relationship nurture and periodic signal monitoring than an immediate commercial push.`;

  const customerOpportunity = `${o.customer} demonstrates ${o.tier.toLowerCase()} fleet-renewal potential. Key signals: ${o.signals.join(", ")}.`;

  const talkingPoints =
    o.tier === "VERY HIGH" || o.tier === "HIGH"
      ? [
          "Lifecycle economics of newbuilding vs. continued operation of aging tonnage",
          "Fuel efficiency and bunker-cost sensitivity under current freight conditions",
          "Regulatory readiness ahead of tightening emissions requirements",
          "Delivery slot availability amid tightening yard orderbooks",
        ]
      : [
          "Long-term fleet strategy and renewal timeline",
          "Market monitoring: freight, orderbook, and fuel-transition trends",
        ];

  const relevantSignalNote = topSignals.length
    ? ` Broader market context: ${topSignals.map((s) => s.title).join("; ")}.`
    : "";

  return {
    customer: o.customer,
    generatedAt: new Date().toISOString(),
    executiveSummary: executiveSummary + relevantSignalNote,
    keyFindings,
    commercialAssessment,
    customerOpportunity,
    talkingPoints,
    recommendedNextAction: o.recommendedAction,
  };
}

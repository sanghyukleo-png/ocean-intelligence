import { MarketIndicator, MarketSignal } from "@/types";

// NOTE: All figures below are SIMULATED / DEMO DATA for portfolio purposes only.
// They do not represent live market information.

export const mockMarketIndicators: MarketIndicator[] = [
  {
    id: "fleet-size",
    label: "Global Merchant Fleet",
    value: 105230,
    unit: "vessels",
    changePct: 1.8,
    direction: "up",
    sparkline: [98200, 99400, 100800, 101900, 103100, 104200, 105230],
    description: "Total active merchant vessels tracked across major segments.",
  },
  {
    id: "avg-fleet-age",
    label: "Average Fleet Age",
    value: 13.4,
    unit: "years",
    changePct: 2.3,
    direction: "up",
    sparkline: [12.1, 12.4, 12.7, 12.9, 13.0, 13.2, 13.4],
    description: "Fleet aging as newbuilding deliveries lag scrapping pace.",
  },
  {
    id: "orderbook",
    label: "Global Orderbook",
    value: 11.2,
    unit: "% of fleet",
    changePct: -4.1,
    direction: "down",
    sparkline: [12.8, 12.5, 12.1, 11.8, 11.6, 11.4, 11.2],
    description: "Orderbook-to-fleet ratio remains below historical average.",
  },
  {
    id: "newbuilding",
    label: "Newbuilding Contracts (YTD)",
    value: 842,
    unit: "vessels",
    changePct: 6.7,
    direction: "up",
    sparkline: [610, 655, 690, 730, 770, 805, 842],
    description: "Contracting activity accelerating on fleet renewal demand.",
  },
  {
    id: "scrapping",
    label: "Scrapping Activity (YTD)",
    value: 296,
    unit: "vessels",
    changePct: 12.4,
    direction: "up",
    sparkline: [180, 205, 220, 240, 258, 275, 296],
    description: "Aging tonnage exiting the fleet at an accelerating rate.",
  },
  {
    id: "alt-fuel",
    label: "Alternative Fuel Orderbook Share",
    value: 44.6,
    unit: "%",
    changePct: 8.9,
    direction: "up",
    sparkline: [28.4, 31.2, 34.0, 37.5, 40.1, 42.3, 44.6],
    description: "Share of newbuilding orders specifying LNG / methanol / ammonia-ready propulsion.",
  },
  {
    id: "freight",
    label: "Composite Freight Index",
    value: 1284,
    unit: "pts",
    changePct: -2.6,
    direction: "down",
    sparkline: [1350, 1340, 1320, 1305, 1298, 1291, 1284],
    description: "Blended freight index across tanker, bulker, and container segments.",
  },
  {
    id: "trade-activity",
    label: "Seaborne Trade Volume",
    value: 12480,
    unit: "M tons",
    changePct: 3.1,
    direction: "up",
    sparkline: [11700, 11850, 12000, 12150, 12280, 12380, 12480],
    description: "Annualized seaborne trade volume across major commodity groups.",
  },
];

export const mockMarketSignals: MarketSignal[] = [
  {
    id: "signal-fleet-renewal",
    title: "Fleet Renewal Window Widening",
    direction: "up",
    importance: "high",
    segment: "Tanker / Bulker",
    summary:
      "Average fleet age crossing 13 years alongside a sub-12% orderbook ratio signals an accelerating replacement cycle for owners deferring newbuilding decisions.",
  },
  {
    id: "signal-alt-fuel",
    title: "Alternative Fuel Transition Accelerating",
    direction: "up",
    importance: "high",
    segment: "All Segments",
    summary:
      "Nearly half of new contracts now specify alternative-fuel-ready propulsion, ahead of tightening IMO emissions milestones.",
  },
  {
    id: "signal-tanker-demand",
    title: "Tanker Demand Firming",
    direction: "up",
    importance: "medium",
    segment: "MR / LR Tanker",
    summary:
      "Seaborne trade volumes for refined products are rising while available modern tonnage remains tight in the MR segment.",
  },
  {
    id: "signal-orderbook-pressure",
    title: "Orderbook Pressure at Yards",
    direction: "up",
    importance: "medium",
    segment: "All Segments",
    summary:
      "Newbuilding contracting is outpacing yard slot availability, extending delivery windows and favoring early commercial engagement.",
  },
  {
    id: "signal-scrapping-cycle",
    title: "Scrapping Cycle Turning Up",
    direction: "up",
    importance: "medium",
    segment: "Bulker / Tanker",
    summary:
      "Scrapping activity is accelerating year-to-date as owners retire aging, fuel-inefficient tonnage ahead of regulatory deadlines.",
  },
  {
    id: "signal-freight-softening",
    title: "Freight Softening at the Margin",
    direction: "down",
    importance: "low",
    segment: "Composite",
    summary:
      "The composite freight index has eased modestly, a secondary factor relative to structural fleet-renewal demand.",
  },
];

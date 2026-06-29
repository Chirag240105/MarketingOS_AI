export const PLANS = {
  FREE: {
    label: "Free",
    monthlyCampaigns: 3,
    teamSeats: 1,
  },
  STARTER: {
    label: "Starter",
    monthlyCampaigns: 15,
    teamSeats: 3,
  },
  PRO: {
    label: "Pro",
    monthlyCampaigns: 60,
    teamSeats: 10,
  },
  AGENCY: {
    label: "Agency",
    monthlyCampaigns: 250,
    teamSeats: 50,
  },
} as const;

export type WalletPersonalityId =
  | "explorer"
  | "builder"
  | "collector"
  | "trader"
  | "power-user";

export type WalletReputationId =
  | "elite"
  | "trusted"
  | "established"
  | "emerging"
  | "developing";

export type WalletRiskLevelId = "low" | "medium" | "high";

export type WalletIntelligenceSignal = {
  label: string;
  value: string;
};

export type WalletPersonalityResult = {
  id: WalletPersonalityId;
  label: string;
  summary: string;
  signals: WalletIntelligenceSignal[];
};

export type WalletReputationResult = {
  id: WalletReputationId;
  label: string;
  summary: string;
  scoreBand: string;
  signals: WalletIntelligenceSignal[];
};

export type WalletRiskResult = {
  id: WalletRiskLevelId;
  label: string;
  summary: string;
  /** 0–100 deterministic risk pressure (higher = riskier). */
  riskScore: number;
  signals: WalletIntelligenceSignal[];
};

export type WalletIntelligenceResult = {
  personality: WalletPersonalityResult;
  reputation: WalletReputationResult;
  risk: WalletRiskResult;
};

import { cachedJsonGet } from "@/lib/wallet-score/cache";
import { BLOCKSCOUT_BASE_API_V2 } from "@/lib/wallet-score/constants";
import {
  resolveBaseProtocol,
  normalizeContractAddress,
} from "@/lib/wallet-score/ecosystem/protocols";
import type {
  BaseEcosystemAnalysis,
  BaseEcosystemAnalysisInput,
  EcosystemProtocolHit,
} from "@/lib/wallet-score/ecosystem/types";
import {
  clamp,
  linearScore,
  logScore,
} from "@/lib/wallet-score/scoring/normalize";
import type { Address } from "viem";

type BlockscoutAddressRef = {
  hash?: string;
  is_contract?: boolean;
  name?: string | null;
};

type BlockscoutTx = {
  hash?: string;
  to?: BlockscoutAddressRef | null;
  created_contract?: BlockscoutAddressRef | null;
};

type BlockscoutTxPage = {
  items?: BlockscoutTx[];
  next_page_params?: Record<string, string | number> | null;
};

const DEFAULT_MAX_PAGES = 8;

/**
 * Mirrors the Base Ecosystem Usage curve in the scoring engine.
 * Kept here so the analysis module can report contribution without
 * changing calculateWalletScore structure.
 */
export function computeEcosystemScoreContribution(
  protocolsUsed: number,
  contractInteractions: number,
): number {
  return (
    Math.round(
      clamp(
        0.45 * linearScore(protocolsUsed, 8) +
          0.55 * logScore(contractInteractions, 500),
      ) * 10,
    ) / 10
  );
}

function toQueryParams(
  params: Record<string, string | number>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
}

async function fetchAddressTransactions(
  address: Address,
  params?: Record<string, string>,
): Promise<BlockscoutTxPage> {
  const url = new URL(
    `${BLOCKSCOUT_BASE_API_V2}/addresses/${address}/transactions`,
  );

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }

  return cachedJsonGet<BlockscoutTxPage>(url.toString(), {
    errorPrefix: "Blockscout HTTP",
    revalidateSeconds: 60,
  });
}

function targetContractAddress(tx: BlockscoutTx): string | null {
  const toHash = tx.to?.hash;
  if (toHash && tx.to?.is_contract) {
    return normalizeContractAddress(toHash);
  }

  const created = tx.created_contract?.hash;
  if (created) {
    return normalizeContractAddress(created);
  }

  return null;
}

/**
 * Analyze a wallet's recent Base contract interactions against known
 * ecosystem protocols (Aerodrome, Uniswap, Aave, Bridge, etc.).
 */
export async function analyzeBaseEcosystem(
  input: BaseEcosystemAnalysisInput,
): Promise<BaseEcosystemAnalysis> {
  const { address, maxPages = DEFAULT_MAX_PAGES } = input;

  try {
    const protocolInteractions = new Map<
      string,
      { name: string; interactions: number; contracts: Set<string> }
    >();
    const uniqueContracts = new Set<string>();
    let contractInteractions = 0;
    let transactionsScanned = 0;

    let pageParams: Record<string, string> | undefined;
    let pages = 0;

    while (pages < maxPages) {
      const page = await fetchAddressTransactions(address, pageParams);
      const items = page.items ?? [];

      if (items.length === 0) {
        break;
      }

      for (const tx of items) {
        transactionsScanned += 1;
        const contract = targetContractAddress(tx);
        if (!contract) {
          continue;
        }

        const protocol = resolveBaseProtocol(contract);
        if (!protocol) {
          continue;
        }

        contractInteractions += 1;
        uniqueContracts.add(contract);

        const existing = protocolInteractions.get(protocol.id);
        if (existing) {
          existing.interactions += 1;
          existing.contracts.add(contract);
        } else {
          protocolInteractions.set(protocol.id, {
            name: protocol.name,
            interactions: 1,
            contracts: new Set([contract]),
          });
        }
      }

      pages += 1;
      const next = page.next_page_params;
      if (!next) {
        break;
      }
      pageParams = toQueryParams(next);
    }

    const protocols: EcosystemProtocolHit[] = [...protocolInteractions.entries()]
      .map(([id, value]) => ({
        id,
        name: value.name,
        interactions: value.interactions,
        contracts: [...value.contracts],
      }))
      .sort((a, b) => b.interactions - a.interactions);

    const protocolsUsed = protocols.length;
    const ecosystemScore = computeEcosystemScoreContribution(
      protocolsUsed,
      contractInteractions,
    );

    return {
      protocolsUsed,
      contractInteractions,
      uniqueContracts: uniqueContracts.size,
      ecosystemScore,
      protocols,
      transactionsScanned,
      source: "blockscout",
    };
  } catch (error) {
    return {
      protocolsUsed: 0,
      contractInteractions: 0,
      uniqueContracts: 0,
      ecosystemScore: 0,
      protocols: [],
      transactionsScanned: 0,
      source: "unavailable",
      error:
        error instanceof Error ? error.message : "Ecosystem analysis failed",
    };
  }
}

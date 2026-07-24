/**
 * Curated Base mainnet contracts mapped to ecosystem protocols.
 * Addresses are stored lowercase for O(1) lookup.
 */
export type BaseProtocolDefinition = {
  id: string;
  name: string;
};

export const BASE_PROTOCOL_BY_ADDRESS: Record<string, BaseProtocolDefinition> = {
  // Aerodrome
  "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43": {
    id: "aerodrome",
    name: "Aerodrome",
  },
  "0x420dd381b31aef6683db6b902084cb0ffece40da": {
    id: "aerodrome",
    name: "Aerodrome",
  },
  "0x16613524e02ad97edfef411be7139643229f6ff9": {
    id: "aerodrome",
    name: "Aerodrome",
  },

  // Uniswap
  "0x2626664c2603336e57b271c5c0b26f421741e481": {
    id: "uniswap",
    name: "Uniswap",
  },
  "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": {
    id: "uniswap",
    name: "Uniswap",
  },
  "0x198ef79f1f515f02dfe7188e0b555e9a1c32dcc9": {
    id: "uniswap",
    name: "Uniswap",
  },
  "0x33128a8fc17869897dce68ed026d694621f6fdfd": {
    id: "uniswap",
    name: "Uniswap",
  },

  // Aave
  "0xa238dd80c259a72e81d7e4664a9801593f98d1c5": {
    id: "aave",
    name: "Aave",
  },
  "0x18cd499e31cc8499ed6ec88829e992bbac86223a": {
    id: "aave",
    name: "Aave",
  },

  // Base Bridge / system
  "0x4200000000000000000000000000000000000010": {
    id: "base-bridge",
    name: "Base Bridge",
  },
  "0x3154cf16ccdb4c6d922629664174b904d80f2c35": {
    id: "base-bridge",
    name: "Base Bridge",
  },

  // OpenSea / Seaport
  "0x00000000000000adc04c56bf30ac9d3c0aaf14dc": {
    id: "opensea",
    name: "OpenSea",
  },
  "0x0000000000000068f116a894984e2db1123eb395": {
    id: "opensea",
    name: "OpenSea",
  },

  // 1inch
  "0x1111111254eeb25477b68fb85ed929f73a960582": {
    id: "1inch",
    name: "1inch",
  },
  "0x111111125421ca6dc452d289314280a0f8842a65": {
    id: "1inch",
    name: "1inch",
  },

  // Moonwell
  "0xfbb21d0380bee3312b33c4353c8936a0f9259234": {
    id: "moonwell",
    name: "Moonwell",
  },

  // Compound III (USDC on Base)
  "0x9c4ec768c28520b50860ea7a86e6b1264bda6c47": {
    id: "compound",
    name: "Compound",
  },
};

/** Normalize an address for registry lookup. */
export function normalizeContractAddress(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveBaseProtocol(
  address: string,
): BaseProtocolDefinition | null {
  return BASE_PROTOCOL_BY_ADDRESS[normalizeContractAddress(address)] ?? null;
}

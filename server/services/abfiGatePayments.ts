/**
 * ABFI Gate Payment Contract Scaffold (Polygon)
 * Provides ABI and request builders for oracle integrations.
 */

export const ABFI_GATE_PAYMENTS_ABI = [
  "function gate0Release(bytes32 deliveryId, uint256 cumulativeT, uint256 dmPct, bytes sigGateway) external",
  "function gateRelease(bytes32 deliveryId, uint8 gateIndex, uint256 amount, bytes sigGateway) external",
  "event GateReleased(bytes32 indexed deliveryId, uint8 gateIndex, uint256 amount, address recipient)",
];

export interface Gate0ReleaseInput {
  deliveryId: string;
  cumulativeTonnes: number;
  dryMatterPct: number;
  gatewaySignature: string;
}

export interface GateReleaseInput {
  deliveryId: string;
  gateIndex: number;
  amount: number;
  gatewaySignature: string;
}

export function buildGate0ReleaseRequest(input: Gate0ReleaseInput) {
  return {
    method: "gate0Release",
    args: [
      input.deliveryId,
      input.cumulativeTonnes,
      input.dryMatterPct,
      input.gatewaySignature,
    ],
  };
}

export function buildGateReleaseRequest(input: GateReleaseInput) {
  return {
    method: "gateRelease",
    args: [
      input.deliveryId,
      input.gateIndex,
      input.amount,
      input.gatewaySignature,
    ],
  };
}

export function calculateReleaseAmount(contractValue: number, percent: number) {
  return Number((contractValue * percent / 100).toFixed(2));
}

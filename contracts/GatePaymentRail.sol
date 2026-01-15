// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEscrow {
  function release(address to, uint256 amount, uint256 deliveryId) external returns (bool);
}

contract GatePaymentRail {
  address public owner;
  address public escrow;

  struct GateState {
    uint16 releasedBps;
    uint256 releasedAmount;
    uint256 lastReleaseTime;
  }

  mapping(uint256 => GateState) public gateStates;

  event Gate0Released(uint256 indexed deliveryId, uint256 amount, address recipient, uint16 releasedBps);
  event EscrowUpdated(address escrow);

  modifier onlyOwner() {
    require(msg.sender == owner, "Not authorized");
    _;
  }

  constructor(address escrowAddress) {
    owner = msg.sender;
    escrow = escrowAddress;
  }

  function setEscrow(address escrowAddress) external onlyOwner {
    escrow = escrowAddress;
    emit EscrowUpdated(escrowAddress);
  }

  function releaseGate0(uint256 deliveryId, uint256 amount, address recipient) external onlyOwner returns (bool) {
    GateState storage state = gateStates[deliveryId];
    require(state.releasedBps == 0, "Gate 0 already released");

    state.releasedBps = 3000;
    state.releasedAmount = amount;
    state.lastReleaseTime = block.timestamp;

    if (escrow != address(0)) {
      require(IEscrow(escrow).release(recipient, amount, deliveryId), "Escrow release failed");
    }

    emit Gate0Released(deliveryId, amount, recipient, state.releasedBps);
    return true;
  }

  function getGateState(
    uint256 deliveryId
  ) external view returns (uint16 releasedBps, uint256 releasedAmount, uint256 lastReleaseTime) {
    GateState memory state = gateStates[deliveryId];
    return (state.releasedBps, state.releasedAmount, state.lastReleaseTime);
  }
}

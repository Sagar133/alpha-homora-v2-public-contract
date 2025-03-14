// SPDX-License-Identifier: MIT
pragma solidity >=0.6.12;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/math/SafeMath.sol';

import '../../interfaces/ICErc20.sol';

contract MockCErc20 is ICErc20 {
  using SafeMath for uint;

  IERC20 public token;
  uint public interestPerYear = 10e16; // 10% per year

  mapping(address => uint) public borrows;
  mapping(address => uint) public lastBlock;

  constructor(IERC20 _token) {
    token = _token;
  }

  function decimals() external override returns (uint8) {
    return 8;
  }

  function underlying() external override returns (address) {
    return address(token);
  }

  function mint(uint mintAmount) external override returns (uint) {
    // Not implemented
    return 0;
  }

  function redeem(uint redeemTokens) external override returns (uint) {
    // Not implemented
    return 0;
  }

  function balanceOf(address user) external view override returns (uint) {
    // Not implemented
    return 0;
  }

  function borrowBalanceCurrent(address account) public override returns (uint) {
    uint timePast = block.timestamp - lastBlock[account];
    if (timePast > 0) {
      uint interest = borrows[account].mul(interestPerYear).div(100e16).mul(timePast).div(365 days);
      borrows[account] = borrows[account].add(interest);
      lastBlock[account] = block.timestamp;
    }
    return borrows[account];
  }

  function borrowBalanceStored(address account) external view override returns (uint) {
    return borrows[account];
  }

  function borrow(uint borrowAmount) external override returns (uint) {
    borrowBalanceCurrent(msg.sender);
    token.transfer(msg.sender, borrowAmount);
    borrows[msg.sender] = borrows[msg.sender].add(borrowAmount);
    return 0;
  }

  function repayBorrow(uint repayAmount) external override returns (uint) {
    borrowBalanceCurrent(msg.sender);
    token.transferFrom(msg.sender, address(this), repayAmount);
    borrows[msg.sender] = borrows[msg.sender].sub(repayAmount);
    return 0;
  }
}

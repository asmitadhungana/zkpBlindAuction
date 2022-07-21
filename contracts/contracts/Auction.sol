// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// HigherBidder circuit verifier contract
interface IVerifier {
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[3] memory input
    ) external view returns (bool); 
}

contract ZKPBlindAuction {
    uint256 constant DEPOSIT_AMOUNT = 1 ether;
    uint256 constant AUCTION_DURATION = 86400; // One day
    uint256 constant PAYMENT_DURATION = 86400 * 2; // Two days

    uint256 public immutable auctionEndTime;
    uint256 immutable auctionStartTime;
    uint256 immutable paymentEndTime;

    address public verifierContractAddress;
    address public beneficiary;

    mapping(uint256 => address) public hashedBidsToBidders;
    mapping(address => bool) public depositRefundable;

    address public highestBidder;
    uint256 public highestBid = 0;

    event NewBid(uint256 commitmentHash, address bidder);
    event NewHighestBid(uint256 bidValue, address bidder);

    constructor (
        address _verifierAddress,
        uint256 _bidStart,
        address payable _beneficiaryAddress
    ) {
        auctionStartTime = _bidStart;
        auctionEndTime = _bidStart + AUCTION_DURATION;
        paymentEndTime = _bidStart + PAYMENT_DURATION;
        verifierContractAddress = _verifierAddress;
        beneficiary = _beneficiaryAddress;
    }

    function makeNewBid(uint256 commitmentHash) external payable {
        require(msg.value == 1 ether, "Deposit should be 1 ether");
        require(block.timestamp < auctionEndTime, "Auction already ended");
        hashedBidsToBidders[commitmentHash] = msg.sender;
        emit NewBid(commitmentHash, msg.sender);
    }

    // input[3] = 3 public values in ckt 
    // input[0] = next_highest_bid, input[1] = sc_highest_bid, input[2] = commitmentHash
    function claimHighestBid(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input
    ) external {
        require(block.timestamp > auctionEndTime, "Auction ongoing");
        require(hashedBidsToBidders[input[2]] != address(0), "User not an auction bidder"); // User was not a bidder during auction
        require(verifyProof(a, b, c, input) == true, "Invalid proof"); // Some(any one) element in calldata was modified
        require(input[1] == highestBid, "Incorrect highestBid inputted to prover"); // User provided incorrect highestBid from SC to the prover
        depositRefundable[msg.sender] = true; // Add bidder to depositRefundable mapping
        
        // Check if the user's bid is higher than sc bid
        if (input[0] >= highestBid) {
            // Corresponding msg.sender of the new highest bid is the highest bidder
            address newHighestBidder = hashedBidsToBidders[input[2]];
            setHighestBid(input[0], newHighestBidder);
            emit NewHighestBid(input[0], newHighestBidder);
        }
    }

    function getDepositRefund() external {
        require(depositRefundable[msg.sender], "Deposit non-refundable");
        depositRefundable[msg.sender] = false;
        payable(msg.sender).transfer(1 ether);
    }

    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[3] memory input
    ) internal view returns (bool) {
        return IVerifier(verifierContractAddress).verifyProof(a, b, c, input);
    }

    function setHighestBid(uint256 bidValue, address newHighestBidder) private {
        highestBid = bidValue;
        highestBidder = newHighestBidder;
    }
}
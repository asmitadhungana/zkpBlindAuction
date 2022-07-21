// INCOMPLETE
const { ethers } = require("hardhat");
const { exportCallDataGroth16, calldata } = require("../test/utils/utils.js");
const buildPoseidon = require("circomlibjs").buildPoseidon;

const main = async () => {
  const HigherBidderVerifier = await hre.ethers.getContractFactory("Verifier");
  const higherBidderVerifier = await HigherBidderVerifier.deploy();
  await higherBidderVerifier.deployed();
  console.log("HigherBidderVerifier Contract deployed to:", higherBidderVerifier.address);

  // Deploy ZKPBlindAuction
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);
  startTime = block.timestamp;

  [deployer, beneficiary, bidder1, bidder2] = await ethers.getSigners();

  const ZKPBlindAuction = await hre.ethers.getContractFactory("ZKPBlindAuction");
  const zkpBlindAuction = await ZKPBlindAuction.deploy(higherBidderVerifier.address, startTime, beneficiary.address);
  await zkpBlindAuction.deployed();
  console.log("ZKPBlindAuction Contract deployed to:", zkpBlindAuction.address);

  // Create the commitmentHash
  poseidonJs = await buildPoseidon();
  const bid_value = 1000;
  const privSalt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
  const currentHighestBid = 0;

  const pubCommitmentHash = ethers.BigNumber.from(
    poseidonJs.F.toObject(poseidonJs([bid_value.toString(), privSalt.toBigInt()]))
  );

  // Bidder makes a new bid
  await zkpBlindAuction.connect(bidder1).makeNewBid(pubCommitmentHash.toBigInt(), {value: ethers.utils.parseEther("1.0")});

  const INPUT = {
    "bid": [bid_value.toString(), privSalt.toBigInt()],
    "current_highest_bid": currentHighestBid.toString(),
    "commitment_hash": pubCommitmentHash.toBigInt(),
  }

  // Simulate Auction Ending
  let auctionEndTime = (await zkpBlindAuction.auctionEndTime()).toNumber();
  await ethers.provider.send("evm_setNextBlockTimestamp", [auctionEndTime + 60]);

  let dataResult = await exportCallDataGroth16(
    INPUT,
    "./zkproof/higherBidder.wasm",
    "./zkproof/higherBidder_final.zkey"
  );

  // Call the function.
  let result = await higherBidderVerifier.verifyProof(
    dataResult.a, // callDataSudoku[0], 
    dataResult.b, // callDataSudoku[1],
    dataResult.c, // callDataSudoku[2],
    dataResult.Input // callDataSudoku[3]
  );

  console.log("Result", result);
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();

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

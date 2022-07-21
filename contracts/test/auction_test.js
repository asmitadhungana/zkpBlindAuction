const { expect } = require("chai");
const { ethers } = require("hardhat");
const { exportCallDataGroth16 } = require("./utils/utils");

let HigherBidderVerifier, higherBidderVerifier, ZKPBlindAuction, zkpBlindAuction;

const doDeployVerifierContract = async () => {
  HigherBidderVerifier = await ethers.getContractFactory("Verifier");
  higherBidderVerifier = await HigherBidderVerifier.deploy();
  await higherBidderVerifier.deployed();
}

const doDeployAuctionContract = async () => {
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber);
  startTime = block.timestamp;

  [deployer, beneficiary, bidder1, bidder2] = await ethers.getSigners();

  ZKPBlindAuction = await hre.ethers.getContractFactory("ZKPBlindAuction");
  zkpBlindAuction = await ZKPBlindAuction.deploy(higherBidderVerifier.address, startTime, beneficiary.address);
  await zkpBlindAuction.deployed();
}

describe("Auction contract", function () {

  beforeEach(async () => {
    await doDeployVerifierContract();
    await doDeployAuctionContract();
  });

  it("Should let a bidder make a new bid", async function () {
    const commitment_hash = "3870989583303220174742719770127939968852238306905631090839406313169600841906";
    await zkpBlindAuction.connect(bidder1).makeNewBid(commitment_hash, {value: ethers.utils.parseEther("1.0")});

    const commitment_hash_2 = "3870989583303220174742719770127939968852238306905631090839406313169600841906";
    await zkpBlindAuction.connect(bidder2).makeNewBid(commitment_hash_2, {value: ethers.utils.parseEther("1.0")});
  });

  it("Should let a bidder submit a valid proof", async function () {
    let input = {
      "bid": ["300000000000000000", "4390288406633841039374905140997088596816213696357408910893002029934783691"],
      "current_highest_bid": "0",
      "commitment_hash": "3870989583303220174742719770127939968852238306905631090839406313169600841906"
    };

    let dataResult = await exportCallDataGroth16(
      input,
      "./zkproof/higherBidder.wasm",
      "./zkproof/higherBidder_final.zkey"
    );

    let result = await higherBidderVerifier.verifyProof(
      dataResult.a,
      dataResult.b,
      dataResult.c,
      dataResult.Input
    );

    expect(result).to.equal(true);
  });

  it("Should let the highest bidder make a claim for highestBidder bid after Auction ends", async function () {
    // Bidder 1 makes a new bid
    const commitment_hash = "3870989583303220174742719770127939968852238306905631090839406313169600841906";
    await zkpBlindAuction.connect(bidder1).makeNewBid(commitment_hash, {value: ethers.utils.parseEther("1.0")});

    // Simulate Auction Ending
    let auctionEndTime = (await zkpBlindAuction.auctionEndTime()).toNumber();
    await ethers.provider.send("evm_setNextBlockTimestamp", [auctionEndTime + 60]);

    // Bidder 1 makes the claim for highestBid
    let input = {
      "bid": ["300000000000000000", "4390288406633841039374905140997088596816213696357408910893002029934783691"],
      "current_highest_bid": "0",
      "commitment_hash": "3870989583303220174742719770127939968852238306905631090839406313169600841906"
    };

    let dataResult = await exportCallDataGroth16(
      input,
      "./zkproof/higherBidder.wasm",
      "./zkproof/higherBidder_final.zkey"
    );

    // console.log("Input: ", dataResult.Input);

    await zkpBlindAuction.connect(bidder1).claimHighestBid(
      dataResult.a,
      dataResult.b,
      dataResult.c,
      dataResult.Input
    );

    let newHighestBid = await zkpBlindAuction.highestBid();

    expect(newHighestBid).to.equal("300000000000000000");
  });

  it("Doesn't change the highest bidder when claim made for a bid less than present highest bid", async function () {
    // Bidder 1 makes a new bid
    const commitment_hash = "3870989583303220174742719770127939968852238306905631090839406313169600841906";
    await zkpBlindAuction.connect(bidder1).makeNewBid(commitment_hash, {value: ethers.utils.parseEther("1.0")});

    // Bidder 2 makes a new bid
    const commitment_hash_2 = "17177993224371861018071498317533036809183714685988513271892389291042328167634";
    await zkpBlindAuction.connect(bidder1).makeNewBid(commitment_hash_2, {value: ethers.utils.parseEther("1.0")});

    // Simulate Auction End
    let auctionEndTime = (await zkpBlindAuction.auctionEndTime()).toNumber();
    await ethers.provider.send("evm_setNextBlockTimestamp", [auctionEndTime + 60]);

    // Bidder 1 makes the claim for highestBid
    let input = {
      "bid": ["300000000000000000", "4390288406633841039374905140997088596816213696357408910893002029934783691"],
      "current_highest_bid": "0",
      "commitment_hash": "3870989583303220174742719770127939968852238306905631090839406313169600841906"
    };

    let dataResult = await exportCallDataGroth16(
      input,
      "./zkproof/higherBidder.wasm",
      "./zkproof/higherBidder_final.zkey"
    );

    await zkpBlindAuction.connect(bidder1).claimHighestBid(
      dataResult.a,
      dataResult.b,
      dataResult.c,
      dataResult.Input
    );

    // Bidder 1 makes the claim for highestBid
    let input_2 = {
      "bid": ["200000000000000000", "4390288406633841039374905140997088596816213696357408910893002029934783691"],
      "current_highest_bid": "300000000000000000",
      "commitment_hash": "17177993224371861018071498317533036809183714685988513271892389291042328167634"
    };

    let dataResult_2 = await exportCallDataGroth16(
      input_2,
      "./zkproof/higherBidder.wasm",
      "./zkproof/higherBidder_final.zkey"
    );

    await zkpBlindAuction.connect(bidder2).claimHighestBid(
      dataResult_2.a,
      dataResult_2.b,
      dataResult_2.c,
      dataResult_2.Input
    );

    let newHighestBid = await zkpBlindAuction.highestBid();

    expect(newHighestBid).to.equal("300000000000000000");
  });

  it("Shouldn't let a bidder call claimHighestBid before auction ends", async function () {
    // Bidder 1 makes a new bid
    const commitment_hash = "3870989583303220174742719770127939968852238306905631090839406313169600841906";
    await zkpBlindAuction.connect(bidder1).makeNewBid(commitment_hash, {value: ethers.utils.parseEther("1.0")});

    // Bidder 1 makes the claim for highestBid: Before Auction Ends
    let input = {
      "bid": ["300000000000000000", "4390288406633841039374905140997088596816213696357408910893002029934783691"],
      "current_highest_bid": "0",
      "commitment_hash": "3870989583303220174742719770127939968852238306905631090839406313169600841906"
    };

    let dataResult = await exportCallDataGroth16(
      input,
      "./zkproof/higherBidder.wasm",
      "./zkproof/higherBidder_final.zkey"
    );

    await expect(
      zkpBlindAuction.connect(bidder1).claimHighestBid(
        dataResult.a,
        dataResult.b,
        dataResult.c,
        dataResult.Input
      )
    ).to.be.revertedWith("Auction ongoing");
  });

  it("Should revert for wrong existing highest bid provided to the prover", async function () {
    // Bidder 1 makes a new bid
    const commitment_hash = "3870989583303220174742719770127939968852238306905631090839406313169600841906";
    await zkpBlindAuction.connect(bidder1).makeNewBid(commitment_hash, {value: ethers.utils.parseEther("1.0")});

    // Simulate Auction End
    let auctionEndTime = (await zkpBlindAuction.auctionEndTime()).toNumber();
    await ethers.provider.send("evm_setNextBlockTimestamp", [auctionEndTime + 60]);

    // Bidder 1 makes the claim for highestBid
    let input = {
      "bid": ["300000000000000000", "4390288406633841039374905140997088596816213696357408910893002029934783691"],
      "current_highest_bid": "1000",
      "commitment_hash": "3870989583303220174742719770127939968852238306905631090839406313169600841906"
    };

    let dataResult = await exportCallDataGroth16(
      input,
      "./zkproof/higherBidder.wasm",
      "./zkproof/higherBidder_final.zkey"
    );

    await expect(
      zkpBlindAuction.connect(bidder1).claimHighestBid(
        dataResult.a,
        dataResult.b,
        dataResult.c,
        dataResult.Input
      )
    ).to.be.revertedWith("Incorrect highestBid inputted to prover");
  });

  it("Should revert when a non-bidder calls claimHighestBid", async function () {
    // Simulate Auction End
    let auctionEndTime = (await zkpBlindAuction.auctionEndTime()).toNumber();
    await ethers.provider.send("evm_setNextBlockTimestamp", [auctionEndTime + 60]);
    
    // Bidder 1 makes the claim for highestBid
    let input = {
      "bid": ["300000000000000000", "4390288406633841039374905140997088596816213696357408910893002029934783691"],
      "current_highest_bid": "1000",
      "commitment_hash": "3870989583303220174742719770127939968852238306905631090839406313169600841906"
    };

    let dataResult = await exportCallDataGroth16(
      input,
      "./zkproof/higherBidder.wasm",
      "./zkproof/higherBidder_final.zkey"
    );

    await expect(
      zkpBlindAuction.connect(bidder1).claimHighestBid(
        dataResult.a,
        dataResult.b,
        dataResult.c,
        dataResult.Input
      )
    ).to.be.revertedWith("User not an auction bidder");
  });

  it("Verifier: Should revert when a modified calldata is provided to the verifier", async function () {
    // Bidder 1 makes a new bid
    const commitment_hash = "3870989583303220174742719770127939968852238306905631090839406313169600841906";
    await zkpBlindAuction.connect(bidder1).makeNewBid(commitment_hash, {value: ethers.utils.parseEther("1.0")});

    // Simulate Auction End
    let auctionEndTime = (await zkpBlindAuction.auctionEndTime()).toNumber();
    await ethers.provider.send("evm_setNextBlockTimestamp", [auctionEndTime + 60]);

    // Bidder 1 makes the claim for highestBid
    let input = {
      "bid": ["300000000000000000", "4390288406633841039374905140997088596816213696357408910893002029934783691"],
      "current_highest_bid": "1000",
      "commitment_hash": "3870989583303220174742719770127939968852238306905631090839406313169600841906"
    };

    let dataResult = await exportCallDataGroth16(
      input,
      "./zkproof/higherBidder.wasm",
      "./zkproof/higherBidder_final.zkey"
    );

    await expect(
      zkpBlindAuction.connect(bidder1).claimHighestBid(
        dataResult.c, // Incorrect input parameter 
        dataResult.b,
        dataResult.c,
        dataResult.Input
      )
    ).to.be.revertedWith("Invalid proof"); // Doesn't revert from contract but assert fails in groth16FullProve while calling exportCallDataGroth16() 
  });
});
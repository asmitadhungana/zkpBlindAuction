const chai = require("chai");
const { ethers } = require("ethers");

const wasm_tester = require("circom_tester").wasm;

const F1Field = require("ffjavascript").F1Field;
const Scalar = require("ffjavascript").Scalar;
const buildPoseidon = require("circomlibjs").buildPoseidon;

exports.p = Scalar.fromString("21888242871839275222246405745257275088548364400416034343698204186575808495617");
const Fr = new F1Field(exports.p);

const assert = chai.assert;

describe("HigherBidder circuit test", async() => {
  let circuit;

  beforeEach(async () => {
    circuit = await wasm_tester("auction/HigherBidder.circom");
    await circuit.loadConstraints();
  
    poseidonJs = await buildPoseidon();
  });

  it("HigherBidder Circuit test", async () => {
    const bid_value = 1000;
    const privSalt = ethers.BigNumber.from(ethers.utils.randomBytes(32));
    const currentHighestBid = 999;

    const pubCommitmentHash = ethers.BigNumber.from(
      poseidonJs.F.toObject(poseidonJs([bid_value.toString(), privSalt.toBigInt()]))
    );

    // console.log("privSalt", privSalt.toBigInt());
    // console.log("pubCommitmentHash", pubCommitmentHash.toBigInt());

    const INPUT = {
      "bid": [bid_value.toString(), privSalt.toBigInt()],
      "current_highest_bid": currentHighestBid.toString(),
      "commitment_hash": pubCommitmentHash.toBigInt(),
    }
    
    let witness;
    witness = await circuit.calculateWitness(INPUT, true);
  
    await circuit.checkConstraints(witness);

    // Assert that the outputs are valid
    assert(Fr.eq(Fr.e(witness[0]), Fr.e(1)));
  });
});
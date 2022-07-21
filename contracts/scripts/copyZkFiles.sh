#!/bin/bash

# Copy the verifier
cp ../circuits/auction/higherBidderVerifier.sol contracts

# Create the zkproof folder if it does not exist
mkdir -p zkproof

# Copy the wasm file to test smart contracts
cp ../circuits/auction/higherBidder_js/higherBidder.wasm zkproof

# Copy the final zkey file to test smart contracts
cp ../circuits/auction/higherBidder_final.zkey zkproof

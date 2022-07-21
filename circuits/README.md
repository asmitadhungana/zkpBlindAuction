# zkpBlindAuction circom circuit

This folder contains the `higherBidder.circom` [circuit](https://github.com/iden3/circom) for the zkpBlindAuction application.

## Install dependencies

To install all the dependencies run:

```bash
yarn install
```

## Compile circuits and generate and verify the zk-proof using [snarkjs](https://github.com/iden3/snarkjs)

To know how is everything generated, you can see the `executeGroth16.sh` file inside the `auction` folder.

To compile and run the circuit, go inside the auction folder and run:

### Compile the circuit:

```bash
$ chmod u+x compile.sh
$ ./compile.sh
```

### Generate the witness
```bash
$ chmod u+x generateWitness.sh
$ ./generateWitness.sh
```

### Generate the proof using Groth16
```bash
$ chmod u+x executeGroth16.sh
$ ./executeGroth16.sh
```

## Run circuit tests using circom_tester
```bash
$ yarn test
```
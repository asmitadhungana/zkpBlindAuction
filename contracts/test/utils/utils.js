const { groth16 } = require("snarkjs");

async function exportCallDataGroth16(input, wasmPath, zkeyPath) {
  const { proof: _proof, publicSignals: _publicSignals } =
    await groth16.fullProve(input, wasmPath, zkeyPath);
  const calldata = await groth16.exportSolidityCallData(_proof, _publicSignals);

  // console.log("calldata", calldata);

  const argv = calldata
    .replace(/["[\]\s]/g, "")
    .split(",")
    .map((x) => BigInt(x).toString());

  const a = [argv[0], argv[1]];
  const b = [
    [argv[2], argv[3]],
    [argv[4], argv[5]],
  ];
  const c = [argv[6], argv[7]];
  const Input = [];

  for (let i = 8; i < argv.length; i++) {
    Input.push(argv[i]);
  }

  return { a, b, c, Input };
}

module.exports = {
  exportCallDataGroth16
};

// This is how the calldata looks like after line 6
// callData = [
//   [
//     "0x0c149be52990f59fe95a4d3b49174ba403575a5ffd29af685a9dfb7bbcdfe465", 
//     "0x134245adcc30c9749478973c0559bf77ed61d53e2461b6ae5e0311835d3799e1"
//   ],
//   [
//     [
//       "0x13ec31bb9abba8143f95d8a4592d1fe09c00cce2f09feff674fb989cda6ec564", 
//       "0x2d039385325147d0c83c6e636abfae9ed18071fd547e02badce2b9e9372376a9"
//     ],
//     [
//       "0x2a3d17398e18f0702c28e1cdf2893b49e79257274b230ca78d60f699197fd570", 
//       "0x2ccb468fc59c59bf305b6aa352de8c308a72c87c1c7092ceb5ee1dad816235d4"
//     ]
//   ],
//   [
//     "0x232ffd15f4ff8af7409f8dcde58b01a8d7a155b66cefe553aad30eca0d76779c", 
//     "0x30123a0ef3112ada9c596924a1361d21cbe767a6044f0df1cafe54a4ddbc8eda"
//   ],
//   [
//     "0x0000000000000000000000000000000000000000000000000429d069189e0000",
//     "0x00000000000000000000000000000000000000000000000000000000000003e8",
//     "0x088ee707b762df6287a26d211b7a5825c15a5e5271ba3f919733fd9b299b08b2"
//   ]
// ];

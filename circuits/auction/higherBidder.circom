pragma circom 2.0.3;

include "../node_modules/circomlib/circuits/poseidon.circom";

template ProveHigherBidder() {
    signal input bid[2]; // bid = [value, secret]
    signal input current_highest_bid; // current highest bid in the contract
    signal input commitment_hash; // bidder's commitment hash: public | // input[2] in SC verifier

    signal output next_highest_bid; // input[0] in SC verifier
    signal output sc_highest_bid; // input[1] in SC verifier

    component hash;

    hash = Poseidon(2);
    hash.inputs[0] <== bid[0];
    hash.inputs[1] <== bid[1];

    // log(hash.out);
    commitment_hash === hash.out; // Panics for hex represented commitment_hash 

    var nextHighestBid;

    if ( bid[0] > current_highest_bid ) {
        nextHighestBid = bid[0];
    } else {
        nextHighestBid = current_highest_bid;
    }    

    next_highest_bid <-- nextHighestBid;
    sc_highest_bid <-- current_highest_bid;
}


component main { public [ commitment_hash ] } = ProveHigherBidder();

/* INPUT = {
    "bid": ["300000000000000000", "4390288406633841039374905140997088596816213696357408910893002029934783691"],
    "current_highest_bid": "200000000000000000",
    "commitment_hash": "3870989583303220174742719770127939968852238306905631090839406313169600841906"
} */
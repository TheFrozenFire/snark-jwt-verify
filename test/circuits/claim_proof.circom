pragma circom 2.0.0;

include "../../circuits/claim_proof.circom";

/*
10240 bit payload, 16 bit segments, 20 byte claim
(10240 / 16) == 640 segments
((20 * 8) / 16) == 10 segment claim
*/
component main = ClaimProof(640, 16, 10);

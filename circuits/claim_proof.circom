pragma circom 2.0.0;

include "sha256.circom";
include "slice.circom";
include "../circomlib/circuits/bitify.circom";

/*
Claim Proof
    Takes a payload segmented into nWidth chunks and calculates a SHA256 hash, for which an RSA signature is known,
    as well as extracting a claim from the payload to be publicly output.

    Construction Parameters:
    - nCount:          Number of payload inputs of nWidth size
    - nWidth:          Bit width of payload inputs
    - claimLength:     Length of claim in nWidth segments

    Inputs:
    - payload[nCount]: Segments of payload as nWidth bit chunks
    - tBlock:          At which 512-bit block to select output hash
    - claimOffset:     Offset in nWidth segments to start extracting claim
    
    Outputs:
    - hash:            256-bit SHA256 hash output
    - claim:           nWidth-bit claim segments
*/
template ClaimProof(nCount, nWidth, claimLength) {
    signal input payload[nCount];
    signal input tBlock;
    
    signal input claimOffset;
    
    signal output hash[256];
    signal output claim[claimLength];
    
    // Segments must divide evenly into 512 bit blocks
    //assert(nWidth <= 512);
    //assert(512 % nWidth == 0);
    
    var nBlocks = (nCount * nWidth) / 512;
    var blockSegments = 512 / nWidth;
    
    component sha256 = Sha256_unsafe(nBlocks);
    component sha256_blocks[nBlocks][blockSegments];
    
    component claimExtract = Slice(nCount, claimLength);
    claimExtract.offset <== claimOffset;
    
    for(var n = 0; n < nBlocks; n++) {
        for(var b = 0; b < blockSegments; b++) {
            var payloadIndex = (n * blockSegments) + b;
        
            sha256_blocks[n][b] = Num2Bits(nWidth);
            sha256_blocks[n][b].in <== payload[payloadIndex];
            
            var bOffset = b * nWidth;
            for(var i = 0; i < nWidth; i++) {
                sha256.in[n][bOffset + i] <== sha256_blocks[n][b].out[i];
            }
        }
    }
    sha256.tBlock <== tBlock;
    
    for(var p = 0; p < nCount; p++) {
        claimExtract.in[p] <== payload[p];
    }
    
    for(var i = 0; i < 256; i++) {
        hash[i] <== sha256.out[i];
    }
    
    for(var i = 0; i < claimLength; i++) {
        claim[i] <== claimExtract.out[i];
    }
}

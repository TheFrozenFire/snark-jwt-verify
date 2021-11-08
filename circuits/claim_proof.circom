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
    assert(nWidth <= 512);
    assert(512 % nWidth == 0);
    
    // The number of payload segments, times the bit width of each is the bit length of the payload.
    // The payload is decomposed to 512-bit blocks for SHA-256
    var nBlocks = (nCount * nWidth) / 512;
    
    // How many segments are in each block
    var nSegments = 512 / nWidth;
    
    component sha256 = Sha256_unsafe(nBlocks);
    component sha256_blocks[nBlocks][nSegments];
    
    component claimExtract = Slice(nCount, claimLength);
    claimExtract.offset <== claimOffset;
    
    // For each 512-bit block going into SHA-256
    for(var b = 0; b < nBlocks; b++) {
        // For each segment going into that block
        for(var s = 0; s < nSegments; s++) {
            // The index from the payload is offset by the block we're composing times the number of segments per block,
            // s is then the segment offset within the block.
            var payloadIndex = (b * nSegments) + s;
            
            // Decompose each segment into an array of individual bits
            sha256_blocks[b][s] = Num2Bits(nWidth);
            sha256_blocks[b][s].in <== payload[payloadIndex];
            
            // The bit index going into the current SHA-256 block is offset by the segment number times the bit width
            // of each payload segment. sOffset + i is then the bit offset within the block (0-511). Num2Bits outputs
            // in left-hand LSB, so we reverse the ordering of the bits as they go into the SHA-256 circuit.
            var sOffset = s * nWidth;
            for(var i = 0; i < nWidth; i++) {
                sha256.in[b][sOffset + i] <== sha256_blocks[b][s].out[nWidth - i - 1];
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

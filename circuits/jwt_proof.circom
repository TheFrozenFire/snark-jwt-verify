pragma circom 2.0.0;

include "sha256.circom";
include "../circomlib/circuits/bitify.circom";

/*
JWT Proof
    Takes a payload segmented into inWidth chunks and calculates a SHA256 hash, for which an RSA signature is known,
    as well as masking the payload to obscure private fields.

    Construction Parameters:
    - inCount:          Number of payload inputs of inWidth size
    - inWidth:          Bit width of payload inputs

    Inputs:
    - payload[inCount]: Segments of payload as inWidth bit chunks
    - mask[inCount]:    Binary mask of payload segments
    - tBlock:          At which 512-bit block to select output hash
    
    Outputs:
    - hash:             SHA256 hash output truncated to 248 bits
    - masked[inCount]:  Masked payload
*/
template JwtProof(inCount, inWidth, outWidth, hashWidth) {
    // Segments must divide evenly into 512 bit blocks
    assert((inCount * inWidth) % 512 == 0);
    assert(inWidth <= 512);
    assert(512 % inWidth == 0);
    
    // Segments must divide evenly into outWidth output signals
    assert((inCount * inWidth) % outWidth == 0);
    assert(inWidth <= outWidth);
    assert(outWidth % inWidth == 0);
    
    var outCount = (inCount * inWidth) / outWidth;
    
    // The number of payload segments, times the bit width of each is the bit length of the payload.
    // The payload is decomposed to 512-bit blocks for SHA-256
    var nBlocks = (inCount * inWidth) / 512;
    
    // How many segments are in each block
    var nSegments = 512 / inWidth;
    
    signal input payload[inCount];
    signal input mask[inCount];
    signal input tBlock;
    
    signal output hash;
    signal output out[outCount];
    
    component sha256 = Sha256_unsafe(nBlocks);
    component sha256_blocks[nBlocks][nSegments];
    
    // For each 512-bit block going into SHA-256
    for(var b = 0; b < nBlocks; b++) {
        // For each segment going into that block
        for(var s = 0; s < nSegments; s++) {
            // The index from the payload is offset by the block we're composing times the number of segments per block,
            // s is then the segment offset within the block.
            var payloadIndex = (b * nSegments) + s;
            
            // Decompose each segment into an array of individual bits
            sha256_blocks[b][s] = Num2Bits(inWidth);
            sha256_blocks[b][s].in <== payload[payloadIndex];
            
            // The bit index going into the current SHA-256 block is offset by the segment number times the bit width
            // of each payload segment. sOffset + i is then the bit offset within the block (0-511). Num2Bits outputs
            // in left-hand LSB, so we reverse the ordering of the bits as they go into the SHA-256 circuit.
            var sOffset = s * inWidth;
            for(var i = 0; i < inWidth; i++) {
                sha256.in[b][sOffset + i] <== sha256_blocks[b][s].out[inWidth - i - 1];
            }
        }
    }
    sha256.tBlock <== tBlock;
    
    component hash_packer = Bits2Num(hashWidth);
    for(var i = 0; i < hashWidth; i++) {
        hash_packer.in[i] <== sha256.out[i + (256-hashWidth)];
    }
    hash <== hash_packer.out;
    
    component masked[inCount];
    for(var i = 0; i < inCount; i++) {
        masked[i] = Num2Bits(inWidth);
        masked[i].in <== payload[i] * mask[i];
    }
    
    component out_packer[outCount];
    for(var i = 0; i < outCount; i++) {
        out_packer[i] = Bits2Num(outWidth);
        
        for(var j = 0; j < outWidth; j++) {
            var oB = (i * outWidth) + j;
            var m = (oB - (oB % inWidth)) / inWidth;
            var mB = oB % inWidth;
            
            out_packer[i].in[j] <== masked[m].out[mB];
        }
        
        out[i] <== out_packer[i].out;
    }
}

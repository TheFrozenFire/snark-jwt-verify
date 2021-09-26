include "../circom-rsa-verify/circuits/rsa_verify.circom"
include "sha256.circom"

// https://tools.ietf.org/html/rfc7519
// A JWT's claims are valid if:
// * The JWS is signed by the provider's public modulus
// * The JWS is a signature of the SHA256 hash of the concatenated header and payload
// * The SHA256 hash of the concatenated header and payload matches
template JwtSignatureVerify(w, nb, e_bits, nBlocks) {
    signal input exp[nb];
    signal input sign[nb];
    signal input modulus[nb];
    
    signal input in[nBlocks][512];
    
    var i;
    var k;
    
    component sha256 = Sha256_unsafe(nBlocks);
    for(i=0; i<nBlocks; i++){
        for(k=0; k<512; k++) {
            sha256.in[i][k] <== in[i][k];
        }
    }
    
    component rsa_verify = RsaVerifyPkcs1v15(w, nb, e_bits, 256);
    rsa_verify.exp <== exp;
    rsa_verify.sign <== sign;
    rsa_verify.modulus <== modulus
    
    for(k=0; k<256; k++) {
        rsa_verify.hashed[k] <== sha256.out[k];
    }
}

const chai = require("chai");
const path = require("path");
const assert = chai.assert;
const crypto = require("crypto");
const jose = require("jose");
const {toBigIntBE} = require('bigint-buffer');

const tester = require("circom_tester").wasm;

const circuit = require("../js/circuit");
const utils = require("../js/utils");
const test = require("../js/test");

describe("JWT Proof", () => {
    const inCount = 384;
    const inWidth = 8;
    const outWidth = 128;
    const hashWidth = 248;
    
    const jwt = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InBldmpiYS1welhGU0ZDcnRTYlg5SyJ9.eyJpc3MiOiJodHRwczovL2Rldi05aDQ3YWpjOS51cy5hdXRoMC5jb20vIiwic3ViIjoidHdpdHRlcnwzMzc4MzQxMiIsImF1ZCI6IlQxNWU2NDZiNHVoQXJ5eW9qNEdOUm9uNnpzNE1ySEZWIiwiaWF0IjoxNjM5MTczMDI4LCJleHAiOjE2MzkyMDkwMjgsIm5vbmNlIjoiNDQwMTdhODkifQ.Vg2Vv-NJXdCqLy_JF4ecEsU_NgaA3DXbjwPfqr-euuXc-WPeyF00yRDP6_PVCx9p8PAU48fCMfNAKEFemPpY5Trn8paeweFk6uWZWGR42vo6BShryLFGRdce0MfTEBdZVsYnx-PDFz5aRFYxNnZL8sv2DUJ4NQM_8Zmz2EI7sSV7_kHCoXz7UHIOAtN8_otxCRwvrR3xAJ9P-Qp43HhUqM0fiC4RC3YkVKHRARcWC4bdVLBpKa1BBs4cd2wQ_tzv15YHPEyy4ODZGSX_M9cic-95TcpvVSuymw3bGj6_a7EPxcs6BzZGWlBwsh2ltB6FcLsDuAxxCPIG39tZ3Arp6Q';
    const input = jwt.split('.').slice(0,2).join('.');
    const signature = jwt.split('.')[2];
    const jwk = {
      "alg": "RS256",
      "kty": "RSA",
      "use": "sig",
      "n": "sR4EKsGJBJWzlQZfx-Az5IgyhWOo4deEY3PAadE9kjQcyxj5zcTSae4rB6YiOYtEzqjce-dXhpubxjS_olr0n0puCRN0m7u5Hhim029_f1gN2HQofcCRtJY4c6Vr5xkprmSSxk127tYKJ1X-86vzJLPR2p3VUkznTgskEP5bxvHVyj814NQLhdMmFAJOwu9Uuu2oGE4TB3IiZgSCY8gAdt4YfCXqFeLBWPO93JVwPdU4TN3wRMTwEz_by5ZV29jg8On2WBWEt6RL5BZEg_Mxy6OW_YM_csKvr8irJMTv8s4V-GizO2FUQCdURQyfCHyD95WyW2_u3PpxzC_lizeBZQ",
      "e": "AQAB",
      "kid": "pevjba-pzXFSFCrtSbX9K"
    };
    
    var cir;

    before(async() => {
        cir = await test.genMain(path.join(__dirname, "..", "circuits", "jwt_proof.circom"), "JwtProof", [inCount, inWidth, outWidth, hashWidth]);
        await cir.loadSymbols();
    });
    
    it("JWT masking", async() => {
        const mask = circuit.genJwtMask(input, ["sub", "nonce"]);
        
        const claims = input.split('').map((c, i) => mask[i] == 1 ? c : ' ').join('').split(/\s+/).filter(e => e !== '').map(e => Buffer.from(e, 'base64').toString());
        
        assert.include(claims[0], '"sub":"twitter|33783412"', "Does not contain sub claim");
        assert.include(claims[1], '"nonce":"44017a89"', "Does not contain nonce claim");
    });
    
    it("Extract from Base64 JSON", async () => {
        const hash = crypto.createHash("sha256").update(input).digest("hex").slice(0, hashWidth / 4);
        const pubkey = await jose.importJWK(jwk);
        
        var inputs = circuit.genJwtProofInputs(input, inCount, ["sub", "nonce"], inWidth);
        
        const witness = await cir.calculateWitness(inputs, true);
        
        const hash2 = utils.getWitnessValue(witness, cir.symbols, "main.hash").toString(16);
        const masked = utils.getWitnessBuffer(witness, cir.symbols, "main.out", varSize=outWidth).toString();
        const claims = masked.split(/\x00+/).filter(e => e !== '').map(e => Buffer.from(e, 'base64').toString());
        
        assert.equal(hash2, hash);
        assert.include(claims[0], '"sub":"twitter|33783412"', "Does not contain sub claim");
        assert.include(claims[1], '"nonce":"44017a89"', "Does not contain nonce claim");
        
        assert.isTrue(crypto.createVerify('RSA-SHA256').update(input).verify(pubkey, Buffer.from(signature, 'base64')), "Signature does not correspond to hash");
    });
});

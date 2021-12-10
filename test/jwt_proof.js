const chai = require("chai");
const path = require("path");
const assert = chai.assert;
const crypto = require("crypto");
const {toBigIntBE} = require('bigint-buffer');

const tester = require("circom_tester").wasm;

const circuit = require("../js/circuit");
const utils = require("../js/utils");
const test = require("../js/test");

describe("JWT Proof", () => {
    const nCount = 384;
    const nWidth = 8;
    
    const input = Buffer.from('{"alg":"RS256","typ":"JWT","kid":"pevjba-pzXFSFCrtSbX9K"}').toString('base64') + '.' + Buffer.from('{"sub": "1234567890","name":"John Doe","iat": 1516239022}').toString('base64');
    
    var cir;

    before(async() => {
        cir = await test.genMain(path.join(__dirname, "..", "circuits", "jwt_proof.circom"), "JwtProof", [nCount, nWidth]);
        await cir.loadSymbols();
    });
    
    it("JWT masking", async() => {
        const mask = circuit.genJwtMask(input, ["sub", "iat"]);
        
        const claims = input.split('').map((c, i) => mask[i] == 1 ? c : ' ').join('').split(/\s+/).filter(e => e !== '').map(e => Buffer.from(e, 'base64').toString());
        
        assert.include(claims[0], '"sub": "1234567890"', "Does not contain sub claim");
        assert.include(claims[1], '"iat": 1516239022', "Does not contain iat claim");
    });
    
    it("Extract from Base64 JSON", async () => {
        const hash = crypto.createHash("sha256").update(input).digest("hex");
        
        var inputs = circuit.genJwtProofInputs(input, nCount, ["sub", "iat"], nWidth);
        
        const witness = await cir.calculateWitness(inputs, true);
        
        const hash2 = utils.getWitnessBuffer(witness, cir.symbols, "main.hash").toString("hex");
        const masked = utils.getWitnessBuffer(witness, cir.symbols, "main.masked", varSize=8).toString();
        const claims = masked.split(/\x00+/).filter(e => e !== '').map(e => Buffer.from(e, 'base64').toString());
        
        assert.equal(hash2, hash);
        assert.include(claims[0], '"sub": "1234567890"', "Does not contain sub claim");
        assert.include(claims[1], '"iat": 1516239022', "Does not contain iat claim");
    });
});

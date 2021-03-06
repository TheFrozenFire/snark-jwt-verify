const chai = require("chai");
const path = require("path");
const assert = chai.assert;
const crypto = require("crypto");
const {toBigIntBE} = require('bigint-buffer');

const tester = require("circom_tester").wasm;

const circuit = require("../js/circuit");
const utils = require("../js/utils");
const test = require("../js/test");

describe("Claim Proof", () => {
    const nCount = 64;
    const nWidth = 16;
    const maxClaimLength = 12;
    
    const hexBytesToSegment = 16/8/2;
    const segmentsToBlock = 512/nWidth;

    var cir;

    before(async() => {
        cir = await test.genMain(path.join(__dirname, "..", "circuits", "claim_proof.circom"), "ClaimProof", [nCount, nWidth, maxClaimLength]);
        await cir.loadSymbols();
    });
    
    it("Num2Bits converts inputs to left-hand LSB", async () => {
        num2bits = await test.genMain(path.join(__dirname, "..", "circomlib", "circuits", "bitify.circom"), "Num2Bits", [16]);
        await num2bits.loadSymbols();
        
        input = crypto.randomBytes(2);
        
        const witness = await num2bits.calculateWitness({"in": "0x" + input.toString("hex") });
        const out = toBigIntBE(utils.bitArray2Buffer(utils.getWitnessArray(witness, num2bits.symbols, "main.out").reverse()));
        
        assert.equal(out, toBigIntBE(Buffer.from(input)));
    });
    
    it("Extract from JSON", async () => {
        const input = '{ "sub": "1234567890", "name": "John Doe", "iat": 1516239022 }';
        const hash = crypto.createHash("sha256").update(input).digest("hex");
        
        const fieldLength = utils.getJSONFieldLength(input, "sub");
        const claimLength = Math.ceil(fieldLength / (nWidth / 8));
        var inputs = circuit.genClaimProofInputs(input, nCount, "sub", claimLength, nWidth);
        const expectedClaim = '"sub": "1234567890",';
        
        const witness = await cir.calculateWitness(inputs, true);
        
        const hash2 = utils.getWitnessBuffer(witness, cir.symbols, "main.hash").toString("hex");
        const claim = utils.trimEndByChar(utils.bigIntArray2Buffer(utils.getWitnessArray(witness, cir.symbols, "main.claim")).toString(), '\u0000');
        
        assert.equal(hash2, hash);
        assert.equal(claim, expectedClaim);
    });
});

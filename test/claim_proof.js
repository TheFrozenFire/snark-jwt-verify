const chai = require("chai");
const path = require("path");
const assert = chai.assert;
const crypto = require("crypto");

const tester = require("circom_tester").wasm;

const utils = require("../js/utils");

describe("Claim Proof", () => {
    const nCount = 640;
    const nWidth = 16;
    const claimLength = 10;
    
    const hexBytesToSegment = 16/8/2;
    const segmentsToBlock = 512/nWidth;

    var cir;

    before(async() => {
        cir = await utils.genMain(path.join(__dirname, "..", "circuits", "claim_proof.circom"), "ClaimProof", [nCount, nWidth, claimLength]);
        await cir.loadSymbols();
    });
    
    it("Outputs correct hash", async () => {
        const input = crypto.randomBytes((nCount * hexBytesToSegment)-32).toString("hex");
        const hash = crypto.createHash("sha256").update(input).digest("hex");
        
        const inputs = Object.assign({},
            utils.genSha256Inputs(input, nCount, nWidth, "payload"),
            {"claimOffset": 1}
        );
        
        const witness = await cir.calculateWitness(inputs, true);
        
        const hash2 = utils.getWitnessBuffer(witness, cir.symbols, "main.hash").toString("hex");
        
        assert.equal(hash, hash2);
    });
});

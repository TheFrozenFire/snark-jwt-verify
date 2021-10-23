const chai = require("chai");
const path = require("path");
const assert = chai.assert;
const crypto = require("crypto");

const tester = require("circom_tester").wasm;

const utils = require("../js/utils");

describe("Claim Proof", () => {
    before(async() => {
        cir = await tester(path.join(__dirname, "circuits", "claim_proof.circom"));
        await cir.loadSymbols();
    });
    
    it("Something", async () => {
        
    });
});

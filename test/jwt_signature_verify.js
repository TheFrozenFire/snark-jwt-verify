const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const bigInt = require("big-integer");
const assert = chai.assert;

const tester = require("circom").tester;

const utils = require("../js/utils");

describe("JWT Signature Verify", () => {
    var cir;

    before(async () => {
        cir = await tester(path.join(__dirname, "circuits", "jwt_signature_verify.circom"));
        await cir.loadSymbols();
    });

    it("signature verify", () => {
        
    });
});

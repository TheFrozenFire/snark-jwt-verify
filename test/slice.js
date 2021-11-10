const chai = require("chai");
const path = require("path");
const assert = chai.assert;
const crypto = require("crypto");

const tester = require("circom_tester").wasm;

const utils = require("../js/utils");
const test = require("../js/test");

describe("Array Slice", () => {
    var cir;

    before(async() => {
        cir = await test.genMain(path.join(__dirname, "..", "circuits", "slice.circom"), "Slice", [6, 2]);
        await cir.loadSymbols();
    });
    
    it("Extracts correct value", async () => {
        input = [1,2,3,4,5,6];
        
        const witness = await cir.calculateWitness({ "in": input, "offset": 1 });
        
        assert.sameOrderedMembers(utils.getWitnessArray(witness, cir.symbols, "main.out"), [2n, 3n]);
    });
});

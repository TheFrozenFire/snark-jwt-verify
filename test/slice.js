const chai = require("chai");
const path = require("path");
const assert = chai.assert;
const crypto = require("crypto");

const tester = require("circom_tester").wasm;

const utils = require("../js/utils");
const test = require("../js/test");

describe("Array Slice", () => {
    var cir_fixed;
    var cir;

    before(async() => {
        cir_fixed = await test.genMain(path.join(__dirname, "..", "circuits", "slice.circom"), "SliceFixed", [6, 2]);
        await cir_fixed.loadSymbols();
    
        cir = await test.genMain(path.join(__dirname, "..", "circuits", "slice.circom"), "Slice", [10, 5]);
        await cir.loadSymbols();
    });
    
    it("Fixed circuit extracts correct value", async () => {
        input = [1,2,3,4,5,6];
        
        const witness = await cir_fixed.calculateWitness({ "in": input, "offset": 1 });
        
        assert.sameOrderedMembers(utils.getWitnessArray(witness, cir_fixed.symbols, "main.out"), [2n, 3n]);
    });
    
    it("Non-fixed circuit extracts correct, masked value", async () => {
        input = [1,2,3,4,5,6,7,8,9,10];
        
        const witness = await cir.calculateWitness({ "in": input, "offset": 1, "length": 2 });
        
        assert.sameOrderedMembers(utils.getWitnessArray(witness, cir.symbols, "main.out"), [2n, 3n, 0n, 0n, 0n]);
    });
});

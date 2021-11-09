const chai = require("chai");
const assert = chai.assert;
const crypto = require("crypto");

const circuit = require("../js/circuit");
const utils = require("../js/utils");

describe("Circuit Utilities", () => {
    it("Buffer to/from bit array works as expected", async () => {
        const input = crypto.randomBytes(20*32).toString("hex");
        
        const bits = utils.buffer2BitArray(Buffer.from(input));
        const buffer = utils.bitArray2Buffer(bits);
        
        assert.equal(input, buffer.toString());
    });
    
    it("rfc4634#4.1 padding conforms: L % 512 = 0", async () => {
        const input = crypto.randomBytes(512/8/2).toString("hex");
        
        const bits = utils.buffer2BitArray(Buffer.from(input));
        const padded = circuit.padMessage(bits);
        
        assert.equal(bits.length, 512);
        assert.equal(padded.length, 1024); // Padding a 448+-bit message requires an additional block
        assert.equal(1, padded.slice(-512, -511)); // Padding begins with 1
        assert.equal(bits.length, parseInt(padded.slice(-64).join(''), 2)); // base2(L)
    });
    
    it("rfc4634#4.1 padding conforms: L % 512 = 65", async () => {
        const input = crypto.randomBytes(512/8/2).toString("hex");
        
        const bits = utils.buffer2BitArray(Buffer.from(input)).slice(0, 447);
        const padded = circuit.padMessage(bits);
        
        assert.equal(bits.length, 447);
        assert.equal(padded.length, 512);
        assert.equal(1, padded.slice(-65, -64)); // Padding begins with 1
        assert.equal(bits.length, parseInt(padded.slice(-64).join(''), 2));
    });
    
    it("rfc4634#4.1 padding conforms: L % 512 = 100", async () => {
        const input = crypto.randomBytes(512/8/2).toString("hex");
        
        const bits = utils.buffer2BitArray(Buffer.from(input)).slice(0, 412);
        const padded = circuit.padMessage(bits);
        
        assert.equal(bits.length, 412);
        assert.equal(padded.length, 512);
        assert.equal(1, padded.slice(-100, -99)); // Padding begins with 1
        assert.equal(bits.length, parseInt(padded.slice(-64).join(''), 2));
    });
});

const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const assert = chai.assert;
const crypto = require("crypto");
const jose = require("node-jose");

const tester = require("circom").tester;

function buffer2bitArray(b) {
    const res = [];
    for (let i=0; i<b.length; i++) {
        for (let j=0; j<8; j++) {
            res.push((b[i] >> (7-j) &1));
        }
    }
    return res;
}

function bitArray2buffer(a) {
    const len = Math.floor((a.length -1 )/8)+1;
    const b = new Buffer.alloc(len);

    for (let i=0; i<a.length; i++) {
        const p = Math.floor(i/8);
        b[p] = b[p] | (Number(a[i]) << ( 7 - (i%8)  ));
    }
    return b;
}

// https://datatracker.ietf.org/doc/html/rfc4634#section-4.1
function padMessage(bits) {
    const length = bits.length;
    const padLen = 512 - (length % 512);
    if(padLen == 0 || padLen == 512) {
        return bits;
    }
    
    bits = bits.concat([1]);
    bits = bits.concat(Array(padLen - 65).fill(0));
    bits = bits.concat(buffer2bitArray(Buffer.from(length.toString(16).padStart(16, '0'), 'hex')))
    
    return bits;
}

function array_chunk(array, chunk_size) {
    return Array(Math.ceil(array.length / chunk_size)).fill().map((_, index) => index * chunk_size).map(begin => array.slice(begin, begin + chunk_size));
}

function genBlocks(input, nBlocks) {
    const blocks = array_chunk(padMessage(buffer2bitArray(input)), 512);
    return [blocks.concat(Array(nBlocks-blocks.length).fill(Array(512).fill(0))), blocks.length];
}

describe("Unsafe SHA256", () => {
    const nBlocks = 20;
    const hexBytesToBlock = 512/2/8;
    var cir;
    
    before(async() => {
        cir = await tester(path.join(__dirname, "circuits", "sha256.circom"));
    });

    it("Hashing produces expected output for filled blocks", async () => {
        const input = crypto.randomBytes(nBlocks * hexBytesToBlock).toString("hex");
        const hash = crypto.createHash("sha256").update(input).digest("hex");

        const [blocks, tBlock] = genBlocks(input, nBlocks);
        
        const witness = await cir.calculateWitness({ "in": blocks, "tBlock": tBlock }, true);
        
        const hash2 = bitArray2buffer(witness.slice(1,257)).toString("hex");
        
        assert.equal(hash, hash2);
    });
    
    it("Hashing produces expected output for partial last block", async () => {
        const input = crypto.randomBytes((nBlocks * hexBytesToBlock)-32).toString("hex");
        const hash = crypto.createHash("sha256").update(input).digest("hex");

        const [blocks, tBlock] = genBlocks(input, nBlocks);
        
        const witness = await cir.calculateWitness({ "in": blocks, "tBlock": tBlock }, true);
        
        const hash2 = bitArray2buffer(witness.slice(1,257)).toString("hex");
        
        assert.equal(hash, hash2);
    });
    
    it("Hashing produces expected output for less than nBlocks blocks", async () => {
        const input = crypto.randomBytes((nBlocks-8) * hexBytesToBlock).toString("hex");
        const hash = crypto.createHash("sha256").update(input).digest("hex");

        const [blocks, tBlock] = genBlocks(input, nBlocks);
        
        const witness = await cir.calculateWitness({ "in": blocks, "tBlock": tBlock }, true);
        
        const hash2 = bitArray2buffer(witness.slice(1,257)).toString("hex");
        
        assert.equal(hash, hash2);
    });
});

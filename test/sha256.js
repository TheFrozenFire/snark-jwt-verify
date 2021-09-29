const chai = require("chai");
const path = require("path");
const snarkjs = require("snarkjs");
const assert = chai.assert;
const crypto = require("crypto");
const jose = require("node-jose");
const fs = require('fs');

const tester = require("circom").tester;

const utils = require("../js/utils");

describe("Unsafe SHA256", () => {
    const nBlocks = 20;
    const hexBytesToBlock = 512/8/2;
    var cir;
    
    before(async() => {
        cir = await tester(path.join(__dirname, "circuits", "sha256.circom"));
        cir.loadSymbols();
    });

    it("Hashing produces expected output for filled blocks", async () => {
        const input = crypto.randomBytes((nBlocks * hexBytesToBlock)-100).toString("hex");
        const hash = crypto.createHash("sha256").update(input).digest("hex");

        const inputs = utils.genInputs(input, nBlocks);
        
        const witness = await cir.calculateWitness(inputs, true);
        
        const hash2 = utils.getWitnessBuffer(witness, cir.symbols, "main.out").toString("hex");
        
        assert.equal(hash, hash2);
    });
    
    it("Hashing produces expected output for partial last block", async () => {
        const input = crypto.randomBytes((nBlocks * hexBytesToBlock)-100).toString("hex");
        const hash = crypto.createHash("sha256").update(input).digest("hex");

        const inputs = utils.genInputs(input, nBlocks);
        
        const witness = await cir.calculateWitness(inputs, true);
        
        const hash2 = utils.getWitnessBuffer(witness, cir.symbols, "main.out").toString("hex");
        
        assert.equal(hash, hash2);
    });
    
    it("Hashing produces expected output for less than nBlocks blocks", async () => {
        const input = crypto.randomBytes((nBlocks-8) * hexBytesToBlock).toString("hex");
        const hash = crypto.createHash("sha256").update(input).digest("hex");

        const inputs = utils.genInputs(input, nBlocks);
        
        const witness = await cir.calculateWitness(inputs, true);
        
        const hash2 = utils.getWitnessBuffer(witness, cir.symbols, "main.out").toString("hex");
        
        assert.equal(hash, hash2);
    });
});

/*
it("Hashing produces expected output", async () => {
        var nBlocks = 20;

        const input = Buffer.from('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InBldmpiYS1welhGU0ZDcnRTYlg5SyJ9.eyJnaXZlbl9uYW1lIjoiSnVzdGluIiwiZmFtaWx5X25hbWUiOiJNYXJ0aW4iLCJuaWNrbmFtZSI6ImZyb3plbmZpcmUiLCJuYW1lIjoiSnVzdGluIE1hcnRpbiIsInBpY3R1cmUiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS0vQU9oMTRHaFEwRGdQQUt6bTVIOEdqemMyTkd5X3RRWGExWnUzaHQtZ1B3N2g4dz1zOTYtYyIsImdlbmRlciI6Im1hbGUiLCJsb2NhbGUiOiJlbi1HQiIsInVwZGF0ZWRfYXQiOiIyMDIxLTA5LTIzVDIwOjQ2OjIyLjQ3MVoiLCJlbWFpbCI6ImZyb3plbmZpcmVAdGhlZnJvemVuZmlyZS5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9kZXYtOWg0N2FqYzkudXMuYXV0aDAuY29tLyIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTEwNDA3OTYxOTUzNzMyMzcxOTg4IiwiYXVkIjoiVDE1ZTY0NmI0dWhBcnl5b2o0R05Sb242enM0TXJIRlYiLCJpYXQiOjE2MzI0Mjk5ODMsImV4cCI6MTYzMjQ2NTk4Mywibm9uY2UiOiJ0ZXN0aWZ5In0');

        var blocks = array_chunk(padMessage(buffer2bitArray(input)), 512);
        
        const witness = await cir.calculateWitness({ "in": blocks.concat(Array(nBlocks-blocks.length).fill(Array(512).fill(0))), "tBlock": blocks.length }, true);
        
        const arrOut = witness.slice(1,257);
        const hash2 = bitArray2buffer(arrOut).toString("hex");
        
        console.log(hash2);
    });*/

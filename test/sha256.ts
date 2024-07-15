import { assert } from "chai";

import { Witness, SymbolReader } from "@frozenfire/circom-witness"
import { Config } from "@frozenfire/snark-jwt-verify"
import fs from "fs"

describe("Unsafe SHA256", () => {
    const config = new Config(JSON.parse(fs.readFileSync("config.json").toString('utf-8')))
    const constants = config.constants()

    const nBlocks = 20;
    const hexBytesToBlock = 512/8/2;
    const cir = config.buildEphemeral("sha256.circom", "Sha256_unsafe", [20]);

    let calculator
    
    before(async() => {
        const {command: cir_command} = await cir.compile()

        calculator = new Witness(
            fs.readFileSync(cir_command.paths.wasm),
            (new SymbolReader(fs.readFileSync(cir_command.paths.sym).toString()).readSymbolMap())
        )
    });

    it("Hashing produces expected output for filled blocks", async () => {
        const input = crypto.randomBytes((nBlocks * hexBytesToBlock)-32).toString("hex");
        const hash = crypto.createHash("sha256").update(input).digest("hex");

        const inputs = circuit.genSha256Inputs(input, nBlocks);
        
        const witness = await cir.calculateWitness(inputs, true);
        
        const hash2 = utils.getWitnessBuffer(witness, cir.symbols, "main.out").toString("hex");
        
        assert.equal(hash2, hash);
    });
    
    it("Hashing produces expected output for partial last block", async () => {
        const input = crypto.randomBytes((nBlocks * hexBytesToBlock)-100).toString("hex");
        const hash = crypto.createHash("sha256").update(input).digest("hex");

        const inputs = circuit.genSha256Inputs(input, nBlocks);
        
        const witness = await cir.calculateWitness(inputs, true);
        
        const hash2 = utils.getWitnessBuffer(witness, cir.symbols, "main.out").toString("hex");
        
        assert.equal(hash2, hash);
    });
    
    it("Hashing produces expected output for less than nBlocks blocks", async () => {
        const input = crypto.randomBytes((nBlocks-8) * hexBytesToBlock).toString("hex");
        const hash = crypto.createHash("sha256").update(input).digest("hex");

        const inputs = circuit.genSha256Inputs(input, nBlocks);
        
        const witness = await cir.calculateWitness(inputs, true);
        
        const hash2 = utils.getWitnessBuffer(witness, cir.symbols, "main.out").toString("hex");
        
        assert.equal(hash2, hash);
    });
});



const bigInt = require("big-integer");
const temp = require("temp");
const path = require("path");
const fs = require("fs");
const circom_wasm = require("circom_tester").wasm;

const chai = require("chai");
const assert = chai.assert;

var tmp = require("tmp-promise");

const util = require("util");
const exec = util.promisify(require("child_process").exec);

const loadR1cs = require("r1csfile").load;
const ZqField = require("ffjavascript").ZqField;

function buffer2BitArray(b) {
    return [].concat(...Array.from(b.entries()).map(([index, byte]) => byte.toString(2).padStart(8, '0').split('').map(bit => bit == '1' ? 1 : 0) ))
}

function bitArray2Buffer(a) {
    return Buffer.from(arrayChunk(a, 8).map(byte => parseInt(byte.join(''), 2)))
}

// https://datatracker.ietf.org/doc/html/rfc4634#section-4.1
function padMessage(bits) {
    const L = bits.length;
    const K = (512 + 448 - (L % 512 + 1)) % 512;

    bits = bits.concat([1]);
    if(K > 0) {
        bits = bits.concat(Array(K).fill(0));
    }
    bits = bits.concat(buffer2BitArray(Buffer.from(L.toString(16).padStart(16, '0'), 'hex')))
    
    return bits;
}

function arrayChunk(array, chunk_size) {
    return Array(Math.ceil(array.length / chunk_size)).fill().map((_, index) => index * chunk_size).map(begin => array.slice(begin, begin + chunk_size));
}

function genSha256Inputs(input, nCount, nWidth = 512, inParam = "in") {
    var segments = arrayChunk(padMessage(buffer2BitArray(Buffer.from(input))), nWidth);
    const tBlock = segments.length / (512 / nWidth);
    
    if(segments.length < nCount) {
        segments = segments.concat(Array(nCount-segments.length).fill(Array(nWidth).fill(0)));
    }
    
    if(segments.length > nCount) {
        throw new Error('Padded message exceeds maximum blocks supported by circuit');
    }
    
    return { [inParam]: segments, "tBlock": tBlock }; 
}

function getWitnessBuffer(witness, symbols, arrName) {
    return bitArray2Buffer(Object.entries(symbols).filter(([index, symbol]) => index.startsWith(arrName)).map(([index, symbol]) => witness[symbol['varIdx']] ));
}

function splitToWords(x, w, n, name) {
    let t = bigInt(x);
    w = bigInt(w);
    n = bigInt(n);
    const words = {};
    for (let i = 0; i < n; ++i) {
        words[`${name}[${i}]`] = `${t.mod(bigInt(2).pow(w))}`;
        t = t.divide(bigInt(2).pow(w));
    }
    if (!t.isZero()) {
        throw `Number ${x} does not fit in ${w * n} bits`;
    }
    return words;
}

async function genMain(template_file, template_name, params = [], tester = circom_wasm) {
    temp.track();
    
    const temp_circuit = await temp.open({prefix: template_name, suffix: ".circom"});
    const include_path = path.relative(temp_circuit.path, template_file);
    const params_string = JSON.stringify(params).slice(1, -1);
    
    fs.writeSync(temp_circuit.fd, `
pragma circom 2.0.0;

include "${include_path}";

component main = ${template_name}(${params_string});
    `);
    
    return circom_wasm(temp_circuit.path);
}

module.exports = {
    buffer2BitArray: buffer2BitArray,
    bitArray2Buffer: bitArray2Buffer,
    padMessage: padMessage,
    arrayChunk: arrayChunk,
    genSha256Inputs: genSha256Inputs,
    genMain: genMain,
    getWitnessBuffer: getWitnessBuffer,
}

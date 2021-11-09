const bigInt = require("big-integer");
const temp = require("temp");
const path = require("path");
const fs = require("fs");
const circom_wasm = require("circom_tester").wasm;

const chai = require("chai");
const assert = chai.assert;

function arrayChunk(array, chunk_size) {
    return Array(Math.ceil(array.length / chunk_size)).fill().map((_, index) => index * chunk_size).map(begin => array.slice(begin, begin + chunk_size));
}

function buffer2BitArray(b) {
    return [].concat(...Array.from(b.entries()).map(([index, byte]) => byte.toString(2).padStart(8, '0').split('').map(bit => bit == '1' ? 1 : 0) ))
}

function bitArray2Buffer(a) {
    return Buffer.from(arrayChunk(a, 8).map(byte => parseInt(byte.join(''), 2)))
}

function bigIntArray2Bits(arr, intSize=16) {
    return [].concat(...arr.map(n => n.toString(2).padStart(intSize, '0').split(''))).map(bit => bit == '1' ? 1 : 0);
}

function bigIntArray2String(arr, intSize=16) {
    return bitArray2Buffer(bigIntArray2Bits(arr, intSize)).toString();
}

function getWitnessValue(witness, symbols, varName) {
    return witness[symbols[varName]['varIdx']];
}

function getWitnessMap(witness, symbols, arrName) {
    return Object.entries(symbols).filter(([index, symbol]) => index.startsWith(arrName)).map(([index, symbol]) => Object.assign({}, symbol, { "name": index, "value": witness[symbol['varIdx']] }) );
}

function getWitnessArray(witness, symbols, arrName) {
    return Object.entries(symbols).filter(([index, symbol]) => index.startsWith(`${arrName}[`)).map(([index, symbol]) => witness[symbol['varIdx']] );
}

function getWitnessBuffer(witness, symbols, arrName) {
    return bitArray2Buffer(getWitnessArray(witness, symbols, arrName));
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
    arrayChunk: arrayChunk,
    buffer2BitArray: buffer2BitArray,
    bitArray2Buffer: bitArray2Buffer,
    bigIntArray2Bits: bigIntArray2Bits,
    bigIntArray2String: bigIntArray2String,
    getWitnessValue: getWitnessValue,
    getWitnessMap: getWitnessMap,
    getWitnessArray: getWitnessArray,
    getWitnessBuffer: getWitnessBuffer,
    genMain: genMain,
}

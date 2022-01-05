function arrayChunk(array, chunk_size) {
    return Array(Math.ceil(array.length / chunk_size)).fill().map((_, index) => index * chunk_size).map(begin => array.slice(begin, begin + chunk_size));
}

function trimEndByChar(string, character) {
  const arr = Array.from(string);
  const last = arr.reverse().findIndex(char => char !== character);
  return string.substring(0, string.length - last);
}

function getJSONFieldLength(input, field) {
    const json_input = JSON.parse(input);
    const fieldNameLength = input.match(new RegExp(`"${field}"\\:\\s*`))[0].length;
    const fieldValueLength = JSON.stringify(json_input[field]).length;
    
    return fieldNameLength + fieldValueLength;
}

function getBase64JSONSlice(input, field) {
    const decoded = Buffer.from(input, 'base64').toString();
    const fieldStart = decoded.indexOf(`"${field}"`);
    const lead = trimEndByChar(Buffer.from(decoded.slice(0, fieldStart)).toString('base64'), '=');
    const fieldLength = getJSONFieldLength(decoded, field);
    const target = trimEndByChar(Buffer.from(decoded.slice(fieldStart, fieldStart + fieldLength)).toString('base64'), '=');
    
    const start = Math.floor(lead.length / 4) * 4;
    const end = Math.ceil(((lead.length + target.length) - 1) / 4) * 4;
    
    return [start, end >= input.length ? input.length - 1 : end - 1];
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

function bigIntArray2Buffer(arr, intSize=16) {
    return bitArray2Buffer(bigIntArray2Bits(arr, intSize));
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

function getWitnessBuffer(witness, symbols, arrName, varSize=1) {
    const witnessArray = getWitnessArray(witness, symbols, arrName);
    if(varSize == 1) {
        return bitArray2Buffer(witnessArray);
    } else {
        return bigIntArray2Buffer(witnessArray, varSize);
    }
}

module.exports = {
    arrayChunk: arrayChunk,
    trimEndByChar: trimEndByChar,
    getJSONFieldLength: getJSONFieldLength,
    getBase64JSONSlice: getBase64JSONSlice,
    buffer2BitArray: buffer2BitArray,
    bitArray2Buffer: bitArray2Buffer,
    bigIntArray2Bits: bigIntArray2Bits,
    bigIntArray2Buffer: bigIntArray2Buffer,
    getWitnessValue: getWitnessValue,
    getWitnessMap: getWitnessMap,
    getWitnessArray: getWitnessArray,
    getWitnessBuffer: getWitnessBuffer,
}

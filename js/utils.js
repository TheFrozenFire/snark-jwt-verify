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

function genInputs(input, nBlocks) {
    var blocks = arrayChunk(padMessage(buffer2bitArray(Buffer.from(input))), 512);
    if(blocks.length < nBlocks) {
        blocks = blocks.concat(Array(nBlocks-blocks.length).fill(Array(512).fill(0)))
    }
    
    if(blocks.length > nBlocks) {
        throw new Error('Padded message exceeds maximum blocks supported by circuit');
    }
    
    return { "in": blocks , "tBlock": blocks.length };
}

function getWitnessBuffer(witness, symbols, arrName) {
    return bitArray2buffer(Object.entries(symbols).filter(([index, symbol]) => index.startsWith(arrName)).map(([index, symbol]) => witness[symbol['varIdx']] ));
}

module.exports = {
    buffer2BitArray: buffer2BitArray,
    bitArray2Buffer: bitArray2Buffer,
    padMessage: padMessage,
    arrayChunk: arrayChunk,
    genInputs: genInputs,
    getWitnessBuffer: getWitnessBuffer,
}

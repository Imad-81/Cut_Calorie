const convert = require('heic-convert');
console.log('Type of convert:', typeof convert);
console.log('Keys of convert:', Object.keys(convert));
if (typeof convert === 'function') {
    console.log('convert is a function');
} else if (convert.default && typeof convert.default === 'function') {
    console.log('convert.default is a function');
}

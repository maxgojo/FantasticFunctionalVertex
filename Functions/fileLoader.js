const { glob } = require("glob");
const { promisify } = require("util");
const proGlob = promisify(glob);

async function loadFiles(dirName){

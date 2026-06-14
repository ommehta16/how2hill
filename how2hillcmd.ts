import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
const rl = readline.createInterface({input:stdin, output:stdout});
import {createMats, encipher, decipher} from "./src/cipher.ts";

async function main() {
	let {n,pass} = await getInps();
	let mats=null;
	try {
		mats = createMats(n,pass);
	} catch {
		while (!mats) {
			console.log("That combination of `n` and password doesn't work for a hill cipher (matrix is non-invertible). Try again.");
			
			const inps= await getInps();
			try{ mats = createMats(inps.n,inps.pass); }
			catch {}
		}
	}

	const {A,B} = mats;

	const text = await rl.question("What text to encrypt? ");
	const out = encipher(text, A);
	console.log(out);
	console.log(`Deciphered: ${decipher(out,B)}`);
	process.exit(0);
}

async function getInps() {
	let firstLine = await rl.question("How big should the matrix be? ");
	while (!Number.isInteger(+firstLine) || +firstLine <= 0) {
		firstLine = await rl.question("That's not a positive integer! How big should the matrix be? ");
	}
	const n = +firstLine;
	const pass = await rl.question("What should the \"Password\" be? (this determines your cipher key)");

	return { n:n, pass:pass }
}

main();
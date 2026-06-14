// @ts-expect-error - invmod exists in runtime but doesn't have type in .d.ts
import {det, gcd, inv, Matrix, matrix, multiply, invmod, mod} from "mathjs";

export function createMats(n:number, pass:string, MOD:number=26) {
	// n x n matrix
	const A:Matrix = passToKey(n,pass);

	// check if `mat` is invertible
	const determinant = det(A);
	if (determinant == 0) throw new Error("Matrix not invertible");
	if (gcd(determinant, MOD) != 1) throw new Error("Matrix determinant not mod invertible");
	
	const modinv_of_det = invmod(determinant,MOD);
	console.log(determinant*modinv_of_det);
	const B:Matrix = multiply(inv(A), modinv_of_det * determinant).map(a=>mod(Math.round(a),MOD));

	const identity = multiply(A,B).map(a=>a%MOD);
	console.log(identity);

	return { A: A, B: B };
}

function passToKey(n:number, pass:string):Matrix {
	if (!Number.isInteger(n) || n<=0) throw new TypeError(`Size passed in not a positive integer (n = ${n})`);

	const mat:number[][] = [];
	let extendedPass = "";
	while (extendedPass.length < n*n) extendedPass += pass;

	for (let i=0;i<n;i++) mat[i] = [];
	for (let i=0;i<n*n;i++) {
		mat[Math.floor(i/n)][i%n] = charToNumber(extendedPass.charAt(i));
	}

	return matrix(mat);
}

function charToNumber(c:string) {
	if (c.length != 1) throw new TypeError(`c must be one character, is ${c}`);
	return c.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
}

function numberToChar(c:number) {
	return String.fromCharCode('a'.charCodeAt(0)+c);
}

export function encipher(text:string, mat:Matrix,MOD:number=26):string {
	if (text.length == 0) return "";
	const n = mat.size()[0];
	
	// chunk into size `n`
	let chunks = [];

	for (let i=0;i<Math.ceil(text.length/n);i++) 
		chunks.push(text.substring(i*n,Math.min(i*n+n,text.length)));
	
	while (chunks[chunks.length-1].length != n) 
		chunks[chunks.length-1] += " ";
	// Just keep postpending spaces to it lol
	// spaces highkey never unencrypt but ummm
	// probs fine

	let out = "";
	for (const chunk of chunks) {
		const numVals = [...chunk].map(c => charToNumber(c));

		const outChunk = multiply(mat, numVals).map(a => mod(a,MOD));
		const outText = outChunk.map(num => numberToChar(num)).toArray().join("");
		out += outText;
	}

	return out;
}

/** One of the great things about hill ciphers is that their deciphering and enciphering are the SAME process! */
export function decipher(text:string, mat:Matrix,MOD?:number):string {
	return encipher(text,mat,MOD);
}
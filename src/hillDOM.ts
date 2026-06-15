import "./hill";
import { chunkToVector, createMats, encipher, encipherToVec, passToChunks, toChunks } from "./hill";
import { Matrix } from "mathjs";

const N = 2;

const hillState:{
	keyString: string,
	keyChunks: number[],
	hillMat:Matrix|null,
	plaintext: string,
	chunks: string[],
	ciphertext:string,
} = {
	keyString:"",
	keyChunks:[],
	hillMat:null,
	plaintext: "",
	chunks: [],
	ciphertext:""
}

// Grab all change source elements
function setupStepOne() {
	const step1 = document.querySelector("#step-1");
	if (!step1) throw new Error("wtf?");

	const keyInput:HTMLInputElement|null = step1.querySelector("input.text-key");

	// Grab all change result elements
	const keyStart = step1.querySelector("span.key-start");
	const keyNums = step1.querySelector("code.key-nums");
	const matTable:HTMLTableElement|null = step1.querySelector("table.matrix");
	const matCheck = step1.querySelector("code.checks");
	if (!keyStart || !keyInput || !keyNums || !matTable || !matCheck) throw new Error("Malformed HTML, cannot continue");

	keyInput.addEventListener("input",() => {
		hillState.keyString = keyInput.value.replaceAll(/[^a-zA-Z]/g,"").substring(0,4);
		hillState.keyChunks = passToChunks(N,hillState.keyString);
		try{
			hillState.hillMat = createMats(N,hillState.keyString).A;
			console.log(hillState.hillMat);
		} catch {
			hillState.hillMat = null;
		}
		updateKeyStart(keyStart);
		updateKeyNums(keyNums);
		updateVisualMatrix(matTable);
		updateMatrixCheck(matCheck);
	});

	updateKeyStart(keyStart);
	updateKeyNums(keyNums);
	updateVisualMatrix(matTable);
	updateMatrixCheck(matCheck);
}

function updateKeyStart(keyStart:Element) {
	keyStart.innerHTML = `"${hillState.keyString}"`;
}

function updateKeyNums(keyNums:Element) {
	keyNums.innerHTML = `[ ${hillState.keyChunks.join(" ")} ]`;
}

function updateVisualMatrix(matTable:HTMLTableElement) {
	const chunks = hillState.keyChunks;
	const out = `
	<tr><td>${chunks[0]?.toString() || ""}</td><td>${chunks[1]?.toString() || ""}</td></tr>
	<tr><td>${chunks[2]?.toString() || ""}</td><td>${chunks[3]?.toString() || ""}</td></tr>
	`
	matTable.innerHTML = out;
}

function updateMatrixCheck(matCheck:Element) {
	if (!hillState.hillMat) {
		matCheck.innerHTML = "Invalid";
		matCheck.classList.remove("good");
	}
	else {
		matCheck.innerHTML="Good";
		matCheck.classList.add("good");
	}
}

setupStepOne();

function setupStepTwo() {
	const step2 = document.querySelector("#step-2");
	if (!step2) throw new Error("wtf?");

	const step1Inp:HTMLInputElement|null = document.querySelector("#step-1 input.text-key");
	const plaintextInp:HTMLInputElement|null = step2.querySelector("input.plaintext");

	const matTable:HTMLTableElement|null = step2.querySelector("table.matrix");
	const twoErrorContainer:HTMLDivElement|null = step2.querySelector("div.step2error");
	const chunksContainer:Element|null = step2.querySelector("code.chunks");
	const inVectorsContainer:Element|null = step2.querySelector("code.in-vectors");
	const outVectorsContainer:Element|null = step2.querySelector("code.out-vectors");
	const plainTextContainer:Element|null = document.querySelector("#step-2-5 code.plaintext-copy");
	const cipherTextContainer:Element|null = document.querySelector("#step-2-5 code.ciphertext");

	if (!step1Inp || !matTable || !twoErrorContainer || !plaintextInp || !chunksContainer || !inVectorsContainer || !outVectorsContainer || !plainTextContainer || !cipherTextContainer) throw new Error("Malformed HTML");
	console.log("hello?");

	step1Inp.addEventListener("input",() => { setTimeout(()=>{
		updateMatrix(matTable,hillState.hillMat);
		updateStep2Error(twoErrorContainer);
	},10); });

	plaintextInp.addEventListener("input", () => {
		hillState.plaintext = plaintextInp.value.replaceAll(/[^a-zA-Z]/g,"");
		hillState.chunks = toChunks(hillState.plaintext, N);
		hillState.hillMat ? hillState.ciphertext = encipher(hillState.plaintext,hillState.hillMat) : "";
		updateChunks(chunksContainer);
		updateInVectors(inVectorsContainer);
		updateOutVectors(outVectorsContainer);
		updateTwo5(plainTextContainer,cipherTextContainer);
	})
	
	updateMatrix(matTable,hillState.hillMat);
	updateStep2Error(twoErrorContainer);
	updateChunks(chunksContainer);
	updateInVectors(inVectorsContainer);
	updateOutVectors(outVectorsContainer);
	updateTwo5(plainTextContainer,cipherTextContainer);
}

function updateMatrix(matTable:HTMLTableElement,matrix:Matrix|null) {
	if (!matrix) {
		matTable.innerHTML = `<tr><td></td><td></td></tr>
							<tr><td></td><td></td></tr>`
		return;
	}

	matTable.innerHTML = `
	<tr><td>${matrix.get([0,0])}</td><td>${matrix.get([0,1])}</td></tr>
	<tr><td>${matrix.get([1,0])}</td><td>${matrix.get([1,1])}</td></tr>
	`;
}

function updateStep2Error(twoError:HTMLDivElement) {
	if (!hillState.hillMat) twoError.innerHTML = `<div class="twoa-error error">Before we encipher, we need a <b>valid</b> matrix <code>A</code> to do the enciphering! Go back to <a href="#step-1">step 1</a>, fix your matrix, then come back.</div>`;
	else twoError.innerHTML = ``;
}

function updateChunks(chunksContainer:Element) {
	const chunks = toChunks(hillState.plaintext, N);
	chunksContainer.innerHTML = `[ ${chunks.join(" ")} ]`;
}

function updateInVectors(inVectorsContainer:Element) {
	const chunks = hillState.chunks;
	const vecs = chunks.map(chunkToVector).map(el=>`[ ${el.join(" ")} ]`);
	inVectorsContainer.innerHTML = `[ ${vecs.join(", ")} ]`;
}

function updateOutVectors(outVectorsContainer:Element) {
	if (!hillState.hillMat) {
		outVectorsContainer.innerHTML='';
		return;
	}
	const vecs = encipherToVec(hillState.plaintext,hillState.hillMat).map(el=>`[ ${el.join(" ")} ]`);
	outVectorsContainer.innerHTML = `[ ${vecs.join(", ")} ]`;
}

function updateTwo5(plaintextContainer:Element, cipherTextContainer:Element) {
	plaintextContainer.innerHTML=hillState.plaintext;
	cipherTextContainer.innerHTML=hillState.ciphertext;
}

setupStepTwo();
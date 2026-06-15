import "./hill";
import { createMats, passToChunks, passToKey } from "./hill";
import { Matrix } from "mathjs";


const hillState:{
	keyString: string,
	keyChunks: number[],
	hillMat:Matrix|null
} = {
	keyString:"",
	keyChunks:[],
	hillMat:null
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
	const N = 2;
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
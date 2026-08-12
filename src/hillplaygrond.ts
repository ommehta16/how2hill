import "./playground.css";
import { createMats, decipher, encipher, passToKey, setMapping } from "./hill";
import { Matrix } from "mathjs";

type Refs = {
	keyInput: HTMLInputElement,
	sizeInput: HTMLInputElement,
	plaintextInput: HTMLTextAreaElement,
	encryptMatTable: HTMLTableElement,
	decryptMatTable: HTMLTableElement,
	cipherTextInput: HTMLTextAreaElement,
	decryptedText: HTMLParagraphElement,
	textSetInput: HTMLSelectElement,
	matStatus: HTMLDivElement
}

const refs:Partial<Refs> = {};

type State = {
	secretKey:string,
	size:number|null,
	plaintext:string,
	encryptMatrix:Matrix|null,
	decryptMatrix:Matrix|null,
	ciphertext:string,
	decrypted:string,
	charToNumber:((val:string)=>string)|null,
	mod:number,
	matsGood:boolean
}

const innerState:State = {
	secretKey:"",
	size:null,
	plaintext:"",
	encryptMatrix:null,
	decryptMatrix:null,
	ciphertext:"",
	decrypted:"",
	charToNumber:null,
	mod:26,
	matsGood:false
}

const dependents:{
	[key in keyof State]:(keyof State)[]
} = {
	secretKey: ["encryptMatrix"],
	size: ["encryptMatrix"],
	plaintext: ["ciphertext"],
	encryptMatrix: ["ciphertext","decryptMatrix"],
	decryptMatrix: ["decrypted","matsGood"],
	ciphertext: ["decrypted","plaintext"],
	decrypted: [],
	charToNumber: ["ciphertext"],
	mod: ["encryptMatrix","ciphertext"],
	matsGood: []
} as const

type MatLike = {
	size: ()=>number[],
	get: (index:number[])=>any
}

function renderTable(mat:MatLike,table:HTMLTableElement) {
	const dims = mat.size();
	if (dims.length < 2) throw new Error("Not big enough");

	const h = dims[0];
	const w = dims[1];

	const rows:string[] = [];
	for (let i=0;i<h;i++) {
		let row = "";
		for (let j=0;j<w;j++) {
			row += `<td>${mat.get([i,j])}</td>`;
		}
		rows.push(row);
	}
	const body = table.querySelector("tbody") ?? table;
	
	body.innerHTML = rows.map(row => `<tr>${row}</tr>`).join("");
}

function blankMat(size:number=3) {
	return {
		size: () => [size,size],
		get: () => "",
	} as MatLike
}

const recalculate:{[key in keyof State]?: (state:State)=>any} = {
	encryptMatrix(state:State) {
		// recalc encrypt matrix

		state.encryptMatrix = state.size && state.secretKey.length ? passToKey(state.size,state.secretKey) : null;

		// render encrypt matrix
		const r = refs as Refs;

		renderTable(state.encryptMatrix ?? blankMat(state.size || 3),r.encryptMatTable);
	},

	ciphertext(state:State) {
		// recalc ciphertext
		state.ciphertext = state.encryptMatrix ? encipher(state.plaintext,state.encryptMatrix,state.mod) : "";

		// render ciphertext
		const r = refs as Refs;
		r.cipherTextInput.value = state.ciphertext;
	},

	plaintext(state:State) {
		// recalc
		state.plaintext = state.decryptMatrix ? decipher(state.ciphertext,state.decryptMatrix,state.mod) : "";

		// render
		const r = refs as Refs;
		r.plaintextInput.value = state.plaintext;
	},

	decryptMatrix(state:State) {
		console.log(`MOD: ${state.mod}`);
		// recalc decrypt matrix
		try {
			state.decryptMatrix = state.size ? createMats(state.size,state.secretKey,state.mod).B : null;
		} catch (e) {
			state.decryptMatrix = null
		}
		// render decrypt matrix
		const r = refs as Refs;
		renderTable(state.decryptMatrix ?? blankMat(state.size || 3), r.decryptMatTable);
	},

	decrypted(state:State) {
		// recalc
		state.decrypted = state.decryptMatrix ? decipher(state.ciphertext,state.decryptMatrix,state.mod) : "";
		
		// render
		const r = refs as Refs;
		r.decryptedText.innerHTML = state.decrypted;
	},

	matsGood(state:State) {
		state.matsGood = Boolean(state.decryptMatrix);
		
		const r = refs as Refs;
		if (state.matsGood) {
			r.matStatus.classList.add("good");
			r.matStatus.classList.remove("bad");
		}
		else {
			r.matStatus.classList.add("bad");
			r.matStatus.classList.remove("good");
		}
	},
}

const state = new Proxy(innerState,{
	set(target,property,newValue:State[keyof State]) {
		if (!(property in target)) throw new TypeError("Property does not exist");
		const prop = property as keyof State;

		// @ts-ignore
		target[prop] = newValue;

		// Overkill-aah BFS through dependents
		const toUpdate = [...dependents[prop]];
		const seen = [prop];
		while (toUpdate.length) {
			const curr = toUpdate.shift();
			if (!curr) continue;
			if (seen.includes(curr)) { // Hitting already-explored branch
				// console.warn(`Circular dependency on ${curr}: ${seen}; ${toUpdate}`);
				continue;
			}
			seen.push(curr);

			recalculate[curr] && recalculate[curr](target); // Re-calculate current property if recalculate function exists
			toUpdate.push(...dependents[curr]);
		}

		return true;
	},
});

function loadRefs(parent:Element) {
	const start = parent.querySelector(".start");
	const middle = parent.querySelector(".middle");
	const end = parent.querySelector(".end");

	if (!start || !middle || !end) throw new Error("Malformed parent element");

	refs.keyInput        = start.querySelector<HTMLInputElement>("input.text-key") ?? undefined;
	refs.sizeInput       = start.querySelector<HTMLInputElement>("input.mat-size") ?? undefined;
	refs.plaintextInput  = start.querySelector("textarea") ?? undefined;
	refs.encryptMatTable = middle.querySelector<HTMLTableElement>("table.encrypt-mat") ?? undefined;
	refs.decryptMatTable = middle.querySelector<HTMLTableElement>("table.decrypt-mat") ?? undefined;
	refs.cipherTextInput = end.querySelector("textarea") ?? undefined;
	refs.decryptedText   = end.querySelector("p.decrypted") ?? undefined;
	refs.textSetInput    = start.querySelector<HTMLSelectElement>("select.choose-s-mat") ?? undefined;
	refs.matStatus       = start.querySelector<HTMLDivElement>("div.mat-status") ?? undefined;
}

export function hydrate(parent:Element) {
	// Places hill playground inside of parent element

	const altTitle = new URLSearchParams(window.location.search).get("title");
	if (altTitle) {
		const h2 = document.querySelector("h2");
		if (h2) h2.innerHTML = altTitle;
	}

	const isIframe = (window.self !== window.top);
	if (isIframe) document.body.classList.add("is-iframe");

	const infoButton = document.querySelector(".info-button");
	if (!infoButton) throw new Error("Malformed internal HTML");

	infoButton.addEventListener("click", e=>{
		const dialog = document.querySelector("dialog");
		dialog && dialog.showModal();
	});

	const dialogCloseButton = document.querySelector("dialog button");
	if (!dialogCloseButton) throw new Error("Malformed internal HMTL");

	dialogCloseButton.addEventListener("click", e=>{
		const dialog = document.querySelector("dialog");
		dialog && dialog.close();
	})

	const attrs = parent.attributes;

	try { loadRefs(parent); }
	catch (e) { throw e; } // I'm a genius

	if (!refs.keyInput || !refs.sizeInput || !refs.plaintextInput || !refs.encryptMatTable || !refs.decryptMatTable || !refs.cipherTextInput || !refs.textSetInput || !refs.matStatus)
		throw new Error("Malformed internal HTML");

	refs.keyInput.addEventListener("input", (e) => {
		state.secretKey = (e.target as HTMLInputElement).value;
	});

	refs.sizeInput.addEventListener("input", e => {
		state.size = +(e.target as HTMLInputElement).value;
	});

	type ModOption = "26"|"31"|"59";

	refs.textSetInput.addEventListener("input", e => {
		const newVal = (e.target as HTMLOptionElement).value as ModOption;
		// change mapping + mod
		
		if (newVal == "26") {
			setMapping("abcdefghijklmnopqrstuvwxyz");
			state.mod = 26;
		}
		if (newVal == "31") {
			setMapping("abcdefghijklmnopqrstuvwxyz ?!./");
			state.mod = 31;
		}
		if (newVal == "59") {
			setMapping("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ ?!./,'");
			state.mod = 59;
		}
	})

	refs.plaintextInput.addEventListener("input", e => {
		state.plaintext = (e.target as HTMLTextAreaElement).value;
	});

	refs.cipherTextInput.addEventListener("input", e=>{
		state.ciphertext = (e.target as HTMLTextAreaElement).value;
		innerState.plaintext = state.decryptMatrix ? decipher(state.ciphertext,state.decryptMatrix,state.mod) : "";
	})

	state.size=3;
	state.secretKey="";
	state.plaintext="";
}

const playground = document.querySelector(".playground");
if (!playground) throw new Error("shart");

hydrate(playground);
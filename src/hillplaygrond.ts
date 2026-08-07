import "./playground.css";
import { createMats, decipher, encipher, passToKey } from "./hill";
import { Matrix } from "mathjs";

type Refs = {
	keyInput: HTMLInputElement,
	sizeInput: HTMLInputElement,
	plaintextInput: HTMLTextAreaElement,
	encryptMatTable: HTMLTableElement,
	decryptMatTable: HTMLTableElement,
	cipherTextInput: HTMLTextAreaElement,
	decryptedText: HTMLParagraphElement
}

const refs:Partial<Refs> = {};

type State = {
	secretKey:string,
	size:number|null,
	plaintext:string,
	encryptMatrix:Matrix|null,
	decryptMatrix:Matrix|null,
	ciphertext:string,
	decrypted:string
}

const innerState:State = {
	secretKey:"",
	size:null,
	plaintext:"",
	encryptMatrix:null,
	decryptMatrix:null,
	ciphertext:"",
	decrypted:""
}

const dependents:{
	[key in keyof State]:(keyof State)[]
} = {
	secretKey: ["encryptMatrix"],
	size: ["encryptMatrix"],
	plaintext: ["ciphertext"],
	encryptMatrix: ["ciphertext","decryptMatrix"],
	decryptMatrix: ["decrypted"],
	ciphertext: ["decrypted"],
	decrypted: []
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
		state.ciphertext = state.encryptMatrix ? encipher(state.plaintext,state.encryptMatrix) : "";

		// render ciphertext
		const r = refs as Refs;
		r.cipherTextInput.value = state.ciphertext;
	},

	decryptMatrix(state:State) {
		// recalc decrypt matrix
		try {
			state.decryptMatrix = state.size ? createMats(state.size,state.secretKey).B : null;
		} catch (e) {
			state.decryptMatrix = null
		}
		// render decrypt matrix
		const r = refs as Refs;
		renderTable(state.decryptMatrix ?? blankMat(state.size || 3), r.decryptMatTable);
	},

	decrypted(state:State) {
		if (!state.decryptMatrix) return;

		// recalc
		state.decrypted = state.decryptMatrix ? decipher(state.ciphertext,state.decryptMatrix) : "";
		
		// render
		const r = refs as Refs;
		r.decryptedText.innerHTML = state.decrypted;
	}
}

const state = new Proxy(innerState,{
	set(target,property,newValue:State[keyof State]) {
		if (!(property in target)) throw new TypeError("Property does not exist");
		const prop = property as keyof State;

		// @ts-ignore
		target[prop] = newValue;

		// Overkill-aah BFS through dependents
		const toUpdate = [...dependents[prop]];
		while (toUpdate.length) {
			const curr = toUpdate.shift();
			if (!curr) continue;
			if (curr === prop) throw new Error(`Circular dependency on ${prop}`);

			recalculate[curr] && recalculate[curr](target); // Re-calculate current property if recalculate function exists
			toUpdate.push(...dependents[curr]);
		}

		return true;
	},
});

export function hydrate(parent:Element) {
	// Places hill playground inside of parent element

	const attrs = parent.attributes;

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

	if (!refs.keyInput || !refs.sizeInput || !refs.plaintextInput || !refs.encryptMatTable || !refs.decryptMatTable || !refs.cipherTextInput)
		throw new Error("Malformed internal HTML");

	refs.keyInput.addEventListener("input", (e) => {
		state.secretKey = (e.target as HTMLInputElement).value;
	});

	refs.sizeInput.addEventListener("input", e => {
		state.size = +(e.target as HTMLInputElement).value;
	});

	refs.plaintextInput.addEventListener("input", e => {
		state.plaintext = (e.target as HTMLTextAreaElement).value;
	});

	state.size=3;
	state.secretKey="";
	state.plaintext="";
}

const playground = document.querySelector(".playground");
if (!playground) throw new Error("shart");

hydrate(playground);
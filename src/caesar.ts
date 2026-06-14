const caesarState = {
	n:0,
	k:0,
	plaintext: ""
};

function isAlpha(c: string) {
	return /[a-zA-Z]/.test(c);
}

function rot(letter: string, k: number) {
	if (!isAlpha(letter)) return letter;
	if (letter.toUpperCase() === letter) {
		const idx = letter.charCodeAt(0) - 'A'.charCodeAt(0);
		return String.fromCharCode(((idx + k) % 26 + 26) % 26 + 'A'.charCodeAt(0));
	}
	const idx = letter.charCodeAt(0) - 'a'.charCodeAt(0);
	return String.fromCharCode(((idx + k) % 26 + 26) % 26 + 'a'.charCodeAt(0));
}

function buildLetterRows(n: number, k: number) {
	const plainRows: string[] = [];
	const arrowRows: string[] = [];
	const cipherRows: string[] = [];

	for (let i = 0; i < caesarState.plaintext.length; i++) {
		const ch = caesarState.plaintext.charAt(i);
		const enciphered = i < n;
		const alpha = isAlpha(ch);

		plainRows.push(`<div class="letter${enciphered ? ' enciphered' : ''}">${ch}</div>`);

		if (enciphered && alpha) arrowRows.push(`<div class="letter arrow-cell">↓</div>`);
		else arrowRows.push(`<div class="letter arrow-cell"></div>`);

		if (i < n) cipherRows.push(`<div class="letter enciphered">${rot(ch, k)}</div>`);
		else cipherRows.push(`<div class="letter"></div>`);
	}

	return {
		plain: `<div class="letter-row">${plainRows.join('')}</div>`,
		arrows: `<div class="letter-row arrow-row">${arrowRows.join('')}</div>`,
		cipher: `<div class="letter-row">${cipherRows.join('')}</div>`,
	};
}

function buildAlphabetWheel(k: number) {
	const rows: string[] = [];
	for (let i = 0; i < 26; i++) {
		const from = String.fromCharCode('a'.charCodeAt(0) + i);
		const to = rot(from, k);
		rows.push(`<div class="wheel-row"><span class="wheel-from">${from}</span><span class="wheel-arrow">→</span><span class="wheel-to">${to}</span></div>`);
	}
	return rows.join('');
}

function chooseStartingText() {
	const screenWidth = window.innerWidth;
	if (screenWidth > 600) return "My name is Joe";
	return "Hallo!";
}

function createCaesarDemo() {
	const caesar = document.querySelector("div.caesar-demo");
	if (!caesar) throw new Error("wtf?");

	const kInput:HTMLInputElement|null = caesar.querySelector("input.k-input");
	const nInput:HTMLInputElement|null = caesar.querySelector(".transform-slider input")
	const nInputNote = caesar.querySelector(".transform-slider div.slider-label");
	const middlePanel = caesar.querySelector("div.middle-panel");
	const rightPanel = caesar.querySelector("div.right-panel");
	const plaintextInput:HTMLInputElement|null = document.querySelector("input.caesar-demo-text");
	
	if (!kInput || !nInput || !nInputNote || !middlePanel || !rightPanel || !plaintextInput) throw new Error("Malformed HTML, cannot make reactive");

	caesarState.plaintext = plaintextInput.value = chooseStartingText();

	buildMiddle(middlePanel);
	buildRight(rightPanel);
	buildSliderLabel(nInputNote);
	adjustNInput(nInput);

	kInput.addEventListener("input", () => {
		const raw = parseInt(kInput.value);
		if (isNaN(raw)) return;

		caesarState.k = raw;
		buildMiddle(middlePanel);
		buildRight(rightPanel);
	});

	nInput.addEventListener("input", () => {
		const n = parseInt(nInput.value);
		caesarState.n = n;

		buildMiddle(middlePanel);
		buildSliderLabel(nInputNote);
	});

	plaintextInput.addEventListener("input", () => {
		const plaintext = plaintextInput.value;
		caesarState.plaintext = plaintext;
		
		buildMiddle(middlePanel);
		buildSliderLabel(nInputNote);
		adjustNInput(nInput);
	});
}

function adjustNInput(nInput:HTMLInputElement) {
	nInput.setAttribute("max",caesarState.plaintext.length.toString());
}

function buildMiddle(middlePanel: Element) {
	const rows = buildLetterRows(caesarState.n,caesarState.k);	
	const middleHTML = `
		<div class="rows-label">plaintext</div>
		${rows.plain}
		${rows.arrows}
		${rows.cipher}
		<div class="rows-label">ciphertext</div>
	`
	middlePanel.innerHTML = middleHTML;
}

function buildRight(rightPanel:Element) {
	const wheel = buildAlphabetWheel(caesarState.k);
	const rightHTML = `
		<div class="wheel-title">key (k=${caesarState.k})</div>
		<div class="alphabet-wheel">${wheel}</div>
	`
	rightPanel.innerHTML = rightHTML;
}

function buildSliderLabel(nInputNote:Element) {
	const n = caesarState.n;

	const label = n === 0 ? 
		'No letters enciphered yet'
		: n === caesarState.plaintext.length
			? 'All letters enciphered!'
			: `First <b>${n}</b> letter${n === 1 ? '' : 's'} enciphered`;
	nInputNote.innerHTML=label;
}

createCaesarDemo();
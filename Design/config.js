export const logicShortcuts = {
    "->": "\\rightarrow",
    "implies": "\\rightarrow",
    "→": "\\rightarrow",
    "vv": "\\lor",
    "||": "\\lor",
    "&&": "\\land",
    "!!": "\\lnot",
    "not": "\\lnot",
    "AA": "\\forall",
    "forall": "\\forall",
    "EE": "\\exists",
    "exists": "\\exists",
    "!EE": "\\lnot\\exists",
    "!exists": "\\lnot\\exists",
    "FF": "\\bot",
    "TT": "\\top",
};

export function processKey(text, key) {
    let combined = text + key;
    if (key === "&" || key === "∧"
        || combined === "and") {
        combined = "∧";
    } else if (key === "|" || key === "∨"
        || combined === "v" || combined === "∨v" || combined === "or") {
        combined = "∨";
    } else if (key === "-" || key === "→"
        || key === ">" || combined === "implies") {
        combined = "→";
    } else if (combined === "¬!" || combined === "¬¬"
        || combined === "¬not") {
        combined = "¬¬";
    } else if (key === "!" || key === "¬"
        || combined.endsWith("not")) {
        combined = "¬";
    } else if (combined === "A" || key === "∀"
        || combined === "forall" || combined === "∀A") {
        combined = "∀";
    } else if (combined === "E" || key === "∃"
        || combined === "exists") {
        combined = "∃";
    } else if (combined === "T" || key === "⊤"
        || combined === "true" || combined === "⊤T") {
        combined = "⊤";
    } else if (combined === "F" || key === "⊥"
        || combined === "false" || combined === "⊥F") {
        combined = "⊥";
    } else if (combined === "h" || combined === "H") {
        combined = "h";
    } else if ((key === "i" || key === "I") && text.length === 1) {
        combined = text + "I";
    } else if ((key === "e" || key === "E") && (text.length === 1 || text === "¬¬") && combined !== "le") {
        combined = text + "E";
    } else if (combined === "L" || combined === "let") {
        combined = "Let";
    } else if (combined === "B" || combined === "by") {
        combined = "By ";
    } else if (/^[A-Za-z0-9 ]$/.test(key)) {
        combined = text + key.toLowerCase();
    } else if (key === "Backspace") {
        combined = text.substring(0, text.length - 1);
    } else { // ignore anything else
        combined = null;
    }
    return combined;
}

export const virtualKeyboardLayouts = [
    {
        label: "logic",
        tooltip: "logic operators",
        rows: [
            [
                { latex: "1", variants: [{ latex: "\\lnot", aside: "not", },], },
                { latex: "2", },
                { latex: "3", },
                { latex: "4", },
                { latex: "5", },
                { latex: "6", },
                { latex: "7", variants: [{ latex: "\\land", aside: "and", },], },
                { latex: "8", shift: { latex: "#@_{#?}", aside: "subscript", }, },
                { latex: "9", shift: "(", },
                { latex: "0", shift: ")", },
            ],
            [
                { label: "q", class: 'hide-shift', shift: { label: "Q", }, },
                { label: "w", class: 'hide-shift', shift: { label: "W", }, },
                {
                    label: "e", class: 'hide-shift', shift: { label: "E", },
                    variants: [{ latex: "\\exists", aside: "exists", }],
                },
                { label: "r", class: 'hide-shift', shift: { label: "R", }, },
                {
                    label: "t", class: 'hide-shift', shift: { label: "T", },
                    variants: [{ latex: "\\top", aside: "true", }],
                },
                { label: "y", class: 'hide-shift', shift: { label: "Y", }, },
                { label: "u", class: 'hide-shift', shift: { label: "U", }, },
                {
                    label: "i", class: 'hide-shift', shift: { label: "I", },
                    variants: [{ latex: "\\rightarrow", aside: "implies", }],
                },
                { label: "o", class: 'hide-shift', shift: { label: "O", }, },
                { label: "p", class: 'hide-shift', shift: { label: "P", }, },
            ],
            [
                { label: "[separator]", width: "0.5", },
                {
                    label: "a", class: 'hide-shift', shift: { label: "A", },
                    variants: [{ latex: "\\forall", aside: "for all", }],
                },
                { label: "s", class: 'hide-shift', shift: { label: "S", }, },
                { label: "d", class: 'hide-shift', shift: { label: "D", }, },
                {
                    label: "f", class: 'hide-shift', shift: { label: "F", },
                    variants: [{ latex: "\\bot", aside: "false", }],
                },
                { label: "g", class: 'hide-shift', shift: { label: "G", }, },
                { label: "h", class: 'hide-shift', shift: { label: "H", }, },
                { label: "j", class: 'hide-shift', shift: { label: "J", }, },
                { label: "k", class: 'hide-shift', shift: { label: "K", }, },
                { label: "l", class: 'hide-shift', shift: { label: "L", }, },
                { label: "[backspace]", width: "0.5", },
            ],
            [
                { label: "[shift]", width: 1, },
                { label: "z", class: 'hide-shift', shift: { label: "Z", }, },
                { label: "x", class: 'hide-shift', shift: { label: "X", }, },
                { label: "c", class: 'hide-shift', shift: { label: "C", }, },
                {
                    label: "v", class: 'hide-shift', shift: { label: "V", },
                    variants: [{ latex: "\\lor", aside: "or", },],
                },
                { label: "b", class: 'hide-shift', shift: { label: "B", }, },
                { label: "n", class: 'hide-shift', shift: { label: "N", }, },
                { label: "m", class: 'hide-shift', shift: { label: "M", }, },
                ",",
                { label: "[return]", width: 1, },
            ],
            [
                "\\forall", "\\exists", "\\land", "\\lor", "\\top", "\\bot",
                "\\rightarrow", "\\lnot", "[left]", "[right]",
            ],
        ],
    },
];

export const tools = `
<proof-tool slot="tool" label="\\(\\top\\)-Intro" key="⊤I" expr="\\top" class="true-intro">
<true-intro></true-intro>
</proof-tool>
<proof-tool slot="tool" label="\\(\\land\\)-Intro" key="∧I" expr="\\_\\land\\_" class="and-intro">
<and-intro>
    <unknown-intro slot="left"></unknown-intro>
    <unknown-intro slot="right"></unknown-intro>
</and-intro>
</proof-tool>
<proof-tool slot="tool" label="\\(\\land\\)-Elim1" key="∧E1" expr="\\_" class="and-elim1">
<and-elim1>
    <unknown-intro></unknown-intro>
</and-elim1>
</proof-tool>
<proof-tool slot="tool" label="\\(\\land\\)-Elim2" key="∧E2" expr="\\_" class="and-elim2">
<and-elim2>
    <unknown-intro></unknown-intro>
</and-elim2>
</proof-tool>
<proof-tool slot="tool" label="\\(\\lor\\)-Intro1" key="∨I1" expr="\\_\\lor\\_" class="or-intro1">
<or-intro1>
    <unknown-intro></unknown-intro>
</or-intro1>
</proof-tool>
<proof-tool slot="tool" label="\\(\\lor\\)-Intro2" key="∨I2" expr="\\_\\lor\\_" class="or-intro2">
<or-intro2>
    <unknown-intro></unknown-intro>
</or-intro2>
</proof-tool>
<proof-tool slot="tool" label="\\(\\lor\\)-Elim" key="∨E" expr="\\_" class="or-elim">
<or-elim>
    <unknown-intro></unknown-intro>
    <binder-node slot="left"><unknown-intro></unknown-intro></binder-node>
    <binder-node slot="right"><unknown-intro></unknown-intro></binder-node>
</or-elim>
</proof-tool>
<proof-tool slot="tool" label="\\(\\bot\\)-Elim" key="⊥E" expr="\\_" class="false-elim">
<false-elim>
    <unknown-intro></unknown-intro>
</false-elim>
</proof-tool>
<proof-tool slot="tool" label="\\(\\rightarrow\\)-Intro" key="→I" expr="\\_\\rightarrow\\_" class="implies-intro">
<implies-intro>
    <binder-node><unknown-intro></unknown-intro></binder-node>
</implies-intro>
</proof-tool>
<proof-tool slot="tool" label="\\(\\rightarrow\\)-Elim" key="→E" expr="\\_" class="implies-elim">
<implies-elim>
    <unknown-intro></unknown-intro>
    <unknown-intro slot="arg"></unknown-intro>
</implies-elim>
</proof-tool>
<proof-tool slot="tool" label="\\(\\lnot\\)-Intro" key="¬I" expr="\\lnot\\_" class="not-intro">
<not-intro>
    <binder-node><unknown-intro></unknown-intro></binder-node>
</not-intro>
</proof-tool>
<proof-tool slot="tool" label="\\(\\lnot\\)-Elim" key="¬E" expr="\\bot" class="not-elim">
<not-elim>
    <unknown-intro></unknown-intro>
    <unknown-intro slot="arg"></unknown-intro>
</not-elim>
</proof-tool>
<proof-tool slot="tool" label="\\(\\lnot\\lnot\\)-Elim" key="¬¬E" expr="\\_" class="notnot-elim">
<notnot-elim>
    <unknown-intro></unknown-intro>
</notnot-elim>
</proof-tool>
<proof-tool slot="tool" label="Let" key="Let" expr="\\_" class="let-block">
<let-block>
    <unknown-intro></unknown-intro>
</let-block>
</proof-tool>
`;
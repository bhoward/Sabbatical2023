import * as MathLive from "//unpkg.com/mathlive?module";

// TODO put things in classes, create some components, and export them all

const mf = document.getElementById("test");
const out = document.getElementById("out");

const logicShortcuts = {
    "->": "\\rightarrow",
    "vv": "\\lor",
    "||": "\\lor",
    "!!": "\\lnot",
    "not": "\\lnot",
    "!EE": "\\lnot\\exists",
    "!exists": "\\lnot\\exists",
    "implies": "\\rightarrow",
    "→": "\\rightarrow",
    "FF": "\\bot",
};

mathVirtualKeyboard.layouts = [
    {
        label: "logic",
        tooltip: "logic operators",
        rows: [
            [
                "\\land", "\\lor", "\\lnot", "\\rightarrow", "(", ")",
            ],
            [
                "\\forall", "\\exists", "\\top", "\\bot", "#@_{#?}",
            ],
        ],
    },
    "alphabetic"
];

window.addEventListener("DOMContentLoaded", () => {
    out.innerText = "$$" + render(parse(mf.value)) + "$$";
    MathLive.renderMathInDocument();
    mf.inlineShortcuts = {
        ...mf.inlineShortcuts,
        ...logicShortcuts,
    };
});

mf.addEventListener("change", (event) => {
    out.innerText = "$$" + render(parse(mf.value)) + "$$";
    MathLive.renderMathInElement(out);
});

function parse(s) {
    let errors = [];
    let [e, rest] = parseExpr(s.trim(), errors);
    if (rest !== "") {
        errors.push("Excess input '" + rest + "'");
    }
    console.log(errors);
    if (errors.length === 0) {
        return e;
    } else {
        return "E"; // TODO
    }
}

function match(token, s, errors) {
    if (s.startsWith(token)) {
        return s.substring(token.length).trim();
    } else {
        errors.push(`Expected '${token}'; found '${s}'`);
        return s;
    }
}

function parseExpr(s, errors) {
    let [e1, rest] = parseOExpr(s, errors);
    if (rest.startsWith("\\rightarrow")) {
        rest = match("\\rightarrow", rest, errors);
        let [e2, rest2] = parseExpr(rest, errors);
        e1 = { op: "implies", e1, e2 };
        rest = rest2;
    }
    return [e1, rest.trim()];
}

function parseOExpr(s, errors) {
    let [e1, rest] = parseAExpr(s, errors);
    while (rest.startsWith("\\lor")) {
        rest = match("\\lor", rest, errors);
        let [e2, rest2] = parseAExpr(rest, errors);
        e1 = { op: "or", e1, e2 };
        rest = rest2;
    }
    return [e1, rest.trim()];
}

function parseAExpr(s, errors) {
    let [e1, rest] = parseQExpr(s, errors);
    while (rest.startsWith("\\land")) {
        rest = match("\\land", rest, errors);
        let [e2, rest2] = parseQExpr(rest, errors);
        e1 = { op: "and", e1, e2 };
        rest = rest2;
    }
    return [e1, rest.trim()];
}

function parseQExpr(s, errors) {
    if (s.startsWith("\\forall")) {
        let s2 = match("\\forall", s, errors);
        let [v, rest] = parseVar(s2, errors);
        let [e, rest2] = parseQExpr(rest, errors);
        return [{ op: "all", v, e }, rest2];
    } else if (s.startsWith("\\exists")) {
        let s2 = match("\\exists", s, errors);
        let [v, rest] = parseVar(s2, errors);
        let [e, rest2] = parseQExpr(rest, errors);
        return [{ op: "exists", v, e }, rest2];
    } else if (s.startsWith("(\\forall")) {
        let s2 = match("(\\forall", s, errors);
        let [v, rest] = parseVar(s2, errors);
        rest = match(")", rest, errors);
        let [e, rest2] = parseQExpr(rest, errors);
        return [{ op: "all", v, e }, rest2];
    } else if (s.startsWith("(\\exists")) {
        let s2 = match("(\\exists", s, errors);
        let [v, rest] = parseVar(s2, errors);
        rest = match(")", rest, errors);
        let [e, rest2] = parseQExpr(rest, errors);
        return [{ op: "exists", v, e }, rest2];
    } else if (s.startsWith("\\lnot")) {
        let s2 = match("\\lnot", s, errors);
        let [e, rest] = parseQExpr(s2, errors);
        return [{ op: "not", e }, rest];
    } else if (s.startsWith("(")) {
        let s2 = match("(", s, errors);
        let [e, rest] = parseExpr(s2, errors);
        rest = match(")", rest, errors);
        return [e, rest];
    } else {
        return parseTerm(s, errors);
    }
}

function parseTerm(s, errors) {
    if (s.match(/^\w/) || s.startsWith("\\_")) {
        let [v, rest] = parseVar(s, errors);
        if (rest.startsWith("(")) {
            let [args, rest2] = parseArgs(rest, errors);
            return [{ op: "pred", v, args }, rest2];
        } else {
            return [{ op: "prop", v }, rest];
        }
    } else if (s.startsWith("\\bot")) {
        let rest = match("\\bot", s, errors);
        return [{ op: "false" }, rest];
    } else if (s.startsWith("\\top")) {
        let rest = match("\\top", s, errors);
        return [{ op: "true" }, rest];
    } else {
        errors.push(`Unrecognized term: '${s}'`);
        return ["", s];
    }
}

function parseArgs(s, errors) {
    let rest = match("(", s, errors);
    let args = [];
    if (!rest.startsWith(")")) {
        let [e, rest2] = parseVar(rest, errors);
        args.push(e);
        while (rest2.startsWith(",")) {
            rest2 = match(",", rest2, errors);
            let [e2, rest3] = parseVar(rest2, errors);
            args.push(e2);
            rest2 = rest3;
        }
        rest = rest2;
    }
    rest = match(")", rest, errors);
    return [args, rest];
}

// TODO allow multichar identifiers wrapped in \text{}
function parseVar(s, errors) {
    let m = s.match(/^\w+/);
    if (m) {
        let v = m[0];
        let rest = match(v, s, errors);
        if (v.endsWith("_") && rest.startsWith("{")) {
            let m2 = rest.match(/{\w*}/);
            if (m2) {
                v = v + m2[0];
                rest = s.substring(v.length).trim();
            }
        }
        return [v, rest];
    } else if (s.startsWith("\\_")) {
        let rest = match("\\_", s, errors);
        return ["\\_", rest];
    } else {
        errors.push(`Expected identifier: '${s}'`);
        return ["", s];
    }
}

function paren(s, level, min) {
    if (level > min) {
        return "(" + s + ")";
    } else {
        return s;
    }
}

function render(e, level = 0) {
    if (e.op) {
        switch (e.op) {
            case "not":
                return paren("\\lnot " + render(e.e, 3), level, 3);

            case "implies":
                return paren(render(e.e1, 1) + "\\rightarrow " + render(e.e2, 0), level, 0);

            case "or":
                return paren(render(e.e1, 1) + "\\lor " + render(e.e2, 2), level, 1);

            case "and":
                return paren(render(e.e1, 2) + "\\land " + render(e.e2, 3), level, 2);

            case "all":
                return paren("\\forall " + e.v + render(e.e, 4), level, 4);

            case "exists":
                return paren("\\exists " + e.v + render(e.e, 4), level, 4);

            case "true":
                return "\\top";

            case "false":
                return "\\bot";

            case "prop":
                return paren(e.v, level, 3);

            case "pred":
                return paren(e.v + "(" + e.args + ")", level, 3);
        }
    } else {
        return null;
    }
}

customElements.define(
    "expr-test",
    class extends HTMLDivElement {
        constructor() {
            super();
            this.classList.add('node');
        }

        connectedCallback() {
            const exprField = document.createElement("math-field");
            this.appendChild(exprField);

            exprField.inlineShortcuts = {
                ...exprField.inlineShortcuts,
                ...logicShortcuts,
            };
            exprField.value = "P \\land Q";
        }
    },
    { extends: "div" },
);

class Node extends HTMLDivElement {
    wild = { op: "prop", v: "\\_" };

    expr = this.wild;

    constructor() {
        super();
        this.classList.add("node");
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "expr") {
            this.expr = parse(newValue);
            this.update();
            MathLive.renderMathInElement(this);
        }
    }
}

customElements.define(
    "unknown-intro",
    class extends Node {
        static observedAttributes = ["expr"];

        constructor() {
            super();
            this.classList.add("unknown-intro");
        }

        // TODO handle drops and keypresses
    
        update() {
            this.innerText = `?: \\(${render(this.expr)}\\)`;
        }
    },
    { extends: "div" },
);

customElements.define(
    "var-intro",
    class extends Node {
        static observedAttributes = ["name", "expr"];

        name = "\\_";

        constructor() {
            super();
            this.classList.add("var-intro");
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (name === "name") {
                this.name = newValue;
                this.update();
                MathLive.renderMathInElement(this);
            } else {
                super.attributeChangedCallback(name, oldValue, newValue);
            }
        }

        update() {
            this.innerText = `\\(${this.name}\\): \\(${render(this.expr)}\\)`;
        }
    },
    { extends: "div" },
);

customElements.define(
    "and-intro",
    class extends Node {
        static observedAttributes = ["expr"];

        constructor() {
            super();
            this.classList.add("and-intro");
        }

        update() {
            if (this.expr.op && this.expr.op === "and") {
                this.innerHTML = `\\(\\land\\)-Intro<br />
                <ul>
                    <li><div is="unknown-intro" expr="${render(this.expr.e1)}"></div></li>
                    <li><div is="unknown-intro" expr="${render(this.expr.e2)}"></div></li>
                </ul>`;
            } else {
                this.outerHTML = `<div is="unknown-intro" expr="${this.expr}"></div>`;
            }
        }
    },
    { extends: "div" },
);

customElements.define(
    "and-elim1",
    class extends Node {
        static observedAttributes = ["expr"];

        expr2 = this.wild;

        constructor() {
            super();
            this.classList.add("and-elim1");
        }

        update() {
            let e = { op: "and", e1: this.expr, e2: this.expr2 };
            this.innerHTML = `\\(\\land\\)-Elim-1<br />
            <div is="unknown-intro" expr="${render(e)}"></div>`;
            console.log(render(e));
        }
    },
    { extends: "div" },
);

customElements.define(
    "and-elim2",
    class extends Node {
        static observedAttributes = ["expr"];

        expr1 = this.wild;

        constructor() {
            super();
            this.classList.add("and-elim2");
        }

        update() {
            let e = { op: "and", e1: this.expr1, e2: this.expr };
            this.innerHTML = `\\(\\land\\)-Elim-2<br />
            <div is="unknown-intro" expr="${render(e)}"></div>`;
        }
    },
    { extends: "div" },
);

customElements.define(
    "or-intro1",
    class extends Node {
        static observedAttributes = ["expr"];

        constructor() {
            super();
            this.classList.add("or-intro1");
        }

        update() {
            if (this.expr.op && this.expr.op === "or") {
                this.innerHTML = `\\(\\lor\\)-Intro-1<br />
                <div is="unknown-intro" expr="${render(this.expr.e1)}"></div>`;
            } else {
                this.outerHTML = `<div is="unknown-intro" expr="${this.expr}"></div>`;
            }
        }
    },
    { extends: "div" },
);

customElements.define(
    "or-intro2",
    class extends Node {
        static observedAttributes = ["expr"];

        constructor() {
            super();
            this.classList.add("or-intro2");
        }

        update() {
            if (this.expr.op && this.expr.op === "or") {
                this.innerHTML = `\\(\\lor\\)-Intro-2<br />
                <div is="unknown-intro" expr="${render(this.expr.e2)}"></div>`;
            } else {
                this.outerHTML = `<div is="unknown-intro" expr="${this.expr}"></div>`;
            }
        }
    },
    { extends: "div" },
);

customElements.define(
    "or-elim",
    class extends Node {
        static observedAttributes = ["expr"];

        name1 = "\\_";
        expr1 = this.wild;
        name2 = "\\_";
        expr2 = this.wild;

        constructor() {
            super();
            this.classList.add("or-elim");
        }

        // TODO the variables x_1 and x_2 need to be draggable and editable (or at least unique)
        update() {
            let e = { op: "or", e1: this.expr1, e2: this.expr2 };
            this.innerHTML = `\\(\\lor\\)-Elim<br />
            <div is="unknown-intro" expr="${render(e)}"></div>
            <ul>
            <li>\\(x_1: ${render(this.expr1)}\\Rightarrow\\)
            <div is="unknown-intro" expr="${render(this.expr)}"></div></li>
            <li>\\(x_2: ${render(this.expr2)}\\Rightarrow\\)
            <div is="unknown-intro" expr="${render(this.expr)}"></div></li>
            </ul>`;
        }
    },
    { extends: "div" },
);
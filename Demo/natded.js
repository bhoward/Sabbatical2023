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
    let parser = new Parser();
    out.innerText = "$$" + render(parser.parse(mf.value)) + "$$";
    MathLive.renderMathInDocument();
    mf.inlineShortcuts = {
        ...mf.inlineShortcuts,
        ...logicShortcuts,
    };
});

mf.addEventListener("change", (event) => {
    let parser = new Parser();
    out.innerText = "$$" + render(parser.parse(mf.value)) + "$$";
    MathLive.renderMathInElement(out);
});

class Parser {
    source;
    errors;

    constructor() {
    }

    parse(s) {
        this.source = s.trim();
        this.errors = [];
        let e = this.parseExpr();
        if (this.source !== "") {
            this.errors.push(`Excess input '${this.source}'`);
        }
        return e; // TODO return null if errors?
    }

    match(token, required = false) {
        if (this.source.startsWith(token)) {
            this.source = this.source.substring(token.length).trim();
            return true;
        } else if (required) {
            this.errors.push(`Expected '${token}'; found '${this.source}'`);
        }
        return false;
    }

    parseExpr() {
        let e1 = this.parseOExpr();
        if (this.match("\\rightarrow")) {
            let e2 = this.parseExpr();
            e1 = { op: "implies", e1, e2 };
        }
        return e1;
    }

    parseOExpr() {
        let e1 = this.parseAExpr();
        while (this.match("\\lor")) {
            let e2 = this.parseAExpr();
            e1 = { op: "or", e1, e2 };
        }
        return e1;
    }

    parseAExpr() {
        let e1 = this.parseQExpr();
        while (this.match("\\land")) {
            let e2 = this.parseQExpr();
            e1 = { op: "and", e1, e2 };
        }
        return e1;
    }

    parseQExpr() {
        if (this.match("\\forall")) {
            let v = this.parseVar();
            let e = this.parseQExpr();
            return { op: "all", v, e };
        } else if (this.match("\\exists")) {
            let v = this.parseVar();
            let e = this.parseQExpr();
            return { op: "exists", v, e };
        } else if (this.match("(\\forall")) {
            let v = this.parseVar();
            this.match(")", true);
            let e = this.parseQExpr();
            return { op: "all", v, e };
        } else if (this.match("(\\exists")) {
            let v = this.parseVar();
            this.match(")", true);
            let e = this.parseQExpr();
            return { op: "exists", v, e };
        } else if (this.match("\\lnot")) {
            let e = this.parseQExpr();
            return { op: "not", e };
        } else if (this.match("(")) {
            let e = this.parseExpr();
            this.match(")", true);
            return e;
        } else {
            return this.parseTerm();
        }
    }

    parseTerm() {
        // if (s.match(/^\w/) || s.startsWith("\\_")) {
        if (this.varStart()) {
            let v = this.parseVar();
            if (this.match("(")) {
                let args = this.parseArgs();
                return { op: "pred", v, args };
            } else {
                return { op: "prop", v };
            }
        } else if (this.match("\\bot")) {
            return { op: "false" };
        } else if (this.match("\\top")) {
            return { op: "true" };
        } else {
            this.errors.push(`Unrecognized term: '${this.source}'`);
            return null; // TODO is this what I want?
        }
    }

    parseArgs() {
        let args = [];
        if (!this.match(")")) {
            args.push(this.parseVar()); // TODO also allow constants?
            while (this.match(",")) {
                args.push(this.parseVar());
            }
            this.match(")", true);
        }
        return args;
    }

    varStart() {
        return this.source.match(/^\w/) || this.source.startsWith("\\_");
    }

    // TODO allow multichar identifiers wrapped in \text{}
    parseVar() {
        let m = this.source.match(/^\w+/);
        if (m) {
            let v = m[0];
            this.match(v);
            if (v.endsWith("_") && this.source.startsWith("{")) {
                let m2 = this.source.match(/{\w*}/);
                if (m2) {
                    v = v + m2[0];
                    this.match(m2[0]);
                }
            }
            return v;
        } else if (this.match("\\_")) {
            return "\\_";
        } else {
            this.errors.push(`Expected identifier: '${this.source}'`);
            return null; // TODO
        }
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
        let parser = new Parser();
        if (name === "expr") {
            this.expr = parser.parse(newValue);
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

// NOTES:
// * make an expr node for the wildcard
// * add a unify method to the expr class
// * have proof nodes re-render their exprs after unification -- do the whole tree once
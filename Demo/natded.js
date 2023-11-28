import * as MathLive from "//unpkg.com/mathlive?module";

// TODO put things in classes, create some components, and export them all

const mf = document.getElementById("test");
const out = document.getElementById("out");

const logicShortcuts = {
    "->": "\\rightarrow",
    "implies": "\\rightarrow",
    "→": "\\rightarrow",
    "vv": "\\lor",
    "||": "\\lor",
    "&&": "\\land",
    "!!": "\\lnot",
    "not": "\\lnot",
    "AA": "\\forall",
    "!EE": "\\lnot\\exists",
    "!exists": "\\lnot\\exists",
    "FF": "\\bot",
    "TT": "\\top",
};

mathVirtualKeyboard.layouts = [
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

window.addEventListener("DOMContentLoaded", () => {
    let parser = new Parser();
    let expr = parser.parse(mf.value);
    if (expr) {
        out.innerText = "$$" + expr.render() + "$$";
    } else {
        out.innerText = "Syntax error: " + parser.errors[0];
    }

    MathLive.renderMathInDocument();
    mf.inlineShortcuts = {
        ...mf.inlineShortcuts,
        ...logicShortcuts,
    };
    mf.onInlineShortcut = (_mf, s) => {
        const m = s.match(/^([A-Za-z])([0-9]+)$/);
        if (m) {
            return `${m[1]}_{${m[2]}}`;
        }
        return '';
    };
    mf.menuItems = mf.menuItems.filter(item => item.id !== "insert-matrix");
});

mf.addEventListener("change", (event) => {
    let parser = new Parser();
    let expr = parser.parse(mf.value);
    if (expr) {
        out.innerText = "$$" + expr.render() + "$$";
    } else {
        out.innerText = "Syntax error: " + parser.errors[0];
    }
    MathLive.renderMathInElement(out);
});

class Parser {
    source;
    errors;

    constructor() {
    }

    parse(s) {
        this.source = s.trim().replace("\\left(", "(").replace("\\right)", ")");
        this.errors = [];
        let e = this.parseExpr();
        if (this.source !== "") {
            this.errors.push(`Excess input '${this.source}'`);
        }
        if (this.errors.length === 0) {
            return e;
        } else {
            return null;
        }
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
            e1 = Expr.implies(e1, e2);
        }
        return e1;
    }

    parseOExpr() {
        let e1 = this.parseAExpr();
        while (this.match("\\lor")) {
            let e2 = this.parseAExpr();
            e1 = Expr.or(e1, e2);
        }
        return e1;
    }

    parseAExpr() {
        let e1 = this.parseQExpr();
        while (this.match("\\land")) {
            let e2 = this.parseQExpr();
            e1 = Expr.and(e1, e2);
        }
        return e1;
    }

    parseQExpr() {
        if (this.match("\\forall")) {
            let v = this.parseVar();
            let e = this.parseQExpr();
            return Expr.all(v, e);
        } else if (this.match("\\exists")) {
            let v = this.parseVar();
            let e = this.parseQExpr();
            return Expr.exists(v, e);
        } else if (this.match("(\\forall")) {
            let v = this.parseVar();
            this.match(")", true);
            let e = this.parseQExpr();
            return Expr.all(v, e);
        } else if (this.match("(\\exists")) {
            let v = this.parseVar();
            this.match(")", true);
            let e = this.parseQExpr();
            return Expr.exists(v, e);
        } else if (this.match("\\lnot")) {
            let e = this.parseQExpr();
            return Expr.not(e);
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
                return Expr.pred(v, args);
            } else {
                return Expr.prop(v);
            }
        } else if (this.match("\\bot")) {
            return Expr.false;
        } else if (this.match("\\top")) {
            return Expr.true;
        } else {
            this.errors.push(`Unrecognized term: '${this.source}'`);
            return null;
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
        return this.source.match(/^[A-Za-z]/) || this.source.startsWith("\\_");
    }

    // TODO allow multichar identifiers wrapped in \text{}, \mathrm{}, etc.?
    parseVar() {
        let m = this.source.match(/^[A-Za-z](_(\d|{\d+}))?/);
        if (m) {
            let v = m[0];
            this.match(v);
            return v;
        } else if (this.match("\\_")) {
            return "\\_";
        } else {
            this.errors.push(`Expected identifier: '${this.source}'`);
            return null;
        }
    }
}

export class Expr {
    #op;

    constructor(op) {
        this.#op = op;
    }

    get op() {
        return this.#op;
    }

    static implies(e1, e2) {
        let e = new Expr("implies");
        e.e1 = e1;
        e.e2 = e2;
        return e;
    }

    static and(e1, e2) {
        let e = new Expr("and");
        e.e1 = e1;
        e.e2 = e2;
        return e;
    }

    static or(e1, e2) {
        let e = new Expr("or");
        e.e1 = e1;
        e.e2 = e2;
        return e;
    }

    static not(e1) {
        let e = new Expr("not");
        e.e = e1;
        return e;
    }

    static all(v, e1) {
        let e = new Expr("all");
        e.v = v;
        e.e = e1;
        return e;
    }

    static exists(v, e1) {
        let e = new Expr("exists");
        e.v = v;
        e.e = e1;
        return e;
    }

    static pred(v, args) {
        let e = new Expr("pred");
        e.v = v;
        e.args = args;
        return e;
    }

    static prop(v) {
        let e = new Expr("prop");
        e.v = v;
        return e;
    }

    static true = new Expr("true");
    static false = new Expr("false");

    paren(s, level, min) {
        if (level > min) {
            return "(" + s + ")";
        } else {
            return s;
        }
    }

    render(level = 0) {
        switch (this.#op) {
            case "not":
                return this.paren("\\lnot " + this.e.render(3), level, 3);

            case "implies":
                return this.paren(this.e1.render(1) + "\\rightarrow " + this.e2.render(0), level, 0);

            case "or":
                return this.paren(this.e1.render(1) + "\\lor " + this.e2.render(2), level, 1);

            case "and":
                return this.paren(this.e1.render(2) + "\\land " + this.e2.render(3), level, 2);

            case "all":
                return this.paren("\\forall " + this.v + this.e.render(4), level, 4);

            case "exists":
                return this.paren("\\exists " + this.v + this.e.render(4), level, 4);

            case "true":
                return "\\top";

            case "false":
                return "\\bot";

            case "prop":
                return this.paren(this.v, level, 3);

            case "pred":
                return this.paren(this.v + "(" + this.args + ")", level, 3);
        }
    }
}

// TODO delete this
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

export class ExprSlot extends HTMLSpanElement {
    #expr;

    constructor() {
        super();
        this.classList.add("expr-slot");
    }

    get expr() {
        return this.#expr;
    }

    set expr(expr) {
        this.#expr = expr;
        this.update();
    }

    update() {
        this.innerText = `\\(${this.#expr.render()}\\)`;
        MathLive.renderMathInElement(this);
    }
}

class VarSlot extends HTMLSpanElement {
    #variable;

    constructor() {
        super();
        this.classList.add("var-slot");
    }

    get variable() {
        return this.#variable;
    }

    set variable(variable) {
        this.#variable = variable;
        this.update();
    }

    update() {
        this.innerText = `\\(${this.#variable.name}\\)`;
        MathLive.renderMathInElement(this);
    }
}

class NodeSlot extends HTMLSpanElement {
    #node;

    constructor() {
        super();
        this.classList.add("node-slot");
    }

    get node() {
        return this.#node;
    }

    set node(node) {
        this.#node = node;
        this.update();
    }

    update() {
        this.replaceChildren(this.#node);
        this.#node.update();
    }
}

customElements.define("expr-slot", ExprSlot, { extends: "span" });
customElements.define("var-slot", VarSlot, { extends: "span" });
customElements.define("node-slot", NodeSlot, { extends: "span" });

class Node extends HTMLDivElement {
    constructor() {
        super();
        this.classList.add("node");
    }
}

export class UnknownIntro extends Node {
    #expr;
    #exprSlot;

    constructor() {
        super();
        this.classList.add("unknown-intro");
    }

    connectedCallback() {
        this.#exprSlot = new ExprSlot();
        this.append("?: ", this.#exprSlot);
    }

    // TODO handle drops and keypresses

    get expr() {
        return this.#expr;
    }

    set expr(expr) {
        this.#expr = expr;
        this.update();
    }

    update() {
        if (this.#exprSlot) {
            this.#exprSlot.expr = this.#expr;
        }
    }
}

customElements.define("unknown-intro", UnknownIntro, { extends: "div" });

export class VarIntro extends Node {
    #varSlot;
    #exprSlot;

    constructor() {
        super();
        this.classList.add("var-intro");
    }

    connectedCallback() {
        this.#varSlot = new VarSlot();
        this.#exprSlot = new ExprSlot();
        this.append(this.#varSlot, ": ", this.#exprSlot);
    }

    get variable() {
        return this.#varSlot.variable;
    }

    set variable(variable) {
        this.#varSlot.variable = variable;
    }

    get expr() {
        return this.#exprSlot.expr;
    }

    set expr(expr) {
        this.#exprSlot.expr = expr;
    }

    update() {
        this.#varSlot.update();
        this.#exprSlot.update();
    }
}

customElements.define("var-intro", VarIntro, { extends: "div" });

function tag(name, attrs, children) {
    const e = document.createElement(name);
    if (attrs) {
        Object.keys(attrs).forEach(key => {
            e.setAttribute(key, attrs[key]);
        });
    }
    if (children) {
        e.append(...children);
    }
    return e;
}

export class AndIntro extends Node {
    #expr;
    #node1;
    #node2;

    constructor() {
        super();
        this.classList.add("and-intro");
    }

    connectedCallback() {
        this.#node1 = new NodeSlot();
        this.#node2 = new NodeSlot();
        this.#node1.node = new UnknownIntro();
        this.#node2.node = new UnknownIntro();

        this.append(
            "\\(\\land\\)-Intro",
            tag("br"),
            tag("ul", {}, [
                tag("li", {}, [
                    this.#node1,
                ]),
                tag("li", {}, [
                    this.#node2,
                ]),
            ]),
        );
    }

    get expr() {
        return this.#expr;
    }

    set expr(expr) {
        this.#expr = expr;
        this.update();
    }

    update() {
        if (this.#expr.op === "and") {
            this.#node1.node.expr = this.#expr.e1;
            this.#node2.node.expr = this.#expr.e2;
        } else {
            const n = new UnknownIntro();
            this.replaceWith(n);
            n.expr = this.#expr;
        }
    }
}

customElements.define("and-intro", AndIntro, { extends: "div" });

// TODO continue from here; next stop: Unification!

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
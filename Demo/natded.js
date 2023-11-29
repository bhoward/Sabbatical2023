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

    static wild() {
        let e = new Expr("wild"); // TODO generate a unique number?
        e.e = null;
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

            case "wild":
                if (this.e === null) {
                    return "\\_";
                } else {
                    return this.e.render(level);
                }
        }
    }

    static unify(e1, e2) {
        let bindings = [];
        if (e1.#unify(e2, bindings)) {
            bindings.forEach(pair => {
                const {w, b} = pair;
                w.e = b;
            });
            return true;
        } else {
            return false;
        }
    }

    #unify(that, bindings) {
        switch (this.#op) {
            case "not":
                return that.#unifyNot(this, bindings);

            case "implies":
                return that.#unifyImplies(this, bindings);

            case "or":
                return that.#unifyOr(this, bindings);

            case "and":
                return that.#unifyAnd(this, bindings);

            case "all":
                return that.#unifyAll(this, bindings);

            case "exists":
                return that.#unifyExists(this, bindings);

            case "true":
                return that.#unifyTrue(this, bindings);

            case "false":
                return that.#unifyFalse(this, bindings);

            case "prop":
                return that.#unifyProp(this, bindings);

            case "pred":
                return that.#unifyPred(this, bindings);

            case "wild":
                if (this.e === null) {
                    bindings.push({ w: this, b: that });
                    return true;
                } else {
                    return this.e.#unify(that, bindings);
                }
        }
    }

    #unifyNot(that, bindings) {
        if (this.op === "not") {
            return this.e.#unify(that.e, bindings);
        } else if (this.op === "wild") {
            if (this.e === null) {
                bindings.push({ w: this, b: that });
                return true;
            } else {
                return this.e.#unifyNot(that, bindings);
            }
        } else {
            return false;
        }
    }

    #unifyImplies(that, bindings) {
        if (this.op === "implies") {
            return this.e1.#unify(that.e1, bindings) && this.e2.#unify(that.e2, bindings);
        } else if (this.op === "wild") {
            if (this.e === null) {
                bindings.push({ w: this, b: that });
                return true;
            } else {
                return this.e.#unifyImplies(that, bindings);
            }
        } else {
            return false;
        }
    }


    #unifyOr(that, bindings) {
        if (this.op === "or") {
            return this.e1.#unify(that.e1, bindings) && this.e2.#unify(that.e2, bindings);
        } else if (this.op === "wild") {
            if (this.e === null) {
                bindings.push({ w: this, b: that });
                return true;
            } else {
                return this.e.#unifyOr(that, bindings);
            }
        } else {
            return false;
        }
    }

    #unifyAnd(that, bindings) {
        if (this.op === "and") {
            return this.e1.#unify(that.e1, bindings) && this.e2.#unify(that.e2, bindings);
        } else if (this.op === "wild") {
            if (this.e === null) {
                bindings.push({ w: this, b: that });
                return true;
            } else {
                return this.e.#unifyAnd(that, bindings);
            }
       } else {
            return false;
        }
    }

    #unifyAll(that, bindings) {
        if (this.op === "all") {
            return this.e.#unify(that.e, bindings); // TODO substitute for v
        } else if (this.op === "wild") {
            if (this.e === null) {
                bindings.push({ w: this, b: that });
                return true;
            } else {
                return this.e.#unifyAll(that, bindings);
            }
        } else {
            return false;
        }
    }

    #unifyExists(that, bindings) {
        if (this.op === "exists") {
            return this.e.#unify(that.e, bindings); // TODO substitute for v
        } else if (this.op === "wild") {
            if (this.e === null) {
                bindings.push({ w: this, b: that });
                return true;
            } else {
                return this.e.#unifyExists(that, bindings);
            }
       } else {
            return false;
        }
    }

    #unifyTrue(that, bindings) {
        if (this.op === "true") {
            return true;
        } else if (this.op === "wild") {
            if (this.e === null) {
                bindings.push({ w: this, b: that });
                return true;
            } else {
                return this.e.#unifyTrue(that, bindings);
            }
       } else {
            return false;
        }
    }

    #unifyFalse(that, bindings) {
        if (this.op === "false") {
            return true;
        } else if (this.op === "wild") {
            if (this.e === null) {
                bindings.push({ w: this, b: that });
                return true;
            } else {
                return this.e.#unifyFalse(that, bindings);
            }
        } else {
            return false;
        }
    }

    #unifyProp(that, bindings) {
        if (this.op === "prop") {
            return this.v === that.v;
        } else if (this.op === "wild") {
            if (this.e === null) {
                bindings.push({ w: this, b: that });
                return true;
            } else {
                return this.e.#unifyProp(that, bindings);
            }
        } else {
            return false;
        }
    }

    #unifyPred(that, bindings) {
        if (this.op === "pred") {
            return this.v === that.v; // TODO check the args
        } else if (this.op === "wild") {
            if (this.e === null) {
                bindings.push({ w: this, b: that });
                return true;
            } else {
                return this.e.#unifyPred(that, bindings);
            }
       } else {
            return false;
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

    constructor(expr = Expr.wild()) {
        super();
        this.classList.add("expr-slot");
        this.#expr = expr;
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

    constructor(variable) {
        super();
        this.classList.add("var-slot");
        this.#variable = variable;
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
    #expr;
    #exprSlot;

    constructor(expr) {
        super();
        this.classList.add("node");
        this.#expr = expr;
        this.#exprSlot = new ExprSlot(expr);
    }

    get expr() {
        return this.#expr;
    }

    unify(expr) {
        const result = Expr.unify(expr, this.#expr);
        this.update();
        return result;
    }

    get exprSlot() {
        return this.#exprSlot;
    }

    update() {
        this.#exprSlot.update();
    }
}

export class UnknownIntro extends Node {
    constructor(expr = Expr.wild()) {
        super(expr);
        this.classList.add("unknown-intro");
    }

    connectedCallback() {
        this.replaceChildren("?: ", this.exprSlot);
    }

    // TODO handle drops and keypresses

    update() {
        super.update();
    }
}

customElements.define("unknown-intro", UnknownIntro, { extends: "div" });

export class VarIntro extends Node {
    #varSlot;

    constructor(expr = Expr.wild()) {
        super(expr);
        this.classList.add("var-intro");
        this.#varSlot = new VarSlot();
    }

    connectedCallback() {
        this.replaceChildren(this.#varSlot, ": ", this.exprSlot);
    }

    get variable() {
        return this.#varSlot.variable;
    }

    set variable(variable) {
        this.#varSlot.variable = variable;
    }

    update() {
        super.update();
        this.#varSlot.update();
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
    #node1;
    #node2;

    constructor() {
        super(Expr.and(Expr.wild(), Expr.wild()));
        this.classList.add("and-intro");
        this.#node1 = new NodeSlot();
        this.#node2 = new NodeSlot();
        this.#node1.node = new UnknownIntro(this.expr.e1);
        this.#node2.node = new UnknownIntro(this.expr.e2);
    }

    connectedCallback() {
        this.replaceChildren(
            "\\(\\land\\)-Intro: ",
            this.exprSlot,
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

    update() {
        super.update();
        this.#node1.update();
        this.#node2.update();
    }
}

customElements.define("and-intro", AndIntro, { extends: "div" });

export class AndElim1 extends Node {
    #node;

    constructor(expr = Expr.wild()) {
        super(expr);
        this.classList.add("and-elim1");
        this.#node = new NodeSlot();
        this.#node.node = new UnknownIntro(Expr.and(expr, Expr.wild()));
    }

    connectedCallback() {
        this.replaceChildren(
            "\\(\\land\\)-Elim-1: ",
            this.exprSlot,
            tag("br"),
            this.#node,
        );
    }

    update() {
        super.update();
        this.#node.update();
    }
}

customElements.define("and-elim1", AndElim1, { extends: "div" });

export class AndElim2 extends Node {
    #node;

    constructor(expr = Expr.wild()) {
        super(expr);
        this.classList.add("and-elim2");
        this.#node = new NodeSlot();
        this.#node.node = new UnknownIntro(Expr.and(Expr.wild(), expr));
    }

    connectedCallback() {
        this.replaceChildren(
            "\\(\\land\\)-Elim-2: ",
            this.exprSlot,
            tag("br"),
            this.#node,
        );
    }

    update() {
        super.update();
        this.#node.update();
    }
}

customElements.define("and-elim2", AndElim2, { extends: "div" });

export class OrIntro1 extends Node {
    #node;

    constructor() {
        super(Expr.or(Expr.wild(), Expr.wild()));
        this.classList.add("or-intro1");
        this.#node = new NodeSlot();
        this.#node.node = new UnknownIntro(this.expr.e1);
    }

    connectedCallback() {
        this.replaceChildren(
            "\\(\\lor\\)-Intro-1: ",
            this.exprSlot,
            tag("br"),
            this.#node,
        );
    }

    update() {
        super.update();
        this.#node.update();
    }
}

customElements.define("or-intro1", OrIntro1, { extends: "div" });

export class OrIntro2 extends Node {
    #node;

    constructor() {
        super(Expr.or(Expr.wild(), Expr.wild()));
        this.classList.add("or-intro2");
        this.#node = new NodeSlot();
        this.#node.node = new UnknownIntro(this.expr.e2);
    }

    connectedCallback() {
        this.replaceChildren(
            "\\(\\lor\\)-Intro-2: ",
            this.exprSlot,
            tag("br"),
            this.#node,
        );
    }

    update() {
        super.update();
        this.#node.update();
    }
}

customElements.define("or-intro2", OrIntro2, { extends: "div" });

export class OrElim extends Node {
    #node;
    #var1;
    #expr1;
    #node1;
    #var2;
    #expr2;
    #node2;

    // TODO the variables x_1 and x_2 need to be draggable and editable (or at least unique)
    constructor() {
        super(Expr.wild());
        this.classList.add("or-elim");
        this.#node = new NodeSlot();
        this.#node.node = new UnknownIntro(Expr.or(Expr.wild(), Expr.wild()));
        this.#var1 = new VarSlot({ name: "x_1" }); // TODO
        this.#expr1 = new ExprSlot(this.expr.e1);
        this.#node1 = new NodeSlot();
        this.#node1.node = new UnknownIntro(this.expr);
        this.#var2 = new VarSlot({ name: "x_2" }); // TODO
        this.#expr2 = new ExprSlot(this.expr.e2);
        this.#node2 = new NodeSlot();
        this.#node2.node = new UnknownIntro(this.expr);
    }

    connectedCallback() {
        this.replaceChildren(
            "\\(\\lor\\)-Elim: ",
            this.exprSlot,
            tag("br"),
            this.#node,
            tag("ul", {}, [
                tag("li", {}, [
                    this.#var1,
                    ": ",
                    this.#expr1,
                    " \\(\\Rightarrow\\)",
                    this.#node1,
                ]),
                tag("li", {}, [
                    this.#var2,
                    ": ",
                    this.#expr2,
                    " \\(\\Rightarrow\\)",
                    this.#node2,
                ]),
            ]),
        );
        MathLive.renderMathInElement(this);
    }

    update() {
        super.update();
        this.#node.update();
        this.#var1.update();
        this.#expr1.update();
        this.#node1.update();
        this.#var2.update();
        this.#expr2.update();
        this.#node2.update();
    }
}

customElements.define("or-elim", OrElim, { extends: "div" });

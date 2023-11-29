import * as MathLive from "//unpkg.com/mathlive?module";
import { Parser } from "./parser.js";
import { Expr } from "./expr.js";

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

let gensym = (() => {
    let seq = 0;
    return () => ("x" + seq++)
})();

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

customElements.define("expr-slot", ExprSlot, { extends: "span" });

class VarSlot extends HTMLSpanElement {
    #variable;

    constructor(variable = { name: "\\_" }) {
        super();
        this.classList.add("var-slot");
        this.#variable = variable;
        this.id = gensym();
        this.draggable = true;
        this.contentEditable = true;
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

customElements.define("var-slot", VarSlot, { extends: "span" });

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
        MathLive.renderMathInElement(this);
    }
}

export class UnknownIntro extends Node {
    constructor(expr = Expr.wild()) {
        super(expr);
        this.classList.add("unknown-intro");
    }

    connectedCallback() {
        this.replaceChildren("?: ", this.exprSlot);
        this.update();
    }

    // TODO handle drops and keypresses

    update() {
        super.update();
    }
}

customElements.define("unknown-intro", UnknownIntro, { extends: "div" });

export class VarIntro extends Node {
    #varSlot; // TODO this should not be draggable

    constructor(expr = Expr.wild()) {
        super(expr);
        this.classList.add("var-intro");
        this.#varSlot = new VarSlot();
    }

    connectedCallback() {
        this.replaceChildren(this.#varSlot, ": ", this.exprSlot);
        this.update();
    }

    get variable() {
        return this.#varSlot.variable;
    }

    set variable(variable) {
        this.#varSlot.variable = variable;
    }

    update() {
        this.#varSlot.update();
        super.update();
    }
}

customElements.define("var-intro", VarIntro, { extends: "div" });

export class TrueIntro extends Node {
    constructor() {
        super(Expr.true);
        this.classList.add("true-intro");
    }

    connectedCallback() {
        this.replaceChildren(
            "\\(\\top\\)-Intro: ",
            this.exprSlot,
        );
        this.update();
    }

    update() {
        super.update();
    }
}

customElements.define("true-intro", TrueIntro, { extends: "div" });

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
        this.update();
    }

    update() {
        this.#node1.update();
        this.#node2.update();
        super.update();
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
        this.update();
    }

    update() {
        this.#node.update();
        super.update();
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
        this.update();
    }

    update() {
        this.#node.update();
        super.update();
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
        this.update();
    }

    update() {
        this.#node.update();
        super.update();
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
        this.update();
    }

    update() {
        this.#node.update();
        super.update();
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

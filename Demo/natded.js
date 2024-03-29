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
    return (prefix) => (prefix + seq++)
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
    #expr;

    constructor(prefix, expr) {
        super();
        this.classList.add("var-slot");
        let v = gensym(prefix);
        this.id = v;
        this.#variable = {
            name: `${v.substring(0, prefix.length)}_{${v.substring(prefix.length)}}`,
        };
        this.#expr = expr;
        this.draggable = true;
        // this.contentEditable = true; // TODO
    }

    get variable() {
        return this.#variable;
    }

    set variable(variable) {
        this.#variable = variable;
        this.update();
    }

    get intro() {
        let v = new VarIntro(this.#expr);
        v.variable = this.#variable;
        return v;
    }

    update() {
        this.innerText = `\\(${this.#variable.name}\\)`;
        MathLive.renderMathInElement(this);
    }
}

customElements.define("var-slot", VarSlot, { extends: "span" });

class NodeSlot extends HTMLSpanElement {
    #node;

    constructor(node) {
        super();
        this.classList.add("node-slot");
        this.#node = node;
    }

    get node() {
        return this.#node;
    }

    set node(node) {
        if (this.#node.unify(node.expr)) {
            this.#node = node;
            this.update();
        }
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
        this.id = gensym("n");
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

        const self = this;
        let counter = 0;
        this.addEventListener("dragover", (event) => {
            if (event.target.closest(".scope")) {
                event.preventDefault();
            }
        });
        this.addEventListener("dragenter", (event) => {
            if (counter === 0) {
                self.classList.add("drop-target");
            }
            counter++;
        });
        this.addEventListener("dragleave", (event) => {
            counter--;
            if (counter === 0) {
                self.classList.remove("drop-target");
            }
        });
        this.addEventListener("drop", (event) => {
            self.classList.remove("drop-target");

            const id = event.dataTransfer.getData("text/plain");
            if (id.startsWith("x")) {
                const v = document.getElementById(id);
                const slot = self.closest(".node-slot");
                slot.node = v.intro;
                // TODO update the whole tree; the following is just a hack
                slot.closest(".implies-intro").update();
            }

            event.preventDefault();
        });
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
    #varSlot;

    constructor(expr = Expr.wild()) {
        super(expr);
        this.classList.add("var-intro");
        this.#varSlot = new VarSlot("x", expr);
        this.#varSlot.draggable = false;
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
        this.update();
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
        this.#node1 = new NodeSlot(new UnknownIntro(this.expr.e1));
        this.#node2 = new NodeSlot(new UnknownIntro(this.expr.e2));
    }

    set node1(node) {
        this.#node1.node = node;
        this.update();
    }

    set node2(node) {
        this.#node2.node = node;
        this.update();
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
        this.#node = new NodeSlot(new UnknownIntro(Expr.and(expr, Expr.wild())));
    }

    set node(node) {
        this.#node.node = node;
        this.update();
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
        this.#node = new NodeSlot(new UnknownIntro(Expr.and(Expr.wild(), expr)));
    }

    set node(node) {
        this.#node.node = node;
        this.update();
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
        this.#node = new NodeSlot(new UnknownIntro(this.expr.e1));
    }

    set node(node) {
        this.#node.node = node;
        this.update();
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
        this.#node = new NodeSlot(new UnknownIntro(this.expr.e2));
    }

    set node(node) {
        this.#node.node = node;
        this.update();
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

    constructor() {
        super(Expr.wild());
        this.classList.add("or-elim");
        this.#node = new NodeSlot(new UnknownIntro(Expr.or(Expr.wild(), Expr.wild())));
        this.#expr1 = new ExprSlot(this.#node.node.expr.e1);
        this.#var1 = new VarSlot("x", this.#expr1.expr);
        this.#node1 = new NodeSlot(new UnknownIntro(this.expr));
        this.#expr2 = new ExprSlot(this.#node.node.expr.e2);
        this.#var2 = new VarSlot("x", this.#expr2.expr);
        this.#node2 = new NodeSlot(new UnknownIntro(this.expr));
    }

    set node(node) {
        this.#node.node = node;
        this.update();
    }
    
    set node1(node) {
        this.#node1.node = node;
        this.update();
    }
    
    set node2(node) {
        this.#node2.node = node;
        this.update();
    }
    
    // TODO these are temporary
    get var1() {
        return this.#var1.intro;
    }

    get var2() {
        return this.#var2.intro;
    }

    connectedCallback() {
        let leftBranch = tag("li", {}, [
            this.#var1,
            ": ",
            this.#expr1,
            " \\(\\Rightarrow\\)",
            this.#node1,
        ]);
        leftBranch.addEventListener("dragstart", (event) => {
            this.#node1.classList.add("scope");
            event.dataTransfer.setData("text/plain", event.target.id);
            event.dataTransfer.effectAllowed = "copy";
        });
        leftBranch.addEventListener("dragend", (event) => {
            this.#node1.classList.remove("scope");
        });

        let rightBranch = tag("li", {}, [
            this.#var2,
            ": ",
            this.#expr2,
            " \\(\\Rightarrow\\)",
            this.#node2,
        ]);
        rightBranch.id = this.id + "R";
        rightBranch.addEventListener("dragstart", (event) => {
            this.#node2.classList.add("scope");
            event.dataTransfer.setData("text/plain", event.target.id);
            event.dataTransfer.effectAllowed = "copy";
        });
        rightBranch.addEventListener("dragend", (event) => {
            this.#node2.classList.remove("scope");
        });

        this.replaceChildren(
            "\\(\\lor\\)-Elim: ",
            this.exprSlot,
            tag("br"),
            this.#node,
            tag("ul", {}, [
                leftBranch,
                rightBranch,
            ]),
        );
        // this.addEventListener("dragstart", (event) => {
        //     console.log(event.target.id);
        //     event.dataTransfer.setData("contentID", event.target.id);
        //     event.dataTransfer.effectAllowed = "copy";
        // });
        this.update();
    }

    update() {
        this.#node.update();
        this.#var1.update();
        this.#expr1.update();
        this.#node1.update();
        this.#var2.update();
        this.#expr2.update();
        this.#node2.update();
        super.update();
    }
}

customElements.define("or-elim", OrElim, { extends: "div" });

export class FalseElim extends Node {
    #node;

    constructor() {
        super(Expr.wild());
        this.classList.add("false-elim");
        this.#node = new NodeSlot(new UnknownIntro(Expr.false));
    }

    set node(node) {
        this.#node.node = node;
        this.update();
    }

    connectedCallback() {
        this.replaceChildren(
            "\\(\\bot\\)-Elim: ",
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

customElements.define("false-elim", FalseElim, { extends: "div" });

export class ImpliesIntro extends Node {
    #var;
    #expr;
    #node;

    constructor() {
        super(Expr.implies(Expr.wild(), Expr.wild()));
        this.classList.add("implies-intro");
        this.#expr = new ExprSlot(this.expr.e1);
        this.#var = new VarSlot("x", this.#expr.expr);
        this.#node = new NodeSlot(new UnknownIntro(this.expr.e2));
    }

    set node(node) {
        this.#node.node = node;
        this.update();
    }
    
    // TODO temporary
    get var() {
        return this.#var.intro;
    }

    connectedCallback() {
        const body = tag("div", {}, [
            this.#var,
            ": ",
            this.#expr,
            " \\(\\Rightarrow\\)",
            this.#node,
        ]);
        body.addEventListener("dragstart", (event) => {
            this.#node.classList.add("scope");
            event.dataTransfer.setData("text/plain", event.target.id);
            event.dataTransfer.effectAllowed = "copy";
        });
        body.addEventListener("dragend", (event) => {
            this.#node.classList.remove("scope");
        });

        this.replaceChildren(
            "\\(\\rightarrow\\)-Intro: ",
            this.exprSlot,
            tag("br"),
            body,
        );
        this.update();
    }

    update() {
        this.#var.update();
        this.#expr.update();
        this.#node.update();
        super.update();
    }
}

customElements.define("implies-intro", ImpliesIntro, { extends: "div" });

export class ImpliesElim extends Node {
    #node1;
    #node2;

    constructor() {
        super(Expr.wild());
        this.classList.add("implies-elim");
        let arg = Expr.wild();
        this.#node1 = new NodeSlot(new UnknownIntro(Expr.implies(arg, this.expr)));
        this.#node2 = new NodeSlot(new UnknownIntro(arg));
    }

    set node1(node) {
        this.#node1.node = node;
        this.update();
    }

    set node2(node) {
        this.#node2.node = node;
        this.update();
    }

    connectedCallback() {
        this.replaceChildren(
            "\\(\\rightarrow\\)-Elim: ",
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

customElements.define("implies-elim", ImpliesElim, { extends: "div" });

export class NotIntro extends Node {
    #var;
    #expr;
    #node;

    constructor() {
        super(Expr.not(Expr.wild()));
        this.classList.add("not-intro");
        this.#expr = new ExprSlot(this.expr.e);
        this.#var = new VarSlot("x", this.#expr.expr);
        this.#node = new NodeSlot(new UnknownIntro(Expr.false));
    }

    set node(node) {
        this.#node.node = node;
        this.update();
    }
    
    // TODO temporary
    get var() {
        return this.#var.intro;
    }

    connectedCallback() {
        const body = tag("div", {}, [
            this.#var,
            ": ",
            this.#expr,
            " \\(\\Rightarrow\\)",
            this.#node,
        ]);
        body.addEventListener("dragstart", (event) => {
            this.#node.classList.add("scope");
            event.dataTransfer.setData("text/plain", event.target.id);
            event.dataTransfer.effectAllowed = "copy";
        });
        body.addEventListener("dragend", (event) => {
            this.#node.classList.remove("scope");
        });

        this.replaceChildren(
            "\\(\\lnot\\)-Intro: ",
            this.exprSlot,
            tag("br"),
            body,
        );
        this.update();
    }

    update() {
        this.#var.update();
        this.#expr.update();
        this.#node.update();
        super.update();
    }
}

customElements.define("not-intro", NotIntro, { extends: "div" });

export class NotElim extends Node {
    #node1;
    #node2;

    constructor() {
        super(Expr.false);
        this.classList.add("not-elim");
        let arg = Expr.wild();
        this.#node1 = new NodeSlot(new UnknownIntro(Expr.not(arg)));
        this.#node2 = new NodeSlot(new UnknownIntro(arg));
    }

    set node1(node) {
        this.#node1.node = node;
        this.update();
    }

    set node2(node) {
        this.#node2.node = node;
        this.update();
    }

    connectedCallback() {
        this.replaceChildren(
            "\\(\\lnot\\)-Elim: ",
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

customElements.define("not-elim", NotElim, { extends: "div" });

export class NotNotElim extends Node {
    #node;

    constructor() {
        super(Expr.wild());
        this.classList.add("notnot-elim");
        this.#node = new NodeSlot(new UnknownIntro(Expr.not(Expr.not(this.expr))));
    }

    set node(node) {
        this.#node.node = node;
        this.update();
    }

    connectedCallback() {
        this.replaceChildren(
            "\\(\\lnot\\lnot\\)-Elim: ",
            this.exprSlot,
            tag("br"),
            this.#node
        );
        this.update();
    }

    update() {
        this.#node.update();
        super.update();
    }
}

customElements.define("notnot-elim", NotNotElim, { extends: "div" });
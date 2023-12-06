import * as MathLive from "//unpkg.com/mathlive?module";
import { Parser } from "./parser.js";
import { Expr } from "./expr.js";

function createTemplate(templateText) {
    const dom = new DOMParser().parseFromString(templateText, "text/html");
    const template = dom.querySelector("template");
    return template;
}

export class VarSlot extends HTMLElement {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <span class="var-slot" id="var"></span>
    </template>`);

    #span;
    #variable;

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));

        this.#span = shadowRoot.getElementById("var");
        this.#variable = { name: "x_0" }; // TODO
    }

    connectedCallback() {
        this.update();
    }

    update() {
        this.#span.replaceChildren(`\\(${this.#variable.name}\\)`);
        MathLive.renderMathInElement(this.#span);
    }
}

export class ExprSlot extends HTMLElement {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <span class="expr-slot" id="content"></span>
    </template>`);

    #expr;
    #content;

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));

        this.#expr = Expr.wild();
        this.#content = shadowRoot.getElementById("content");
    }

    connectedCallback() {
        this.update();
    }

    update() {
        this.#content.replaceChildren(`\\(${this.#expr.render()}\\)`);
        MathLive.renderMathInElement(this.#content);
    }
}

export class Node extends HTMLElement {
    #expr;
    #exprslot;

    constructor(expr) {
        super();
        this.#expr = expr;
    }

    get expr() {
        return this.#expr;
    }

    set exprslot(exprslot) {
        this.#exprslot = exprslot;
    }

    get exprslot() {
        return this.#exprslot;
    }

    unify(expr) {
        const result = Expr.unify(expr, this.#expr);
        if (result) {
            this.update();
        }
        return result;
    }

    update() {
        this.#exprslot.update();
        MathLive.renderMathInElement(this.shadowRoot);
    }
}

export class UnknownIntro extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node unknown-intro">
            ?: <expr-slot id="e1"></expr-slot>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

export class VarIntro extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node var-intro">
            <var-slot id="v1"></var-slot>: <expr-slot id="e1"></expr-slot>
        </div>
    </template>`);

    #varslot;
    #ref;

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");

        this.#varslot = shadowRoot.getElementById("v1");
        this.#ref = this.getAttribute("ref");
        console.log(this.#ref);
    }

    update() {
        this.#varslot.update();
        super.update();
    }
}

export class TrueIntro extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node true-intro">
            \\(\\top\\)-Intro: <expr-slot id="e1"></expr-slot>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

export class AndIntro extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node and-intro">
            \\(\\land\\)-Intro: <expr-slot id="e1"></expr-slot>
            <ul>
              <li><slot name="left"></slot></li>
              <li><slot name="right"></slot></li>
            </ul>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

export class AndElim1 extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node and-elim1">
            \\(\\land\\)-Elim1: <expr-slot id="e1"></expr-slot><slot></slot>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

export class AndElim2 extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node and-elim2">
            \\(\\land\\)-Elim2: <expr-slot id="e1"></expr-slot><slot></slot>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

export class OrIntro1 extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node or-intro1">
            \\(\\lor\\)-Intro1: <expr-slot id="e1"></expr-slot><slot></slot>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

export class OrIntro2 extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node or-intro2">
            \\(\\lor\\)-Intro2: <expr-slot id="e1"></expr-slot><slot></slot>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

export class OrElim extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node or-elim">
            \\(\\lor\\)-Elim: <expr-slot id="e1"></expr-slot>
        </div>
    </template>`); // TODO

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

export class FalseElim extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node false-elim">
            \\(\\bot\\)-Elim: <expr-slot id="e1"></expr-slot><slot></slot>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

export class ImpliesIntro extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node implies-intro">
            \\(\\rightarrow\\)-Intro: <expr-slot id="e1"></expr-slot><br />
            <div>
              <var-slot id="v1"></var-slot>: <expr-slot id="e1"></expr-slot>
              \\(\\Rightarrow\\)<slot></slot>
            </div>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
        this.update();
    }

    update() {
        super.update();
    }
}

export class ImpliesElim extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node implies-elim">
            \\(\\rightarrow\\)-Elim: <expr-slot id="e1"></expr-slot>
            <slot name="arg"></slot>
            <slot></slot>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

export class NotIntro extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node not-intro">
            \\(\\lnot\\)-Intro: <expr-slot id="e1"></expr-slot>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

export class NotElim extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node not-elim">
            \\(\\lnot\\)-Elim: <expr-slot id="e1"></expr-slot>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

export class NotNotElim extends Node {
    static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node notnot-elim">
            \\(\\lnot\\lnot\\)-Elim: <expr-slot id="e1"></expr-slot>
        </div>
    </template>`);

    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
        this.exprslot = shadowRoot.getElementById("e1");
    }

    update() {
        super.update();
    }
}

customElements.define("var-slot", VarSlot);
customElements.define("expr-slot", ExprSlot);
customElements.define("unknown-intro", UnknownIntro);
customElements.define("var-intro", VarIntro);
customElements.define("true-intro", TrueIntro);
customElements.define("and-intro", AndIntro);
customElements.define("and-elim1", AndElim1);
customElements.define("and-elim2", AndElim2);
customElements.define("or-intro1", OrIntro1);
customElements.define("or-intro2", OrIntro2);
customElements.define("or-elim", OrElim);
customElements.define("false-elim", FalseElim);
customElements.define("implies-intro", ImpliesIntro);
customElements.define("implies-elim", ImpliesElim);
customElements.define("not-intro", NotIntro);
customElements.define("not-elim", NotElim);
customElements.define("notnot-elim", NotNotElim);

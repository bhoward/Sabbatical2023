import * as MathLive from "//unpkg.com/mathlive?module";
import { Parser } from "./parser.js";
import { Expr } from "./expr.js";

function createTemplate(templateText) {
    const dom = new DOMParser().parseFromString(templateText, 'text/html');
    const template = dom.querySelector('template');
    return template;
}

export class ExprSlot extends HTMLElement {
    static template = createTemplate(`
    <template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <span class="expr-slot" id="content"></span>
    </template>
    `);

    #expr;
    #content;

    constructor() {
        super();
        this.#expr = Expr.wild();
        this.classList.add("expr-slot");
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(ExprSlot.template.content.cloneNode(true));
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

export class UnknownIntro extends HTMLElement {
    static template = createTemplate(`
    <template>
        <link rel="stylesheet" href="./natded.css" />
        <div class="node unknown-intro">
            ?: <expr-slot id="e1"></expr-slot>
        </div>
    </template>
    `);

    #expr;
    #exprslot;

    constructor() {
        super();
        // this.classList.add("node");
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(UnknownIntro.template.content.cloneNode(true));
    }
}

customElements.define("expr-slot", ExprSlot);
customElements.define("unknown-intro", UnknownIntro);
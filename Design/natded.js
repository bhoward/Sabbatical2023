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

export class UnknownIntro extends HTMLElement {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./natded.css" />
        <div class="node unknown-intro">
            ?: <expr-slot id="e1"></expr-slot>
        </div>
    </template>`);

  #expr;
  #exprslot;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));

    this.#expr = Expr.wild();
    this.#exprslot = shadowRoot.getElementById("e1");
  }

  update() {
    this.#exprslot.update();
  }
}

export class VarIntro extends HTMLElement {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./natded.css" />
        <div class="node var-intro">
            <var-slot id="v1"></var-slot>: <expr-slot id="e1"></expr-slot>
        </div>
    </template>`);

  #expr;
  #varslot;
  #ref;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));

    this.#expr = Expr.wild();
    this.#varslot = shadowRoot.getElementById("v1");
    this.#ref = this.getAttribute("ref");
    console.log(this.#ref);
  }

  update() {
    this.#varslot.update();
  }
}

customElements.define("var-slot", VarSlot);
customElements.define("expr-slot", ExprSlot);
customElements.define("unknown-intro", UnknownIntro);
customElements.define("var-intro", VarIntro);

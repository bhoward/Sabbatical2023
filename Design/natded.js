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
    this.#variable = { name: "?" };
  }

  get variable() {
    return this.#variable
  }

  set variable(variable) {
    this.#variable = variable;
  }

  update(thm) {
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

  set expr(expr) {
    this.#expr = expr;
  }

  get expr() {
    return this.#expr;
  }

  update(thm) {
    this.#content.replaceChildren(`\\(${this.#expr.render()}\\)`);
    MathLive.renderMathInElement(this.#content);
  }
}

// Every Node subclass has a static template field to be used to construct
// the shadow DOM for the node. It should include an expr-slot element with
// id="e1" to display the result formula of the node.
export class Node extends HTMLElement {
  #exprslot;

  constructor(expr = Expr.wild()) {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));
    this.#exprslot = shadowRoot.getElementById("e1");
    this.#exprslot.expr = expr;
  }

  get expr() {
    return this.#exprslot.expr;
  }

  get exprslot() {
    return this.#exprslot;
  }

  unify(expr) {
    const result = Expr.unify(expr, this.expr);
    if (result) {
      this.update(thm);
    }
    return result;
  }

  update(thm) {
    this.#exprslot.update(thm);
    MathLive.renderMathInElement(this.shadowRoot);
  }
}

export class BinderNode extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node binder-node">
              <var-slot id="v1"></var-slot>: <expr-slot id="e1"></expr-slot>
              \\(\\Rightarrow\\)<slot id="main"></slot>
        </div>
    </template>`);

  #varSlot;
  #mainSlot;

  constructor() {
    super();

    this.#varSlot = this.shadowRoot.getElementById("v1");
    this.#mainSlot = this.shadowRoot.getElementById("main");
  }

  get variable() {
    return this.#varSlot.variable;
  }

  update(thm) {
    this.#varSlot.variable.name = thm.genName();
    this.#varSlot.update(thm);
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class HypothesisItem extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node hypothesis-item">
            <var-slot id="v1"></var-slot>: <expr-slot id="e1"></expr-slot>
        </div>
    </template>`);

  #varSlot;

  constructor() {
    super();

    this.#varSlot = this.shadowRoot.getElementById("v1");
  }

  get variable() {
    return this.#varSlot.variable;
  }

  update(thm) {
    this.#varSlot.variable.name = thm.genName();
    this.#varSlot.update(thm);
    super.update(thm);
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
  }

  update(thm) {
    super.update(thm);
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

    this.#varslot = this.shadowRoot.getElementById("v1");
    this.#ref = this.getAttribute("ref");
  }

  update(thm) {
    let r = document.getElementById(this.#ref);
    if (r.variable) { // TODO make this always true
      this.#varslot.variable = r.variable;
    } else {
      console.log("no variable");
    }

    this.#varslot.update(thm);
    super.update(thm);
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
    super(Expr.true);
  }

  update(thm) {
    super.update(thm);
  }
}

export class AndIntro extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node and-intro">
            \\(\\land\\)-Intro: <expr-slot id="e1"></expr-slot>
            <ul>
              <li><slot name="left" id="left"></slot></li>
              <li><slot name="right" id="right"></slot></li>
            </ul>
        </div>
    </template>`);

  #leftSlot;
  #rightSlot;

  constructor() {
    super(Expr.and(Expr.wild(), Expr.wild()));

    this.#leftSlot = this.shadowRoot.getElementById("left");
    this.#rightSlot = this.shadowRoot.getElementById("right");
  }

  update(thm) {
    this.#leftSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    this.#rightSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class AndElim1 extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node and-elim1">
            \\(\\land\\)-Elim1: <expr-slot id="e1"></expr-slot>
            <slot id="main"></slot>
        </div>
    </template>`);

  #mainSlot;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
  }

  update(thm) {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class AndElim2 extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node and-elim2">
            \\(\\land\\)-Elim2: <expr-slot id="e1"></expr-slot>
            <slot id="main"></slot>
        </div>
    </template>`);

  #mainSlot;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
  }

  update(thm) {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class OrIntro1 extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node or-intro1">
            \\(\\lor\\)-Intro1: <expr-slot id="e1"></expr-slot>
            <slot id="main"></slot>
        </div>
    </template>`);

  #mainSlot;

  constructor() {
    super(Expr.or(Expr.wild(), Expr.wild()));

    this.#mainSlot = this.shadowRoot.getElementById("main");
  }

  update(thm) {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class OrIntro2 extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node or-intro2">
            \\(\\lor\\)-Intro2: <expr-slot id="e1"></expr-slot>
            <slot id="main"></slot>
        </div>
    </template>`);

  #mainSlot;

  constructor() {
    super(Expr.or(Expr.wild(), Expr.wild()));

    this.#mainSlot = this.shadowRoot.getElementById("main");
  }

  update(thm) {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class OrElim extends Node {
  static template = createTemplate(`<template>
      <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
      <link rel="stylesheet" href="./natded.css" />
      <div class="node or-elim">
          \\(\\lor\\)-Elim: <expr-slot id="e1"></expr-slot>
          <slot id="main"></slot>
          <ul>
            <li><slot name="left" id="left"></slot></li>
            <li><slot name="right" id="right"></slot></li>
          </ul>
      </div>
    </template>`);

  #mainSlot;
  #leftSlot;
  #rightSlot;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
    this.#leftSlot = this.shadowRoot.getElementById("left"); // should contain a binder-node
    this.#rightSlot = this.shadowRoot.getElementById("right"); // should contain a binder-node
  }

  update(thm) {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    this.#leftSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    this.#rightSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class FalseElim extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node false-elim">
            \\(\\bot\\)-Elim: <expr-slot id="e1"></expr-slot>
            <slot id="main"></slot>
        </div>
    </template>`);

  #mainSlot;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
  }

  update(thm) {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class ImpliesIntro extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node implies-intro">
            \\(\\rightarrow\\)-Intro: <expr-slot id="e1"></expr-slot>
            <slot id="main"></slot>
        </div>
    </template>`);

  #mainslot;

  constructor() {
    super(Expr.implies(Expr.wild(), Expr.wild()));

    this.#mainslot = this.shadowRoot.getElementById("main"); // should contain a binder-node
  }

  update(thm) {
    this.#mainslot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class ImpliesElim extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node implies-elim">
            \\(\\rightarrow\\)-Elim: <expr-slot id="e1"></expr-slot>
            <slot id="main"></slot>
            <slot name="arg" id="arg"></slot>
        </div>
    </template>`);

  #mainSlot;
  #argSlot;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
    this.#argSlot = this.shadowRoot.getElementById("arg");
  }

  update(thm) {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    this.#argSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class NotIntro extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node not-intro">
            \\(\\lnot\\)-Intro: <expr-slot id="e1"></expr-slot>
            <slot id="main"></slot>
        </div>
    </template>`);

  #mainSlot;

  constructor() {
    super(Expr.not(Expr.wild()));

    this.#mainSlot = this.shadowRoot.getElementById("main"); // should contain a binder-node
  }

  update(thm) {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class NotElim extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node not-elim">
            \\(\\lnot\\)-Elim: <expr-slot id="e1"></expr-slot>
            <slot id="main"></slot>
            <slot name="arg" id="arg"></slot>
        </div>
    </template>`);

  #mainSlot;
  #argSlot;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
    this.#argSlot = this.shadowRoot.getElementById("arg");
  }

  update(thm) {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    this.#argSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class NotNotElim extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node notnot-elim">
            \\(\\lnot\\lnot\\)-Elim: <expr-slot id="e1"></expr-slot>
            <slot id="main"></slot>
        </div>
    </template>`);

    #mainSlot;

    constructor() {
      super();
  
      this.#mainSlot = this.shadowRoot.getElementById("main");
    }
  
    update(thm) {
      this.#mainSlot.assignedElements().forEach(element => {
        element.update(thm);
      });
      super.update(thm);
    }
  }

export class TheoremIntro extends Node {
  static template = createTemplate(`<template>
      <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
      <link rel="stylesheet" href="./natded.css" />
      <div class="node theorem-intro">
          Theorem <input type="text" id="thm-name" /> (
              <slot name="hypothesis" id="hyp-slot"></slot>
          ): <expr-slot id="e1"></expr-slot>
          <slot id="main-slot"></slot>
      </div>
    </template>`);

  #nameSlot;
  #hypSlot;
  #mainSlot;
  #nextName;

  constructor() {
    super();

    this.#nameSlot = this.shadowRoot.getElementById("thm-name");
    this.#hypSlot = this.shadowRoot.getElementById("hyp-slot");
    this.#mainSlot = this.shadowRoot.getElementById("main-slot");

    this.#nextName = 0;
  }

  connectedCallback() {
    this.#nameSlot.value = this.getAttribute("name");
    this.update(this);
  }

  update(thm) {
    this.#nextName = 0;

    this.#hypSlot.assignedElements().forEach(element => {
      element.update(thm);
      console.log(this);
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }

  genName() {
    let result = `h_{${this.#nextName}}`;
    this.#nextName++;
    return result;
  }
}

export class TheoremElim extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node theorem-elim">
            Theorem <input type="text" id="thm-name" /> (): <expr-slot id="e1"></expr-slot>
        </div>
    </template>`); // TODO

  constructor() {
    super();
  }

  update(thm) {
    super.update(thm);
  }
}

customElements.define("var-slot", VarSlot);
customElements.define("expr-slot", ExprSlot);
customElements.define("binder-node", BinderNode);
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
customElements.define("hypothesis-item", HypothesisItem);
customElements.define("theorem-elim", TheoremElim);
customElements.define("theorem-intro", TheoremIntro);

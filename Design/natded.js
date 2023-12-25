import * as MathLive from "//unpkg.com/mathlive?module";
import { Parser } from "./parser.js";
import { Expr } from "./expr.js";
import * as Config from "./config.js";

mathVirtualKeyboard.layouts = Config.virtualKeyboardLayouts;

function createTemplate(templateText) {
  const dom = new DOMParser().parseFromString(templateText, "text/html");
  const template = dom.querySelector("template");
  return template;
}

function generateId() {
  let id = "";
  do {
    id = "_" + ("" + Math.random()).substring(2);
  } while (document.getElementById(id));
  return id;
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

  expr;
  #content;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));

    this.expr = Expr.wild();
    this.#content = shadowRoot.getElementById("content");
  }

  update() {
    this.#content.replaceChildren(`\\(${this.expr.render()}\\)`);
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

    // Every node gets a random id if it doesn't already have one
    let id = this.getAttribute("id");
    if (id === null) {
      id = generateId();
      this.setAttribute("id", id);
    }
  }

  get expr() {
    return this.#exprslot.expr;
  }

  set expr(expr) {
    this.#exprslot.expr = expr;
  }

  get exprslot() {
    return this.#exprslot;
  }

  unify(expr) {
    const result = Expr.unify(expr, this.expr);
    return result;
  }

  update(thm) {
    this.#exprslot.update();
    MathLive.renderMathInElement(this.shadowRoot);
  }

  invalidate() {
    this.parentNode.invalidate();
  }
}

export class BinderNode extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node binder-node">
          <span id="declaration" class="declaration" draggable="true">
            <var-slot id="v1"></var-slot>: <expr-slot id="e1"></expr-slot>
          </span>
          \\(\\Rightarrow\\)
          <slot id="main"></slot>
        </div>
    </template>`);

  #varSlot;
  #mainSlot;

  constructor() {
    super();

    this.#varSlot = this.shadowRoot.getElementById("v1");
    this.#mainSlot = this.shadowRoot.getElementById("main");

    let declaration = this.shadowRoot.getElementById("declaration");
    declaration.addEventListener("dragstart", (event) => {
      this.#mainSlot.assignedElements().forEach(element => {
        element.classList.add("scope");
      });
      event.dataTransfer.setData("text/id", this.getAttribute("id"));
      event.dataTransfer.effectAllowed = "copy";
      event.stopPropagation();
    });
    declaration.addEventListener("dragend", () => {
      this.#mainSlot.assignedElements().forEach(element => {
        element.classList.remove("scope");
      });
    });
  }

  get html() {
    let result = new VarIntro(this.getAttribute("id"));
    result.unify(this.expr);
    return result;
  }

  get variable() {
    return this.#varSlot.variable;
  }

  get mainExpr() {
    return this.#mainSlot.assignedElements()[0].expr;
  }

  typecheck() {
    this.expr = Expr.wild();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
    });
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
        <div class="hypothesis-item">
          <span id="declaration" class="declaration" draggable="true">
            <var-slot id="v1"></var-slot>: <expr-slot id="e1"></expr-slot>
          </span>
        </div>
    </template>`);

  #varSlot;

  constructor() {
    super();

    this.#varSlot = this.shadowRoot.getElementById("v1");

    let declaration = this.shadowRoot.getElementById("declaration");
    declaration.addEventListener("dragstart", (event) => {
      this.parentNode.classList.add("scope");
      event.dataTransfer.setData("text/id", this.getAttribute("id"));
      event.dataTransfer.effectAllowed = "copy";
      event.stopPropagation();
    });
    declaration.addEventListener("dragend", () => {
      this.parentNode.classList.remove("scope");
    });
  }

  get html() {
    let result = new VarIntro(this.getAttribute("id"));
    result.unify(this.expr);
    return result;
  }

  get variable() {
    return this.#varSlot.variable;
  }

  typecheck() {
    let parser = new Parser();
    this.expr = parser.parse(this.getAttribute("expr"));
    // TODO handle errors?
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

    let counter = 0;
    this.addEventListener("dragover", (event) => {
      if (event.target.closest(".scope")) {
        event.preventDefault();
      }
    });
    this.addEventListener("dragenter", () => {
      if (counter === 0) {
        this.classList.add("drop-target");
      }
      counter++;
    });
    this.addEventListener("dragleave", () => {
      counter--;
      if (counter === 0) {
        this.classList.remove("drop-target");
      }
    });
    this.addEventListener("drop", (event) => {
      this.classList.remove("drop-target");

      const id = event.dataTransfer.getData("text/id");
      const v = document.getElementById(id);
      const h = v.html;
      if (this.expr.canUnify(h.expr)) {
        let parent = this.parentNode;
        if (this.getAttribute("slot")) {
          h.setAttribute("slot", this.getAttribute("slot"));
        }
        parent.replaceChild(h, this);
        parent.invalidate();
      }

      event.preventDefault();
    });
  }

  typecheck() {
    this.expr = Expr.wild();
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

  constructor(ref) {
    super();

    this.#varslot = this.shadowRoot.getElementById("v1");
    if (ref) {
      this.setAttribute("ref", ref);
    }
    this.#ref = this.getAttribute("ref");
  }

  typecheck() {
    let r = document.getElementById(this.#ref);
    this.unify(r.expr);
  }

  update(thm) {
    let r = document.getElementById(this.#ref);
    this.#varslot.variable = r.variable;
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
    super();
  }

  typecheck() {
    this.expr = Expr.true;
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
    super();

    this.#leftSlot = this.shadowRoot.getElementById("left");
    this.#rightSlot = this.shadowRoot.getElementById("right");
  }

  typecheck() {
    this.expr = Expr.and(Expr.wild(), Expr.wild());
    this.#leftSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(Expr.and(element.expr, Expr.wild()));
    });
    this.#rightSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(Expr.and(Expr.wild(), element.expr));
    });
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

  typecheck() {
    this.expr = Expr.wild();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(Expr.and(this.expr, Expr.wild()), element.expr);
    });
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

  typecheck() {
    this.expr = Expr.wild();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(Expr.and(Expr.wild(), this.expr), element.expr);
    });
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
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
  }

  typecheck() {
    this.expr = Expr.or(Expr.wild(), Expr.wild());
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(Expr.or(element.expr, Expr.wild()));
    });
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
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
  }

  typecheck() {
    this.expr = Expr.or(Expr.wild(), Expr.wild());
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(Expr.or(Expr.wild(), element.expr));
    });
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
  #mainExpr;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
    this.#leftSlot = this.shadowRoot.getElementById("left"); // should contain a binder-node
    this.#rightSlot = this.shadowRoot.getElementById("right"); // should contain a binder-node
  }

  typecheck() {
    this.expr = Expr.wild();
    this.#mainExpr = Expr.or(Expr.wild(), Expr.wild());
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(this.#mainExpr, element.expr);
    });
    this.#leftSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(this.#mainExpr, Expr.or(element.expr, Expr.wild()));
      this.unify(element.mainExpr);
    });
    this.#rightSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(this.#mainExpr, Expr.or(Expr.wild(), element.expr));
      this.unify(element.mainExpr);
    });
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

  typecheck() {
    this.expr = Expr.wild();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(Expr.false, element.expr);
    });
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

  #mainSlot;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main"); // should contain a binder-node
  }

  typecheck() {
    this.expr = Expr.implies(Expr.wild(), Expr.wild());
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(Expr.implies(element.expr, element.mainExpr));
    });
  }

  update(thm) {
    this.#mainSlot.assignedElements().forEach(element => {
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
  #argExpr;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
    this.#argSlot = this.shadowRoot.getElementById("arg");
  }

  typecheck() {
    this.expr = Expr.wild();
    this.#argSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.#argExpr = element.expr;
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(Expr.implies(this.#argExpr, this.expr), element.expr);
    });
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
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main"); // should contain a binder-node
  }

  typecheck() {
    this.expr = Expr.not(Expr.wild());
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(Expr.not(element.expr));
      Expr.unify(Expr.false, element.mainExpr);
    });
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
  #argExpr;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
    this.#argSlot = this.shadowRoot.getElementById("arg");
  }

  typecheck() {
    this.expr = Expr.false;
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.#argExpr = element.expr;
    });
    this.#argSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(Expr.not(this.#argExpr), element.expr);
    });
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

  typecheck() {
    this.expr = Expr.wild();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(Expr.not(Expr.not(this.expr)), element.expr);
    });
  }

  update(thm) {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }
}

export class BindItem extends Node {
  static template = createTemplate(`<template>
    <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
    <link rel="stylesheet" href="./natded.css" />
    <div class="node bind-item">
      <span id="declaration" class="declaration" draggable="true">
        <var-slot id="v1"></var-slot>: <expr-slot id="e1"></expr-slot>
      </span>&nbsp;=
      <slot id="main"></slot>
    </div>
  </template>`);

  #varSlot;
  #mainSlot;

  constructor() {
    super();

    this.#varSlot = this.shadowRoot.getElementById("v1");
    this.#mainSlot = this.shadowRoot.getElementById("main");

    let declaration = this.shadowRoot.getElementById("declaration");
    let block = this.closest("let-block");
    declaration.addEventListener("dragstart", (event) => {
      block.addScopes(this);

      event.dataTransfer.setData("text/id", this.getAttribute("id"));
      event.dataTransfer.effectAllowed = "copy";
      event.stopPropagation();
    });
    declaration.addEventListener("dragend", () => {
      block.removeScopes();
    });
  }

  get html() {
    let result = new VarIntro(this.getAttribute("id"));
    result.unify(this.expr);
    return result;
  }

  get variable() {
    return this.#varSlot.variable;
  }

  get mainExpr() {
    return this.#mainSlot.assignedElements()[0].expr;
  }

  typecheck() {
    this.expr = Expr.wild();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(this.expr, element.expr);
    });
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

export class LetBlock extends Node {
  static template = createTemplate(`<template>
      <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
      <link rel="stylesheet" href="./natded.css" />
      <div class="node let-block">
        Let: <expr-slot id="e1"></expr-slot><br />
        <slot name="bind" id="bind"></slot>
        <button type="button" id="add">Add</button>
        <slot id="main"></slot>
      </div>
    </template>`);

  #mainSlot;
  #bindSlot;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
    this.#bindSlot = this.shadowRoot.getElementById("bind");

    let addButton = this.shadowRoot.getElementById("add");
    addButton.addEventListener("click", () => {
      this.insertAdjacentHTML("beforeend",
        `<bind-item slot="bind"><unknown-intro></unknown-intro></bind-item>`);
      this.invalidate();
    });
  }

  typecheck() {
    this.expr = Expr.wild();
    this.#bindSlot.assignedElements().forEach(element => {
      element.typecheck();
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(this.expr, element.expr);
    });
  }

  update(thm) {
    this.#bindSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }

  addScopes(bind) {
    let found = false;
    this.#bindSlot.assignedElements().forEach(element => {
      if (found) {
        element.classList.add("scope");
      }
      if (element === bind) {
        found = true;
      }
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.classList.add("scope");
    });
  }

  removeScopes() {
    this.#bindSlot.assignedElements().forEach(element => {
      element.classList.remove("scope");
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.classList.remove("scope");
    });
  }
}

export class TheoremIntro extends Node {
  static template = createTemplate(`<template>
      <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
      <link rel="stylesheet" href="./natded.css" />
      <div class="node theorem-intro" id="theorem">
        <details open>
          <summary>
            Theorem <input type="text" id="thm-name" /> (
                <slot name="hypothesis" id="hyp-slot"></slot>
            ): <expr-slot id="e1"></expr-slot>
          </summary>
          <slot id="main"></slot>
        </details>
      </div>
    </template>`);

  #nameSlot;
  #hypSlot;
  #mainSlot;
  #theoremNode;
  #nextName;

  constructor() {
    super();

    this.#nameSlot = this.shadowRoot.getElementById("thm-name");
    this.#hypSlot = this.shadowRoot.getElementById("hyp-slot");
    this.#mainSlot = this.shadowRoot.getElementById("main");
    this.#theoremNode = this.shadowRoot.getElementById("theorem");

    this.#nameSlot.addEventListener("change", (event) => {
      this.setAttribute("name", this.#nameSlot.value);
      this.invalidate();
    });

    this.#nextName = 0;

    let proof = this.closest("natded-proof");
    this.#theoremNode.addEventListener("dragstart", (event) => {
      proof.addScopes();
      event.dataTransfer.setData("text/id", this.getAttribute("id"));
      event.dataTransfer.effectAllowed = "copy";
      event.stopPropagation();
    });
    this.#theoremNode.addEventListener("dragend", () => {
      proof.removeScopes();
    });
  }

  connectedCallback() {
    this.#nameSlot.value = this.getAttribute("name");
  }

  get theorem() {
    let props = {};
    return {
      name:
        this.#nameSlot.value,
      hypotheses:
        this.#hypSlot.assignedElements().map(hyp => hyp.expr.extract(props)),
      conclusion:
        this.#mainSlot.assignedElements()[0].expr.extract(props),
    };
  }

  get html() {
    let result = new TheoremElim(this.getAttribute("id"));
    let theorem = this.theorem;
    result.unify(theorem.conclusion);
    return result;
  }

  typecheck() {
    let parser = new Parser();
    this.expr = parser.parse(this.getAttribute("expr"));
    this.#hypSlot.assignedElements().forEach(element => {
      element.typecheck();
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(element.expr);
    });
  }

  update(thm) {
    if (this.isProven()) {
      this.#theoremNode.classList.remove("unproven");
      this.#theoremNode.classList.add("proven");
      this.#theoremNode.setAttribute("draggable", true);
    } else {
      this.#theoremNode.classList.remove("proven");
      this.#theoremNode.classList.add("unproven");
      this.#theoremNode.setAttribute("draggable", false);
    }

    this.#nextName = 0;

    this.#hypSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(thm);
    });
    super.update(thm);
  }

  isProven() {
    return this.querySelector("unknown-intro") === null;
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
            By <input type="text" id="thm-name" /> (
              <slot id="args"></slot>
            ): <expr-slot id="e1"></expr-slot>
        </div>
    </template>`);

  #nameSlot;
  #ref;
  #argsSlot;

  constructor(ref) {
    super();

    this.#nameSlot = this.shadowRoot.getElementById("thm-name");
    this.#argsSlot = this.shadowRoot.getElementById("args");

    if (ref) {
      this.setAttribute("ref", ref);
    }
    this.#ref = this.getAttribute("ref");
  }

  typecheck() {
    this.expr = Expr.wild();
    let r = document.getElementById(this.#ref);
    let theorem = r.theorem;

    if (theorem.hypotheses.length > this.#argsSlot.assignedElements().length) {
      // Add extra unknown-intro elements
      for (let i = this.#argsSlot.assignedElements().length; i < theorem.hypotheses.length; i++) {
        this.insertAdjacentHTML("beforeend", "<unknown-intro></unknown-intro>");
      }
    }
    this.#argsSlot.assignedElements().forEach((element, i) => {
      if (theorem.hypotheses[i]) {
        // Ignore extra args
        element.typecheck();
        Expr.unify(element.expr, theorem.hypotheses[i]);
      }
    });

    Expr.unify(this.expr, theorem.conclusion);
  }

  update(thm) {
    let r = document.getElementById(this.#ref);
    let theorem = r.theorem;
    this.#nameSlot.value = theorem.name;

    this.#argsSlot.assignedElements().forEach((element, i) => {
      element.update(thm);
    });

    super.update(thm);
  }
}

export class NatDedProof extends HTMLElement {
  static template = createTemplate(`<template>
    <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
    <link rel="stylesheet" href="./natded.css" />
    <div class="proofs">
      <div class="tools">
        <slot name="tool" id="tool"></slot>
        <hr />
        <input type="text" value="proofs.txt" id="filename" />
        <button type="button" id="save">Save</button>
        <a href="" id="download" style="display: none;">Download</a>
        <input type="file" style="display: none;" id="loadfile" />
        <button type="button" id="load">Load</button>
        <button type="button" id="undo">Undo</button>
        <button type="button" id="redo">Redo</button>
      </div>
      <div class="main">
        <slot id="main"></slot>
        <hr />
        <div class="new-theorem" id="new-theorem">
          Create Theorem: <input type="text" id="thm-name" /> (<br />
          <div id="output"></div>
          <math-field id="expr" style="display: block;"></math-field><br />
          <button type="button" id="add-hyp">Add Hypothesis</button>
          <button type="button" id="set-conc">Set Conclusion</button>
          <button type="button" id="create">Create</button>
        </div>
      </div>
    </div>
  </template>`);

  #mainSlot;
  #toolSlot;
  #undoButton;
  #redoButton;
  #undoStack;
  #redoStack;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));

    this.#mainSlot = this.shadowRoot.getElementById("main");
    this.#toolSlot = this.shadowRoot.getElementById("tool");
    this.#undoStack = [];
    this.#redoStack = [];

    let thmName = this.shadowRoot.getElementById("thm-name");
    let output = this.shadowRoot.getElementById("output");
    let expr = this.shadowRoot.getElementById("expr");
    let addHypothesis = this.shadowRoot.getElementById("add-hyp");
    let setConclusion = this.shadowRoot.getElementById("set-conc");
    let createButton = this.shadowRoot.getElementById("create");
    let fileName = this.shadowRoot.getElementById("filename");
    let saveButton = this.shadowRoot.getElementById("save");
    let loadButton = this.shadowRoot.getElementById("load");
    let downloadLink = this.shadowRoot.getElementById("download");
    let loadFile = this.shadowRoot.getElementById("loadfile");

    this.#undoButton = this.shadowRoot.getElementById("undo");
    this.#redoButton = this.shadowRoot.getElementById("redo");

    expr.inlineShortcuts = {
      ...expr.inlineShortcuts,
      ...Config.logicShortcuts,
    };
    expr.onInlineShortcut = (_mf, s) => {
      const m = s.match(/^([A-Za-z])([0-9]+)$/);
      if (m) {
        return `${m[1]}_{${m[2]}}`;
      }
      return '';
    };
    expr.menuItems = expr.menuItems.filter(item => item.id !== "insert-matrix");

    let theorem = {};

    let resetTheorem = () => {
      theorem.name = "";
      theorem.hypotheses = [];
      theorem.conclusion = "\\_";
    };

    let showTheorem = () => {
      let result = "";
      theorem.hypotheses.forEach(hyp => {
        result = result + `\\[${hyp}\\]`;
      });
      result = result + `): \\(${theorem.conclusion}\\)`;
      output.innerText = result;
      MathLive.renderMathInElement(output);
    };

    resetTheorem();
    showTheorem();

    thmName.addEventListener("change", () => {
      theorem.name = thmName.value;
    });

    addHypothesis.addEventListener("click", () => {
      theorem.hypotheses.push(expr.value);
      expr.value = "";
      showTheorem();
    });

    setConclusion.addEventListener("click", () => {
      theorem.conclusion = expr.value;
      expr.value = "";
      showTheorem();
    });

    createButton.addEventListener("click", () => {
      let html = `<theorem-intro name="${theorem.name}" expr="${theorem.conclusion}">`;
      theorem.hypotheses.forEach(hyp => {
        html = html + `<hypothesis-item slot="hypothesis" expr="${hyp}"></hypothesis-item>`;
      });
      html = html + `<unknown-intro></unknown-intro></theorem-intro>`;
      this.insertAdjacentHTML("beforeend", html);
      resetTheorem();
      showTheorem();
      this.invalidate();
    });

    saveButton.addEventListener("click", () => {
      let blob = new Blob(this.#mainSlot.assignedElements().map(e => e.outerHTML), {
        type: "text/plain",
      });
      let url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = fileName.value;
      downloadLink.click();
    });

    loadButton.addEventListener("click", () => {
      loadFile.click();
    });

    loadFile.addEventListener("change", () => {
      let reader = new FileReader();
      reader.addEventListener("loadend", () => {
        this.#mainSlot.assignedElements().forEach(element => {
          this.removeChild(element);
        });
        this.insertAdjacentHTML("beforeend", reader.result);
        this.invalidate();
      });
      reader.readAsText(loadFile.files[0]);
    });
    
    this.#undoButton.addEventListener("click", () => {
      let current = this.#undoStack.pop();
      this.#redoStack.push(current);

      let previous = this.#undoStack.pop();
      this.#mainSlot.assignedElements().forEach(element => {
        this.removeChild(element);
      });
      previous.forEach(element => {
        this.insertAdjacentElement("beforeend", element);
      });

      this.invalidate(true);
    });

    this.#redoButton.addEventListener("click", () => {
      let current = this.#redoStack.pop();
      this.#mainSlot.assignedElements().forEach(element => {
        this.removeChild(element);
      });
      current.forEach(element => {
        this.insertAdjacentElement("beforeend", element);
      });

      this.invalidate(true);
    });
  }

  connectedCallback() {
    this.insertAdjacentHTML("beforeend", Config.tools);
    this.invalidate();
  }

  invalidate(saveRedo = false) {
    Expr.resetSeqNum();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.update(element);
    });
    this.#toolSlot.assignedElements().forEach(element => {
      element.update();
    });

    let state = [];
    this.#mainSlot.assignedElements().forEach(element => {
      state.push(element.cloneNode(true));
    });
    this.#undoStack.push(state);
    if (!saveRedo) {
      this.#redoStack = [];
    }

    this.#undoButton.disabled = (this.#undoStack.length < 2);
    this.#redoButton.disabled = (this.#redoStack.length < 1);
  }

  addScopes() {
    this.#mainSlot.assignedElements().forEach(element => {
      if (!element.isProven()) {
        element.classList.add("scope");
      }
    });
  }

  removeScopes() {
    this.#mainSlot.assignedElements().forEach(element => {
      element.classList.remove("scope");
    });
  }
}

export class ProofTool extends Node {
  static template = createTemplate(`<template>
    <link rel="stylesheet" href="https://unpkg.com/mathlive/dist/mathlive-static.css" />
    <link rel="stylesheet" href="./natded.css" />
    <div class="node proof-tool" id="tool" slot="tool" draggable="true">
      <span id="label"></span>
      <slot id="temp" style="display: none;"></slot>
      <expr-slot id="e1" style="display: none;"></expr-slot>
    </div>
  </template>`);

  #tempSlot;
  #labelSlot;
  #labelText;

  constructor() {
    super();

    this.#tempSlot = this.shadowRoot.getElementById("temp");
    this.#labelSlot = this.shadowRoot.getElementById("label");
    this.#labelText = this.getAttribute("label");

    let toolRoot = this.shadowRoot.getElementById("tool");
    let className = this.getAttribute("class");
    toolRoot.classList.add(className);

    let parser = new Parser();
    this.expr = parser.parse(this.getAttribute("expr"));
    // TODO handle errors?

    this.addEventListener("dragstart", (event) => {
      this.closest("natded-proof").classList.add("scope");
      event.dataTransfer.setData("text/id", this.getAttribute("id"));
      event.dataTransfer.effectAllowed = "copy";
      event.stopPropagation();
    });
    this.addEventListener("dragend", () => {
      this.closest("natded-proof").classList.remove("scope");
    });
  }

  get html() {
    let result = this.#tempSlot.assignedElements()[0].cloneNode(true);
    result.setAttribute("id", generateId());
    result.querySelectorAll("*").forEach((element) => {
      element.setAttribute("id", generateId());
    });
    return result;
  }

  update() {
    this.#labelSlot.innerText = this.#labelText;
    super.update();
  }
}

customElements.define("proof-tool", ProofTool);
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
customElements.define("bind-item", BindItem);
customElements.define("let-block", LetBlock);
customElements.define("hypothesis-item", HypothesisItem);
customElements.define("theorem-elim", TheoremElim);
customElements.define("theorem-intro", TheoremIntro);
customElements.define("natded-proof", NatDedProof);

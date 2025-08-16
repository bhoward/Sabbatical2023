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
        <link rel="stylesheet" href="./mathlive-static.css" />
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

  update() {
    this.#span.replaceChildren(`\\(${this.#variable.name}\\)`);
    MathLive.renderMathInElement(this.#span);
  }
}

export class ExprSlot extends HTMLElement {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    const shadowRoot = this.attachShadow({ mode: "open", });
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

  unify(expr) {
    const result = Expr.unify(expr, this.expr);
    return result;
  }

  update() {
    this.#exprslot.update();
    MathLive.renderMathInElement(this.shadowRoot);
  }

  typecheck() {
    if (this.getAttribute("expr") !== null) {
      let parser = new Parser();
      this.#exprslot.expr = parser.parse(this.getAttribute("expr"));
    } else {
      this.#exprslot.expr = Expr.wild();
    }
  }

  setFocus() {
    let unknown = this.querySelector("unknown-intro");
    if (unknown !== null) {
      unknown.takeFocus();
    } else {
      this.parentNode.setFocus();
    }
  }

  invalidate() {
    this.parentNode.invalidate();
  }

  genName(prefix, id) {
    let thm = this.closest("theorem-intro");
    if (thm !== null) {
      return thm.genName(prefix, id);
    } else {
      let proof = this.closest("natded-proof");
      return proof.genName(prefix, id);
    }
  }
}

export class BinderNode extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
    });
  }

  update() {
    this.#varSlot.variable.name = this.genName("h", this.getAttribute("id"));
    this.#varSlot.update();
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class FreshNode extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node fresh-node">
          <span id="fresh" class="fresh" draggable="true">
            fresh&nbsp;<var-slot id="a1"></var-slot>
            <expr-slot id="e1" style="display: none;"></expr-slot>
          </span>
          \\(\\Rightarrow\\)
          <slot id="main"></slot>
        </div>
    </template>`);

  #varSlot;
  #mainSlot;

  constructor() {
    super();

    this.#varSlot = this.shadowRoot.getElementById("a1");
    this.#mainSlot = this.shadowRoot.getElementById("main");

    let fresh = this.shadowRoot.getElementById("fresh");
    fresh.addEventListener("dragstart", (event) => {
      this.#mainSlot.assignedElements().forEach(element => {
        element.classList.add("scope");
      });
      event.dataTransfer.setData("text/id", this.getAttribute("id"));
      event.dataTransfer.effectAllowed = "copy";
      event.stopPropagation();
    });
    fresh.addEventListener("dragend", () => {
      this.#mainSlot.assignedElements().forEach(element => {
        element.classList.remove("scope");
      });
    });
  }
// TODO what should be dropped from this?
  get html() {
    let result = new VarIntro(this.getAttribute("id"));
    result.unify(this.expr);
    return result;
  }

  get variable() {
    return this.#varSlot.variable;
  }

  typecheck() {
    super.typecheck();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(element.expr);
    });
  }

  update() {
    this.#varSlot.variable.name = this.genName("c", this.getAttribute("id"));
    this.#varSlot.update();
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class HypothesisItem extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
  }

  update() {
    this.#varSlot.variable.name = this.genName("h", this.getAttribute("id"));
    this.#varSlot.update();
    super.update();
  }
}

export class UnknownIntro extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node unknown-intro" id="unknown" tabindex="0">
            ?:&nbsp;<expr-slot id="e1"></expr-slot>
            <span class="key-buffer" id="key-buffer"></span>
            <span class="error-display" id="error-display"></span>
            <button type="button" class="tool-button" id="tool-button" tabindex="-1">
              <img src="toolbox-8-16.png" alt="Toolbox" />
            </button>
        </div>
    </template>`);

  #errorDisplay;

  constructor() {
    super();

    let counter = 0;
    let unknown = this.shadowRoot.getElementById("unknown");
    let keyBuffer = this.shadowRoot.getElementById("key-buffer");
    let toolButton = this.shadowRoot.getElementById("tool-button");

    this.#errorDisplay = this.shadowRoot.getElementById("error-display");

    this.addEventListener("dragover", (event) => {
      if (event.target.closest(".scope")) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }
    });

    this.addEventListener("dragenter", (event) => {
      if (event.target.closest(".scope") && counter === 0) {
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
      this.applyTool(id);
      event.preventDefault();
    });

    unknown.addEventListener("click", () => {
      unknown.focus({ focusVisible: true });
    });

    this.addEventListener("keydown", (event) => {
      this.#errorDisplay.textContent = "";
      if (event.key === "Enter") {
        let theorem = this.closest("theorem-intro");
        let id = theorem.lookupTool(keyBuffer.textContent, this);
        if (id !== null) {
          this.applyTool(id);
        }
        keyBuffer.textContent = "";
        event.preventDefault();
      } else {
        let result = Config.processKey(keyBuffer.textContent, event.key);
        if (result !== null) {
          keyBuffer.textContent = result;
          event.preventDefault();
        }
      }
    });

    toolButton.addEventListener("click", () => {
      let proof = this.closest("natded-proof");
      if (!proof.isStatic()) {
        proof.showToolbox(this);
      }
    });
  }

  applyTool(id) {
    const v = document.getElementById(id);
    const h = v.html;
    if (this.expr.canUnify(v.expr)) {
      let parent = this.parentNode;
      if (this.getAttribute("slot")) {
        h.setAttribute("slot", this.getAttribute("slot"));
      }
      parent.replaceChild(h, this);
      let u = h.getElementsByTagName("unknown-intro")[0];
      if (u) {
        u.takeFocus();
      } else {
        parent.setFocus();
      }
      parent.invalidate();
      this.#errorDisplay.textContent = "";
    } else {
      this.#errorDisplay.textContent = "No match";
    }
  }

  takeFocus() {
    this.shadowRoot.getElementById("unknown").focus({ focusVisible: true });
  }

  typecheck() {
    super.typecheck();
  }

  update() {
    super.update();
  }
}

export class VarIntro extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    let r = document.getElementById(this.#ref);
    this.unify(r.expr);
  }

  update() {
    let r = document.getElementById(this.#ref);
    this.#varslot.variable = r.variable;
    this.#varslot.update();
    super.update();
  }
}

export class TrueIntro extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node true-intro">
            \\(\\top\\)-Intro: <expr-slot id="e1"></expr-slot>
        </div>
    </template>`);

  constructor() {
    super();
  }

  typecheck() {
    super.typecheck();
    this.unify(Expr.true);
  }

  update() {
    super.update();
  }
}

export class AndIntro extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.unify(Expr.and(Expr.wild(), Expr.wild()));
    this.#leftSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(Expr.and(element.expr, Expr.wild()));
    });
    this.#rightSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(Expr.and(Expr.wild(), element.expr));
    });
  }

  update() {
    this.#leftSlot.assignedElements().forEach(element => {
      element.update();
    });
    this.#rightSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class AndElim1 extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(Expr.and(this.expr, Expr.wild()), element.expr);
    });
  }

  update() {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class AndElim2 extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(Expr.and(Expr.wild(), this.expr), element.expr);
    });
  }

  update() {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class OrIntro1 extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.unify(Expr.or(Expr.wild(), Expr.wild()));
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(Expr.or(element.expr, Expr.wild()));
    });
  }

  update() {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class OrIntro2 extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.unify(Expr.or(Expr.wild(), Expr.wild()));
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(Expr.or(Expr.wild(), element.expr));
    });
  }

  update() {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class OrElim extends Node {
  static template = createTemplate(`<template>
      <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
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

  update() {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    this.#leftSlot.assignedElements().forEach(element => {
      element.update();
    });
    this.#rightSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class FalseElim extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(Expr.false, element.expr);
    });
  }

  update() {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class ImpliesIntro extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.unify(Expr.implies(Expr.wild(), Expr.wild()));
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(Expr.implies(element.expr, element.mainExpr));
    });
  }

  update() {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class ImpliesElim extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.#argSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.#argExpr = element.expr;
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(Expr.implies(this.#argExpr, this.expr), element.expr);
    });
  }

  update() {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    this.#argSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class NotIntro extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.unify(Expr.not(Expr.wild()));
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(Expr.not(element.expr));
      Expr.unify(Expr.false, element.mainExpr);
    });
  }

  update() {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class NotElim extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.unify(Expr.false);
    this.#argSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.#argExpr = element.expr;
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(Expr.not(this.#argExpr), element.expr);
    });
  }

  update() {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    this.#argSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class NotNotElim extends Node {
  static template = createTemplate(`<template>
      <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      Expr.unify(Expr.not(Expr.not(this.expr)), element.expr);
    });
  }

  update() {
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class AllIntro extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node all-intro">
            \\(\\forall\\)-Intro: <expr-slot id="e1"></expr-slot>
            <slot id="main"></slot>
        </div>
    </template>`);

  #mainSlot;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main"); // should contain a fresh-node
  }

  typecheck() {
    super.typecheck();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      let body = Expr.wild();
      element.unify(Expr.inst(element.variable, body));
      this.unify(Expr.all(element.variable, body));
    });
  }

  update() {
    this.expr.v = this.genName("x", null);
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class BindItem extends Node {
  static template = createTemplate(`<template>
    <link rel="stylesheet" href="./mathlive-static.css" />
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
    super.typecheck();
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(element.expr);
    });
  }

  update() {
    this.#varSlot.variable.name = this.genName("h", this.getAttribute("id"));
    this.#varSlot.update();
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }
}

export class LetBlock extends Node {
  static template = createTemplate(`<template>
      <link rel="stylesheet" href="./mathlive-static.css" />
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
  #addButton;

  constructor() {
    super();

    this.#mainSlot = this.shadowRoot.getElementById("main");
    this.#bindSlot = this.shadowRoot.getElementById("bind");

    this.#addButton = this.shadowRoot.getElementById("add");
    this.#addButton.addEventListener("click", () => {
      this.insertAdjacentHTML("beforeend",
        `<bind-item slot="bind"><unknown-intro></unknown-intro></bind-item>`);
      this.invalidate();
    });
  }

  typecheck() {
    super.typecheck();
    this.#bindSlot.assignedElements().forEach(element => {
      element.typecheck();
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(element.expr);
    });
  }

  update() {
    this.#bindSlot.assignedElements().forEach(element => {
      element.update();
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    let proof = this.closest("natded-proof");
    if (proof.isStatic()) {
      this.#addButton.style.display = "none";
    }
    super.update();
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

  bindIndex(e) {
    let i = 0;
    for (const element of this.#bindSlot.assignedElements()) {
      if (element.contains(e)) return i;
      i++;
    }
    return i;
  }
}

export class TheoremIntro extends Node {
  static template = createTemplate(`<template>
      <link rel="stylesheet" href="./mathlive-static.css" />
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
  #nameMap;

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

  lookupTool(key, unknown) {
    if (key.substring(0, 1) === "h") {
      // look for hypothesis in this theorem; check that unknown is in its scope
      let num = Number(key.substring(1));
      let id = this.#nameMap[num];
      let e = document.getElementById(id);
      let p = e.parentNode;
      if (e !== null && p.contains(unknown)) {
        if (p instanceof LetBlock) {
          // disallow using a later bind-item in an earlier one
          let i = p.bindIndex(e);
          let j = p.bindIndex(unknown);
          if (j <= i) return null;
        }
        return id;
      } else {
        return null;
      }
    } else {
      let proof = this.closest("natded-proof");
      // ask the proof environment for a tool or a proven theorem
      return proof.lookupTool(key);
    }
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
    super.typecheck();
    this.#hypSlot.assignedElements().forEach(element => {
      element.typecheck();
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.typecheck();
      this.unify(element.expr);
    });
  }

  update() {
    let proof = this.closest("natded-proof");
    if (proof.isStatic()) {
      this.#nameSlot.disabled = true;
    }

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
    this.#nameMap = [];

    this.#hypSlot.assignedElements().forEach(element => {
      element.update();
    });
    this.#mainSlot.assignedElements().forEach(element => {
      element.update();
    });
    super.update();
  }

  isProven() {
    return this.querySelector("unknown-intro") === null;
  }

  genName(prefix, id) {
    let result = `${prefix}_{${this.#nextName}}`;
    this.#nameMap[this.#nextName] = id;
    this.#nextName++;
    return result;
  }
}

export class TheoremElim extends Node {
  static template = createTemplate(`<template>
        <link rel="stylesheet" href="./mathlive-static.css" />
        <link rel="stylesheet" href="./natded.css" />
        <div class="node theorem-elim">
            By <span id="thm-name"></span> (
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
    super.typecheck();
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

    this.unify(theorem.conclusion);
  }

  update() {
    let r = document.getElementById(this.#ref);
    let theorem = r.theorem;
    this.#nameSlot.innerText = theorem.name;

    this.#argsSlot.assignedElements().forEach((element, i) => {
      element.update();
    });

    super.update();
  }
}

export class NatDedProof extends HTMLElement {
  static template = createTemplate(`<template>
    <link rel="stylesheet" href="./mathlive-static.css" />
    <link rel="stylesheet" href="./natded.css" />
    <div class="proofs">
      <dialog class="tools" id="tools">
        <slot name="tool" id="tool"></slot>
        <button type="button" id="cancel">Cancel</button>
      </dialog>
      <div class="main">
        <slot id="main"></slot>
      </div>
      <div class="edit-controls" id="edit-controls">
        <hr />
          <input type="text" value="proofs.txt" id="filename" />
          <button type="button" id="save">Save</button>
          <a href="" id="download" style="display: none;">Download</a>
          <input type="file" style="display: none;" id="openfile" />
          <button type="button" id="open">Open</button>
          <button type="button" id="undo">Undo</button>
          <button type="button" id="redo">Redo</button>
          <button type="button" id="restore">Restore Progress</button>
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
  #toolsDialog;
  #undoButton;
  #redoButton;
  #undoStack;
  #redoStack;
  #restoreButton;
  #restoreState;
  #currentUnknown;
  #nextName;

  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.appendChild(this.constructor.template.content.cloneNode(true));

    this.#mainSlot = this.shadowRoot.getElementById("main");
    this.#toolSlot = this.shadowRoot.getElementById("tool");
    this.#undoStack = [];
    this.#redoStack = [];
    this.#restoreState = null;

    let thmName = this.shadowRoot.getElementById("thm-name");
    let output = this.shadowRoot.getElementById("output");
    let expr = this.shadowRoot.getElementById("expr");
    let addHypothesis = this.shadowRoot.getElementById("add-hyp");
    let setConclusion = this.shadowRoot.getElementById("set-conc");
    let createButton = this.shadowRoot.getElementById("create");
    let fileName = this.shadowRoot.getElementById("filename");
    let saveButton = this.shadowRoot.getElementById("save");
    let openButton = this.shadowRoot.getElementById("open");
    let downloadLink = this.shadowRoot.getElementById("download");
    let openFile = this.shadowRoot.getElementById("openfile");
    let cancelButton = this.shadowRoot.getElementById("cancel");
    let editControls = this.shadowRoot.getElementById("edit-controls");

    this.#toolsDialog = this.shadowRoot.getElementById("tools");
    this.#undoButton = this.shadowRoot.getElementById("undo");
    this.#redoButton = this.shadowRoot.getElementById("redo");
    this.#restoreButton = this.shadowRoot.getElementById("restore");

    if (this.isStatic()) {
      editControls.style.display = "none";
      return;
    }

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
    expr.keybindings = expr.keybindings.filter(item => !item.key.includes("[Tab]"));

    let theorem = {};

    let resetTheorem = () => {
      theorem.name = "";
      theorem.hypotheses = [];
      theorem.conclusion = "\\_";
    };

    let showTheorem = () => {
      thmName.value = theorem.name;
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

    let saveHandler = () => {
      let blob = new Blob(this.#mainSlot.assignedElements().map(e => e.outerHTML), {
        type: "text/plain",
      });
      let url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = fileName.value;
      downloadLink.click();
    };

    saveButton.addEventListener("click", saveHandler);

    let openHandler = () => {
      openFile.click();
    };

    openButton.addEventListener("click", openHandler);

    openFile.addEventListener("change", () => {
      let reader = new FileReader();
      reader.addEventListener("loadend", () => {
        this.#mainSlot.assignedElements().forEach(element => {
          this.removeChild(element);
        });
        this.insertAdjacentHTML("beforeend", reader.result);
        this.setFocus();
        this.invalidate();
      });
      reader.readAsText(openFile.files[0]);
    });
    
    let undoHandler = () => {
      let current = this.#undoStack.pop();
      this.#redoStack.push(current);

      let previous = this.#undoStack.pop();
      this.#mainSlot.assignedElements().forEach(element => {
        this.removeChild(element);
      });
      previous.forEach(element => {
        element.querySelectorAll(".scope").forEach(e => e.classList.remove("scope"));
        this.insertAdjacentElement("beforeend", element);
      });

      this.setFocus(); // TODO attempt to restore old focus?
      this.invalidate(true);
    };

    this.#undoButton.addEventListener("click", undoHandler);

    let redoHandler = () => {
      let current = this.#redoStack.pop();
      this.#mainSlot.assignedElements().forEach(element => {
        this.removeChild(element);
      });
      current.forEach(element => {
        element.querySelectorAll(".scope").forEach(e => e.classList.remove("scope"));
        this.insertAdjacentElement("beforeend", element);
      });

      this.setFocus(); // TODO attempt to restore old focus?
      this.invalidate(true);
    };

    this.#redoButton.addEventListener("click", redoHandler);

    this.#restoreButton.addEventListener("click", () => {
      this.#mainSlot.assignedElements().forEach(element => {
        this.removeChild(element);
      });
      this.#restoreState.forEach(element => {
        element = element.replaceAll("class=\"scope\"", "");
        this.insertAdjacentHTML("beforeend", element);
      });
      this.setFocus();
      this.invalidate();
    });

    this.addEventListener("keydown", (event) => {
      if (event.key.toUpperCase() === "Z") {
        if (event.ctrlKey !== event.metaKey && !event.altKey) {
          if (event.shiftKey) {
            redoHandler();
            event.preventDefault();
          } else {
            undoHandler();
            event.preventDefault();
          }
        }
      } else if (event.key.toUpperCase() === "S") {
        if (event.ctrlKey !== event.metaKey && !event.altKey && !event.shiftKey) {
          saveHandler();
          event.preventDefault();
        }
      } else if (event.key.toUpperCase() === "O") {
        if (event.ctrlKey !== event.metaKey && !event.altKey && !event.shiftKey) {
          openHandler();
          event.preventDefault();
        }
      }
    });

    cancelButton.addEventListener("click", () => {
      this.#toolsDialog.close();
    });
  }

  connectedCallback() {
    this.insertAdjacentHTML("beforeend", Config.tools);
    if (localStorage && localStorage.getItem("state")) {
      this.#restoreState = JSON.parse(localStorage.getItem("state"));
    }
    this.invalidate();
  }

  setFocus() {
    for (const element of this.#mainSlot.assignedElements()) {
      let unknown = element.querySelector("unknown-intro");
      if (unknown !== null) {
        unknown.takeFocus();
        return;
      }
    }

    // No remaining unknowns; set focus to new theorem dialog
    this.shadowRoot.getElementById("thm-name").focus({ focusVisible: true });
  }

  invalidate(saveRedo = false) {
    Expr.resetSeqNum();
    this.#nextName = 0;

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

    if (localStorage) {
      let s = state.map(element => element.outerHTML);
      localStorage.setItem("state", JSON.stringify(s));
    }

    this.#undoButton.disabled = (this.#undoStack.length < 2);
    this.#redoButton.disabled = (this.#redoStack.length < 1);
    this.#restoreButton.disabled = (!this.#restoreState);
  }

  // Dummy version for nodes not contained in a theorem-intro
  genName(prefix, id) {
    let result = `${prefix}_{${this.#nextName}}`;
    this.#nextName++;
    return result;
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

  lookupTool(key) {
    if (key.substring(0, 2) === "By") {
      const thmName = key.substring(3);
      for (const element of this.#mainSlot.assignedElements()) {
        if (element.theorem.name.toLowerCase() === thmName && element.isProven()) {
          return element.getAttribute("id")
        }
      }
    }

    for (const element of this.#toolSlot.assignedElements()) {
      if (element.key === key) {
        return element.getAttribute("id");
      }
    }

    return null;
  }

  showToolbox(unknown) {
    this.#currentUnknown = unknown;
    this.#toolsDialog.showModal();
  }

  selectTool(id) {
    this.#toolsDialog.close();
    this.#currentUnknown.applyTool(id);
  }

  isStatic() {
    return this.getAttribute("static") !== null;
  }
}

export class ProofTool extends Node {
  static template = createTemplate(`<template>
    <link rel="stylesheet" href="./mathlive-static.css" />
    <link rel="stylesheet" href="./natded.css" />
    <button type="button" class="node proof-tool" id="tool" slot="tool">
      <span id="label"></span>
      <slot id="temp" style="display: none;"></slot>
      <expr-slot id="e1" style="display: none;"></expr-slot>
    </button>
  </template>`);

  #tempSlot;
  #labelSlot;
  #labelText;
  #key;

  constructor() {
    super();

    this.#tempSlot = this.shadowRoot.getElementById("temp");
    this.#labelSlot = this.shadowRoot.getElementById("label");
    this.#labelText = this.getAttribute("label");
    this.#key = this.getAttribute("key");

    let toolRoot = this.shadowRoot.getElementById("tool");
    let className = this.getAttribute("klass");
    toolRoot.classList.add(className);

    super.typecheck(); // parse the expr attribute

    toolRoot.addEventListener("click", () => {
      let proof = this.closest("natded-proof");
      proof.selectTool(this.getAttribute("id"));
    });
  }

  get key() {
    return this.#key;
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
customElements.define("fresh-node", FreshNode);
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
customElements.define("all-intro", AllIntro);
customElements.define("bind-item", BindItem);
customElements.define("let-block", LetBlock);
customElements.define("hypothesis-item", HypothesisItem);
customElements.define("theorem-elim", TheoremElim);
customElements.define("theorem-intro", TheoremIntro);
customElements.define("natded-proof", NatDedProof);

import { Expr } from "./expr.js";

export class Parser {
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
            return Expr.wild(); // hack to avoid errors...
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
            } else if (v === "\\_") {
                return Expr.wild();
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

export class Expr {
    #op;

    constructor(op) {
        this.#op = op;
    }

    get op() {
        return this.#op;
    }

    static implies(e1, e2) {
        return new ImpliesExpr(e1, e2);
    }

    static and(e1, e2) {
        return new AndExpr(e1, e2);
    }

    static or(e1, e2) {
        return new OrExpr(e1, e2);
    }

    static not(e1) {
        return new NotExpr(e1);
    }

    static all(v, e1) {
        return new AllExpr(v, e1);
    }

    static exists(v, e1) {
        return new ExistsExpr(v, e1);
    }

    static pred(v, args) {
        return new PredExpr(v, args);
    }

    static prop(v) {
        return new PropExpr(v);
    }

    static wild() {
        return new WildExpr();
    }

    static #seqNum = 0;

    static seqNum() {
        return this.#seqNum++;
    }

    static true = new Expr("true");
    static false = new Expr("false");
    static {
        this.true.render = () => "\\top";
        this.false.render = () => "\\bot";

        this.true.unify = (that, bindings) => that.unifyTrue(this.true, bindings);
        this.false.unify = (that, bindings) => that.unifyFalse(this.false, bindings);

        this.true.unifyTrue = () => true;
        this.false.unifyFalse = () => true;
    }

    paren(s, level, min) {
        if (level > min) {
            return "(" + s + ")";
        } else {
            return s;
        }
    }

    static unify(e1, e2) {
        let bindings = [];
        if (e1.unify(e2, bindings)) {
            bindings.forEach(pair => {
                const { w, b } = pair;
                w.e = b;
            });
            return true;
        } else {
            return false;
        }
    }

    canUnify(that) {
        let bindings = [];
        return this.unify(that, bindings);
    }

    unifyNot(that, bindings) {
        return false;
    }

    unifyImplies(that, bindings) {
        return false;
    }


    unifyOr(that, bindings) {
        return false;
    }

    unifyAnd(that, bindings) {
        return false;
    }

    unifyAll(that, bindings) {
        return false;
    }

    unifyExists(that, bindings) {
        return false;
    }

    unifyTrue(that, bindings) {
        return false;
    }

    unifyFalse(that, bindings) {
        return false;
    }

    unifyProp(that, bindings) {
        return false;
    }

    unifyPred(that, bindings) {
        return false;
    }

    flatten(bindings) {
        return this;
    }

    containsWild(w) {
        return false;
    }

    extract(props) {
        return this;
    }
}

class ImpliesExpr extends Expr {
    e1;
    e2;

    constructor(e1, e2) {
        super("implies");
        this.e1 = e1;
        this.e2 = e2;
    }

    render(level = 0) {
        return this.paren(this.e1.render(1) + "\\rightarrow " + this.e2.render(0), level, 0);
    }

    unify(that, bindings) {
        return that.unifyImplies(this, bindings);
    }

    unifyImplies(that, bindings) {
        return this.e1.unify(that.e1, bindings) && this.e2.unify(that.e2, bindings);
    }

    containsWild(w) {
        return this.e1.containsWild(w) || this.e2.containsWild(w);
    }

    extract(props) {
        return Expr.implies(this.e1.extract(props), this.e2.extract(props));
    }
}

class AndExpr extends Expr {
    e1;
    e2;

    constructor(e1, e2) {
        super("and");
        this.e1 = e1;
        this.e2 = e2;
    }

    render(level = 0) {
        return this.paren(this.e1.render(2) + "\\land " + this.e2.render(3), level, 2);
    }

    unify(that, bindings) {
        return that.unifyAnd(this, bindings);
    }

    unifyAnd(that, bindings) {
        return this.e1.unify(that.e1, bindings) && this.e2.unify(that.e2, bindings);
    }

    containsWild(w) {
        return this.e1.containsWild(w) || this.e2.containsWild(w);
    }

    extract(props) {
        return Expr.and(this.e1.extract(props), this.e2.extract(props));
    }
}

class OrExpr extends Expr {
    e1;
    e2;

    constructor(e1, e2) {
        super("or");
        this.e1 = e1;
        this.e2 = e2;
    }

    render(level = 0) {
        return this.paren(this.e1.render(1) + "\\lor " + this.e2.render(2), level, 1);
    }

    unify(that, bindings) {
        return that.unifyOr(this, bindings);
    }

    unifyOr(that, bindings) {
        return this.e1.unify(that.e1, bindings) && this.e2.unify(that.e2, bindings);
    }

    containsWild(w) {
        return this.e1.containsWild(w) || this.e2.containsWild(w);
    }

    extract(props) {
        return Expr.or(this.e1.extract(props), this.e2.extract(props));
    }
}

class NotExpr extends Expr {
    e;

    constructor(e) {
        super("not");
        this.e = e;
    }

    render(level = 0) {
        return this.paren("\\lnot " + this.e.render(3), level, 3);
    }

    unify(that, bindings) {
        return that.unifyNot(this, bindings);
    }

    unifyNot(that, bindings) {
        return this.e.unify(that.e, bindings);
    }

    containsWild(w) {
        return this.e.containsWild(w);
    }

    extract(props) {
        return Expr.not(this.e.extract(props));
    }
}

class AllExpr extends Expr {
    v;
    e;

    constructor(v, e) {
        super("all");
        this.v = v;
        this.e = e;
    }

    render(level = 0) {
        return this.paren("\\forall " + this.v + this.e.render(4), level, 4);
    }

    unify(that, bindings) {
        return that.unifyAll(this, bindings);
    }

    unifyAll(that, bindings) {
        return this.e.unify(that.e, bindings); // TODO substitute for v
    }

    containsWild(w) {
        return this.e.containsWild(w);
    }

    extract(props) {
        return Expr.all(this.v, this.e.extract(props));
    }
}

class ExistsExpr extends Expr {
    v;
    e;

    constructor(v, e) {
        super("exists");
        this.v = v;
        this.e = e;
    }

    render(level = 0) {
        return this.paren("\\exists " + this.v + this.e.render(4), level, 4);
    }

    unify(that, bindings) {
        return that.unifyExists(this, bindings);
    }

    unifyExists(that, bindings) {
        return this.e.unify(that.e, bindings); // TODO substitute for v
    }

    containsWild(w) {
        return this.e.containsWild(w);
    }

    extract(props) {
        return Expr.exists(this.v, this.e.extract(props));
    }
}

class PredExpr extends Expr {
    v;
    args;

    constructor(v, args) {
        super("pred");
        this.v = v;
        this.args = args;
    }

    render(level = 0) {
        return this.paren(this.v + "(" + this.args + ")", level, 3);
    }

    unify(that, bindings) {
        return that.unifyPred(this, bindings);
    }

    unifyPred(that, bindings) {
        return this.v === that.v; // TODO check the args
    }

    // TODO this doesn't copy the args
    extract(props) {
        if (!props[this.v]) {
            props[this.v] = Expr.wild();
        }
        return props[this.v];
    }
}

class PropExpr extends Expr {
    v;

    constructor(v) {
        super("prop");
        this.v = v;
    }

    render(level = 0) {
        return this.paren(this.v, level, 3);
    }

    unify(that, bindings) {
        return that.unifyProp(this, bindings);
    }

    unifyProp(that, bindings) {
        return this.v === that.v;
    }

    extract(props) {
        if (!props[this.v]) {
            props[this.v] = Expr.wild();
        }
        return props[this.v];
    }
}

class WildExpr extends Expr {
    e;
    #n;

    constructor() {
        super("wild");
        this.e = null;
        this.#n = Expr.seqNum();
    }

    render(level = 0) {
        if (this.e === null) {
            return `\\__{${this.#n}}`;
        } else {
            return this.e.render(level);
        }
    }

    unify(that, bindings) {
        let lhs = this.flatten(bindings);
        if (lhs === this) { // this is an unbound variable
            let rhs = that.flatten(bindings);
            if (lhs !== rhs) {
                if (rhs.containsWild(lhs)) {
                    // attempted recursive unification
                    return false;
                }
                bindings.push({ w: lhs, b: rhs });
            }
            return true;
        } else {
            return lhs.unify(that, bindings);
        }
    }

    unifyNot(that, bindings) {
        let lhs = this.flatten(bindings);
        if (lhs === this) {
            if (that.containsWild(lhs)) {
                return false;
            }
            bindings.push({ w: lhs, b: that });
            return true;
        } else {
            return lhs.unifyNot(that, bindings);
        }
    }

    unifyImplies(that, bindings) {
        let lhs = this.flatten(bindings);
        if (lhs === this) {
            if (that.containsWild(lhs)) {
                return false;
            }
            bindings.push({ w: lhs, b: that });
            return true;
        } else {
            return lhs.unifyImplies(that, bindings);
        }
    }


    unifyOr(that, bindings) {
        let lhs = this.flatten(bindings);
        if (lhs === this) {
            if (that.containsWild(lhs)) {
                return false;
            }
            bindings.push({ w: lhs, b: that });
            return true;
        } else {
            return lhs.unifyOr(that, bindings);
        }
    }

    unifyAnd(that, bindings) {
        let lhs = this.flatten(bindings);
        if (lhs === this) {
            if (that.containsWild(lhs)) {
                return false;
            }
            bindings.push({ w: lhs, b: that });
            return true;
        } else {
            return lhs.unifyAnd(that, bindings);
        }
    }

    unifyAll(that, bindings) {
        let lhs = this.flatten(bindings);
        if (lhs === this) {
            if (that.containsWild(lhs)) {
                return false;
            }
            bindings.push({ w: lhs, b: that });
            return true;
        } else {
            return lhs.unifyAll(that, bindings);
        }
    }

    unifyExists(that, bindings) {
        let lhs = this.flatten(bindings);
        if (lhs === this) {
            if (that.containsWild(lhs)) {
                return false;
            }
            bindings.push({ w: lhs, b: that });
            return true;
        } else {
            return lhs.unifyExists(that, bindings);
        }
    }

    unifyTrue(that, bindings) {
        let lhs = this.flatten(bindings);
        if (lhs === this) {
            bindings.push({ w: lhs, b: that });
            return true;
        } else {
            return lhs.unifyTrue(that, bindings);
        }
    }

    unifyFalse(that, bindings) {
        let lhs = this.flatten(bindings);
        if (lhs === this) {
            bindings.push({ w: lhs, b: that });
            return true;
        } else {
            return lhs.unifyFalse(that, bindings);
        }
    }

    unifyProp(that, bindings) {
        let lhs = this.flatten(bindings);
        if (lhs === this) {
            bindings.push({ w: lhs, b: that });
            return true;
        } else {
            return lhs.unifyProp(that, bindings);
        }
    }

    unifyPred(that, bindings) {
        let lhs = this.flatten(bindings);
        if (lhs === this) {
            bindings.push({ w: lhs, b: that });
            return true;
        } else {
            return lhs.unifyPred(that, bindings);
        }
    }

    flatten(bindings) {
        if (this.e === null) {
            let p = bindings.find((p) => p.w === this);
            if (p) {
                return p.b.flatten(bindings);
            } else {
                return this;
            }
        } else {
            return this.e.flatten(bindings);
        }
    }

    containsWild(w) {
        // have already called flatten on this
        return this === w;
    }

    extract(props) {
        if (this.e === null) {
            if (!props[this.#n]) {
                props[this.#n] = Expr.wild();
            }
            return props[this.#n];
        } else {
            return this.e.extract(props);
        }
    }
}
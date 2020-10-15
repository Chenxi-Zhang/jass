import { Location } from "./range";
class Program {
    nodes: Array<JassNode> = [];
}

interface JassNode {
    // getReturnType(): TypeDescriptor;
}

abstract class JassNodeImpl implements JassNode {
    private static NO_CHILDREN = [];
    private loc: Location;
    private parent: JassNodeImpl | null = null;

    children: JassNodeImpl[] = JassNodeImpl.NO_CHILDREN;

    public constructor(loc: Location, ...children: JassNodeImpl[]) {
        this.loc = loc;
        if (JassNodeImpl.length > 0) {
            this.children = children;
            this.children.forEach(child => child.parent = this);
        }
    }

    // abstract getReturnType(): TypeDescriptor;
}

class JassType {
    name: string;
    parent: JassType | null;
    constructor(name: string, parent: JassType | null = null) {
        this.name = name;
        this.parent = parent;
    }
}

class TypeDescriptor {

    static native: Map<string, JassType> = new Map([
        ['integer', new JassType('integer')],
        ['real', new JassType('real')],
        ['boolean', new JassType('boolean')],
        ['string', new JassType('string')],
        ['handle', new JassType('handle')],
        ['code', new JassType('code')],
        ['nothing', new JassType('nothing')]
    ]);
    static buildIn = new Map();
    static userDefined = new Map();

    static validType(typeName: string) {
        return TypeDescriptor.native.has(typeName) ||
            TypeDescriptor.buildIn.has(typeName) ||
            TypeDescriptor.userDefined.has(typeName);
    }

    name: string;
    type: JassType;
    constructor(name: string, parent: JassType | null = null) {
        this.name = name;
        this.type = (TypeDescriptor.native.get(name) || TypeDescriptor.buildIn.get(name) || new JassType(name, parent));
    }
}

class FunctionNode extends JassNodeImpl {
    id: string;
    constructor(id: string, loc: Location, ...children: JassNodeImpl[]) {
        super(loc, ...children);
        this.id = id;
    }
    getReturnType(): TypeDescriptor {
        throw new Error("Method not implemented.");
    }

}

class OpNot extends JassNodeImpl {
    public constructor(loc: Location, ...children: JassNodeImpl[]) {
        super(loc, ...children);
    }
}
abstract class Op extends JassNodeImpl {

    name: string;

    constructor(name: string, loc: Location, ...children: JassNodeImpl[]) {
        super(loc, ...children);
        this.name = name;
    }

    getLeftOperand(): JassNodeImpl {
        return this.children[0];
    }

    getRightOperand(): JassNodeImpl {
        return this.children[1];
    }

    getOperationName(): string {
        return this.name;
    }

}

class OpAnd extends Op {
    constructor(loc: Location, ...children: JassNodeImpl[]) {
        super("and", loc, ...children);
    }
}

class OpOr extends Op {
    constructor(loc: Location, ...children: JassNodeImpl[]) {
        super("or", loc, ...children);
    }
}

class OpMinus extends Op {
    constructor(loc: Location, ...children: JassNodeImpl[]) {
        super("-", loc, ...children);
    }
}

abstract class Literal extends JassNodeImpl {
    originalValue: string;
    constructor(loc: Location, value: string | undefined) {
        super(loc);
        if (value === undefined) {
            throw new Error("Literal type cannot be null value");
        }
        this.originalValue = value;
    }
}

class IntLiteral extends Literal {
    realValue: number;
    constructor(loc: Location, originalValue: string | undefined, radix: number) {
        super(loc, originalValue);
        this.realValue = parseInt(this.originalValue, radix);
    }
}

class QuoteIntLiteral extends Literal {
    realValue: string;
    constructor(loc: Location, originalValue: string | undefined) {
        super(loc, originalValue);
        this.realValue = this.originalValue;
    }
}

class RealLiteral extends Literal {
    realValue: number;
    constructor(loc: Location, originalValue: string | undefined) {
        super(loc, originalValue);
        this.realValue = parseFloat(this.originalValue);
    }
}

class BooleanLiteral extends Literal {
    realValue: boolean;
    constructor(loc: Location, originalValue: string | undefined, realValue: boolean) {
        super(loc, originalValue);
        this.realValue = realValue;
    }
}

class StringLiteral extends Literal {
    realValue: string;
    constructor(loc: Location, originalValue: string | undefined) {
        super(loc, originalValue);
        this.realValue = this.originalValue;
    }
}
export {
    JassNode,
    JassNodeImpl,
    OpNot,
    OpAnd,
    OpOr,
    OpMinus,
    IntLiteral,
    QuoteIntLiteral,
    RealLiteral,
    BooleanLiteral,
    StringLiteral,
}

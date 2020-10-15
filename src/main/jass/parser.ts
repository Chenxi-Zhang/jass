import assert = require("assert");
import { BooleanLiteral, IntLiteral, JassNode, JassNodeImpl, OpAnd, OpMinus, OpNot, QuoteIntLiteral, RealLiteral, StringLiteral } from "./expression";
import { Token, tokenize, TokenKind } from "./tokens";

class JassExpression {
    tokens: Token[];
    ast: JassNode;
    public constructor(tokens: Token[], ast: JassNode) {
        this.tokens = tokens;
        this.ast = ast;
    }
}
class JassExpressionParser {

    tokens: Token[]
    tokenLength: number;
    tokenPtr: number = 0;
    constructedNode: JassNodeImpl[] = [];

    public constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.tokenLength = tokens.length;
    }

    parseToken() {
        const retVal: JassExpression[] = [];
        while (this.tokenPtr < this.tokenLength) {
            const start = this.tokenPtr
            const ast = this.eatExpression();
            retVal.push(new JassExpression(this.tokens.slice(start, this.tokenPtr), ast))
        }
        return retVal;
    }

    // expression ->
    //  : logicalOrExpression
    //      ( (ASSIGN^ logicalOrExpression)
    //	    | (DEFAULT^ logicalOrExpression))?
    //  
    eatExpression(): JassNodeImpl | null {
        const expr = this.eatLogicalOrExpression()
        const t: Token | null = this.peekToken();
        if (t != null) {
            if (t.kind == TokenKind.ASSIGN) {  // a=b
            }
        }
        return expr;
    }
    peekToken(): Token | null {
        if (this.tokenPtr >= this.tokenLength) {
            return null;
        }
        return this.tokens[this.tokenPtr];
    }
    //logicalOrExpression : logicalAndExpression (OR^ logicalAndExpression)*;
    eatLogicalOrExpression() {
        const expr = this.eatLogicalAndExpression();
    }
    // logicalAndExpression : relationalExpression (AND^ relationalExpression)*;
    eatLogicalAndExpression() {
        const expr = this.eatRelationExpression();
    }
    // relationalExpression : sumExpression (relationalOperator^ sumExpression)?;
    eatRelationExpression() {
        const expr = this.eatSumExpression();
    }
    //sumExpression: productExpression ( (PLUS^ | MINUS^) productExpression)*;
    eatSumExpression() {
        const expr = this.eatProductExpression();
    }
    // productExpression: unaryExpr ((STAR^ | DIV^| MOD^) unaryExpr)* ;
    eatProductExpression() {
        const expr = this.eatUnaryExpression();
    }
    // unaryExpression: (PLUS^ | MINUS^ | NOT^ ) unaryExpression | primaryExpression ;
    eatUnaryExpression(): JassNodeImpl {
        if (this.peekTokenIn(TokenKind.PLUS, TokenKind.MINUS, TokenKind.NOT)) {
            const t: Token = this.takeToken();
            const expr: JassNodeImpl = this.eatUnaryExpression();
            assert(expr != null, "No node!")
            if (t.kind == TokenKind.NOT) {
                return new OpNot(t.loc, expr);
            }
            if (t.kind == TokenKind.AND) {
                return new OpAnd(t.loc, expr);
            }
            return new OpMinus(t.loc, expr);
        }
        return this.eatPrimaryExpression();
    }
    // primaryExpression : startNode (node)? -> ^(EXPRESSION startNode (node)?);
    eatPrimaryExpression(): JassNodeImpl {
        const start = this.eatStartNode();
    }

    //startNode
    // : parenExpr | literal
    //	    | type
    //	    | methodOrProperty
    //	    | functionOrVar
    //	    | projection
    //	    | selection
    //	    | firstSelection
    //	    | lastSelection
    //	    | indexer
    //	    | constructor
    eatStartNode(): JassNodeImpl | null {
        if (this.maybeEatLiteral()) {
            return this.pop();
        }
        else if (this.maybeEatParenExpression()) {
            return this.pop();
        }
        else if (this.maybeEatTypeReference() || this.maybeEatNullReference() || this.maybeEatConstructorReference() ||
            this.maybeEatMethodOrProperty(false) || this.maybeEatFunctionOrVar()) {
            return this.pop();
        }
        else if (this.maybeEatBeanReference()) {
            return this.pop();
        }
        else if (this.maybeEatProjection(false) || this.maybeEatSelection(false) || this.maybeEatIndexer()) {
            return this.pop();
        }
        else if (this.maybeEatInlineListOrMap()) {
            return this.pop();
        }
        else {
            return null;
        }
    }
    maybeEatTypeReference() {
        if (this.peekTokenIn(TokenKind.ID)) {
            const typeName: Token | null = this.peekToken();
            assert(typeName != null, "Expect token");
            if (typeName.value) {
                return false;
            }
            const t: Token = this.takeToken();
        }
    }
    //parenExpr : LPAREN! expression RPAREN!;
    maybeEatParenExpression() {
        if (this.peekTokenIn(TokenKind.LPAREN)) {
            this.nextToken();
            const expr: JassNodeImpl | null = this.eatExpression();
            assert(expr != null, "No node");
            this.eatToken(TokenKind.RPAREN);
            this.push(expr);
            return true;
        } else {
            return false;
        }
    }
    eatToken(expectedTokenKind: TokenKind) {
        const t: Token | null = this.nextToken();
        if (t == null) {
            throw new Error("Unexpectedly ran out of input");
        }
        if (t.kind != expectedTokenKind) {
            throw new Error(`Not expected kind. Expect:${expectedTokenKind}, Real:${t.kind}.`);
        }
        return t;
    }
    pop(): JassNodeImpl {
        const pop: JassNodeImpl | undefined = this.constructedNode.pop();
        if (pop == undefined) {
            throw new Error("No node in constructedNodes");
        }
        return pop;
    }
    //	literal
    //  : INTEGER_LITERAL
    //	| QUOTE_INT
    //	| boolLiteral
    //  | REAL_LITERAL
    //	| STRING_LITERAL
    //	| NULL_LITERAL
    maybeEatLiteral() {
        const t: Token | null = this.peekToken();
        if (t == null) {
            return false;
        }
        if (t.kind == TokenKind.INT) {
            this.push(new IntLiteral(t.loc, t.value, 10));
        } else if (t.kind == TokenKind.OCTAL_INT) {
            this.push(new IntLiteral(t.loc, t.value, 8));
        } else if (t.kind == TokenKind.HEX_INT) {
            this.push(new IntLiteral(t.loc, t.value, 16));
        } else if (t.kind == TokenKind.QUOTED_INT) {
            this.push(new QuoteIntLiteral(t.loc, t.value));
        } else if (this.peekIdentifierToken("true")) {
            this.push(new BooleanLiteral(t.loc, t.value, true));
        } else if (this.peekIdentifierToken("false")) {
            this.push(new BooleanLiteral(t.loc, t.value, false));
        } else if (t.kind == TokenKind.LITERAL_STRING) {
            this.push(new StringLiteral(t.loc, t.value));
        } else if (t.kind == TokenKind.REAL) {
            this.push(new RealLiteral(t.loc, t.value));
        } else {
            return false;
        }
        this.nextToken();
        return true;
    }
    nextToken(): Token | null {
        if (this.tokenPtr >= this.tokenLength) {
            return null;
        }
        const lastPtr = this.tokenPtr;
        this.tokenPtr++;
        return this.tokens[lastPtr];
    }
    peekIdentifierToken(id: string) {
        const t: Token | null = this.peekToken();
        if (t == null) {
            return false;
        }
        return (t.kind == TokenKind.ID && t.value && t.value === id);
    }
    push(node: JassNodeImpl) {
        this.constructedNode.push(node);
    }
    takeToken(): Token {
        if (this.tokenPtr >= this.tokenLength) {
            throw new Error("no more token");
        }
        const lastPtr = this.tokenPtr;
        this.tokenPtr++;
        return this.tokens[lastPtr];
    }
    peekTokenIn(...tokenKinds: TokenKind[]) {
        const t = this.peekToken();
        if (t == null) {
            return false;
        }
        return tokenKinds.includes(t.kind);
    }

}


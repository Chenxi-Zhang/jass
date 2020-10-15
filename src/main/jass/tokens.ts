import { Location } from "./range";

enum TokenKind {
    ID,
    PLUS,
    MINUS,
    STAR,
    DIV,
    LPAREN,
    RPAREN,
    LSQUARE,
    RSQUARE,
    LCURLY,
    RCURLY,
    HASH,
    EQ,
    ASSIGN,
    COMMENT,
    GE,
    GT,
    LE,
    LT,
    HEX_INT,
    INT,
    REAL,
    LITERAL_STRING,
    QUOTED_INT,
    OTHER,
    NOT,
    AND,
    OR,
    OCTAL_INT
}

class Token {
    public kind: TokenKind;
    public value?: string;
    public loc: Location;
    constructor(kind: TokenKind, value: string | null, start: number, end: number) {
        this.kind = kind;
        this.value = value || undefined;
        this.loc = new Location(start, end);
    }
}

function _isLetter(char: string): boolean {
    if (!char) {
        return false;
    }
    return /[a-zA-Z]/.test(char);
}

function _isNumerical(char: string): boolean {
    if (!char) {
        return false;
    }
    return /\d/.test(char);
}

function _isNumerical_0_7(char: string): boolean {
    return ["0", "1", "2", "3", "4", "5", "6", "7"].includes(char);
}

function _isNumerical_16(char: string): boolean {
    if (!char) {
        return false;
    }
    return _isNumerical(char) || /[a-fA-F]/.test(char);
}

function _isIdentifier(char: string): boolean {
    if (!char) {
        return false;
    }
    return _isLetter(char) || _isNumerical(char) || char === "_";
}

function _isSpace(char: string): boolean {
    if (!char) {
        return false;
    }
    return /\s/.test(char);
}

function tokenize(content: string) {
    const tokenizer = new Tokenizer(content);
    return tokenizer.process();
}

class Tokenizer {
    tokens: Token[] = [];
    charsToProcess: string;
    max: number;
    private curPos: number = 0;
    constructor(content: string) {
        this.charsToProcess = content;
        this.max = this.charsToProcess.length;
        this.curPos = 0;
    }
    public process() {
        while (this.curPos < this.max) {
            let char = this.charsToProcess[this.curPos]
            if (this.isAlphabet(char)) {
                this.lexIdentifier();
            } else {
                switch (char) {
                    case '+':
                        this.pushToken(TokenKind.PLUS);
                        break;
                    case '-':
                        this.pushToken(TokenKind.MINUS);
                        break;
                    case '_':
                        this.lexIdentifier();
                        break;
                    case '*':
                        this.pushToken(TokenKind.STAR);
                        break;
                    case '/':
                        if (this.isPairChars('//')) {
                            this.pushOnelineCommentToken();
                        } else if (this.isPairChars('/*')) {
                            this.pushBlockCommentToken()
                        } else {
                            this.pushToken(TokenKind.DIV);
                        }
                        break;
                    case '(':
                        this.pushToken(TokenKind.LPAREN);
                        break;
                    case ')':
                        this.pushToken(TokenKind.RPAREN);
                        break;
                    case '[':
                        this.pushToken(TokenKind.LSQUARE);
                        break;
                    case ']':
                        this.pushToken(TokenKind.RSQUARE);
                        break;
                    case '#':
                        this.pushToken(TokenKind.HASH);
                        break;
                    case '>':
                        if (this.isPairChars('>=')) {
                            this.pushPairToken(TokenKind.GE);
                        } else {
                            this.pushToken(TokenKind.GT);
                        }
                        break;
                    case '<':
                        if (this.isPairChars('<=')) {
                            this.pushPairToken(TokenKind.LE);
                        } else {
                            this.pushToken(TokenKind.LT);
                        }
                        break;
                    case '0':
                    case '1':
                    case '2':
                    case '3':
                    case '4':
                    case '5':
                    case '6':
                    case '7':
                    case '8':
                    case '9':
                        this.lexNumericLiteral(char === '0');
                        break;
                    case ' ':
                    case '\t':
                    case '\r':
                    case '\n':
                        // drift over white space
                        this.curPos++;
                        break;
                    case '\'':
                        this.lexQuotedStringLiteral();
                        break;
                    case '"':
                        this.lexDoubleQuotedStringLiteral();
                        break;
                    case '\\':
                        throw new Error("unexpected escape char");
                    default:
                        this.pushToken(TokenKind.OTHER);
                }
            }
        }
        return this.tokens;
    }
    lexDoubleQuotedStringLiteral() {
        const start = this.curPos;
        let terminated = false;
        while (!terminated) {
            this.curPos++;
            const ch = this.charsToProcess[this.curPos];
            if (ch == '"') {
                terminated = true;
            }
            if (this.isExhausted()) {
                throw new Error("Non-terminated double quoted string");
            }
        }
        this.curPos++;
        this.addToken(TokenKind.LITERAL_STRING, this.charsToProcess.substring(start, this.curPos), start, this.curPos);
    }
    // STRING_LITERAL: '\''! (0-9a-zA-Z)* '\''!;
    // 理论上可以使用0-255对应的字符。实际中并未看到除了数字字母以外的值。
    lexQuotedStringLiteral() {
        const start = this.curPos;
        let terminated = false;
        while (!terminated) {
            this.curPos++;
            const ch = this.charsToProcess[this.curPos];
            if (ch === '\'') {
                terminated = true;
            }
            if ((!this.isDigit(ch)) && (!this.isAlphabet(ch))) {
                throw new Error("Invalid single-quoted integer");
            }
            if (this.isExhausted()) {
                throw new Error("Non-terminating quoted integer");
            }
        }
        this.curPos++;
        this.addToken(TokenKind.QUOTED_INT, this.charsToProcess.substring(start, this.curPos), start, this.curPos);
    }
    isExhausted() {
        return (this.curPos == (this.max - 1))
    }
    pushBlockCommentToken() {
        const start = this.curPos;
        this.curPos += 2;
        while (true) {
            if (this.charsToProcess[this.curPos] === '*' &&
                this.isPairChars('*/')) {
                this.curPos++;
                break;
            }
            this.curPos += 2;
        }
        this.addToken(TokenKind.COMMENT, this.charsToProcess.substring(start, this.curPos), start, this.curPos);
    }

    // REAL_LITERAL :
    // ('.' (DECIMAL_DIGIT)+ (EXPONENT_PART)? (REAL_TYPE_SUFFIX)?) |
    // ((DECIMAL_DIGIT)+ '.' (DECIMAL_DIGIT)+ (EXPONENT_PART)? (REAL_TYPE_SUFFIX)?) |
    // ((DECIMAL_DIGIT)+ (EXPONENT_PART) (REAL_TYPE_SUFFIX)?) |
    // ((DECIMAL_DIGIT)+ (REAL_TYPE_SUFFIX));
    // fragment INTEGER_TYPE_SUFFIX : ( 'L' | 'l' );
    // fragment HEX_DIGIT :
    // '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'A'|'B'|'C'|'D'|'E'|'F'|'a'|'b'|'c'|'d'|'e'|'f';
    //
    // fragment EXPONENT_PART : 'e' (SIGN)* (DECIMAL_DIGIT)+ | 'E' (SIGN)*
    // (DECIMAL_DIGIT)+ ;
    // fragment SIGN : '+' | '-' ;
    // fragment REAL_TYPE_SUFFIX : 'F' | 'f' | 'D' | 'd';
    // INTEGER_LITERAL
    // : (DECIMAL_DIGIT)+ (INTEGER_TYPE_SUFFIX)?;
    lexNumericLiteral(isFirstZero: boolean) {
        let isReal = false;
        const start = this.curPos;
        const ch2 = this.charsToProcess[this.curPos + 1];
        const isHex = (ch2 === 'x' || ch2 === 'X');
        if (isFirstZero) {
            if (isHex) {
                // deal with hexadecimal
                this.curPos++;
                do {
                    this.curPos++;
                } while (this.isHexadecimalDigit(this.charsToProcess[this.curPos]))
                this.addToken(TokenKind.HEX_INT, this.charsToProcess.substring(start + 2, this.curPos), start, this.curPos);
                return;
            } else {
                // deal with octal demical
                this.curPos++;
                do {
                    this.curPos++;
                } while (this.isOctalDecimalDigit(this.charsToProcess[this.curPos]))
                this.addToken(TokenKind.OCTAL_INT, this.charsToProcess.substring(start + 1, this.curPos), start, this.curPos);
                return;
            }
        }
        // real numbers must have leading digits
        // Consume first part of number
        do {
            this.curPos++;
        } while (this.isDigit(this.charsToProcess[this.curPos]))
        // a '.' indicates this number is a real
        const ch = this.charsToProcess[this.curPos];
        if (ch === '.') {
            isReal = true;
            const dotPos = this.curPos;
            do {
                this.curPos++;
            } while (this.isDigit(this.charsToProcess[this.curPos]));
            if (this.curPos === dotPos + 1) {
                // the number is something like '3.'. It is really an int but may be
                // part of something like '3.toString()'. In this case process it as
                // an int and leave the dot as a separate token.
                this.curPos = dotPos;
                this.addToken(TokenKind.INT, this.charsToProcess.substring(start, this.curPos), start, this.curPos);
                return;
            }
        }
        if (isReal) {
            this.addToken(TokenKind.REAL, this.charsToProcess.substring(start, this.curPos), start, this.curPos);
        } else {
            this.addToken(TokenKind.INT, this.charsToProcess.substring(start, this.curPos), start, this.curPos);
        }
    }
    isOctalDecimalDigit(char: string) {
        return _isNumerical_0_7(char);
    }
    isDigit(char: string) {
        return _isNumerical(char);
    }
    isHexadecimalDigit(char: string) {
        return _isNumerical_16(char);
    }
    isPairChars(charPair: string) {
        return (charPair.length == 2 &&
            charPair[0] === this.charsToProcess[this.curPos] &&
            charPair[1] === this.charsToProcess[this.curPos + 1])
    }
    pushOnelineCommentToken() {
        const start = this.curPos;
        this.curPos += 2;
        let ch = this.charsToProcess[this.curPos]
        while ((ch != '\n')) {
            this.curPos++;
        }
        this.addToken(TokenKind.COMMENT, this.charsToProcess.substring(start, this.curPos), start, this.curPos);
    }
    pushToken(type: TokenKind, value: string | null = null) {
        const start = this.curPos;
        this.curPos++;
        this.addToken(type, value, start, this.curPos);
    }
    pushPairToken(type: TokenKind, value: string | null = null) {
        const start = this.curPos;
        this.curPos += 2;
        this.addToken(type, value, start, this.curPos);
    }
    lexIdentifier() {
        const start = this.curPos;
        do {
            this.curPos++;
        } while (this.isIdentifier(this.charsToProcess[this.curPos]));
        const subarray = this.charsToProcess.substring(start, this.curPos);
        if (subarray === "not") {
            this.addToken(TokenKind.NOT, null, start, this.curPos);
        } else if (subarray === "and") {
            this.addToken(TokenKind.AND, null, start, this.curPos);
        } else if (subarray === "or") {
            this.addToken(TokenKind.OR, null, start, this.curPos);
        } else {
            this.addToken(TokenKind.ID, subarray, start, this.curPos);
        }
    }
    addToken(type: TokenKind, value: string | null, startPos: number, endPos: number) {
        const token = new Token(type, value, startPos, endPos);
        this.tokens.push(token);
    }
    isIdentifier(char: string) {
        return _isIdentifier(char);
    }
    isAlphabet(char: string) {
        return _isLetter(char);
    }
}

//#region 
// tokenizer(`
// /*123*/
// /// 
// / /*123*/
// "123456789"
// a
// 0xfF00
// 0
// 0.
// 0.12
// 9
// 988.
// 999.266x
// .
// .09
// 0.000
// '
// ''
// 'a
// 'a4_4'
// 'fF09'
// #
// #a123456
// $
// $tt
// $0
// $fF5_d
// ==
// =
// !=
// !
// &&
// &
// ||
// |
// ->
// /
// *
// +
// ()
// {}
// []
// ,
// ;
// 我唔知电算啊
// id`);

/*
import("fs").then(fs => {
  const content = fs.readFileSync("C:\\Users\\Administrator\\Desktop\\02.j").toString("utf-8");

  const tokens = tokenizer(content);

  // console.log(tokens);
})*/
//#endregion

export { tokenize, Token, TokenKind };

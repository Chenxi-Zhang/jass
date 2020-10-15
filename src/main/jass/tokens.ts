import { Location } from "./range";

enum TokenKind {
    ID,
    PLUS,
    MINUS,
    STAR,
    div,
    lparen,
    rparen,
    lsquare,
    rsquare,
    lcurly,
    rcurly,
    eq,
    assign,



}

class Token {
    public type: TokenKind;
    public value: string;
    public loc: Location = new Location();
    constructor(type: TokenKind, value: string) {
        this.type = type;
        this.value = value;
    }
    public isId() {
        return this.type === "id";
    }
    public isOp() {
        return this.type === "op";
    }
    public isInt() {
        return this.type === "int";
    }
    public isReal() {
        return this.type === "real";
    }
    public isString() {
        return this.type === "string";
    }
    public isComment() {
        return this.type === "comment";
    }
    public isBlockComment() {
        return this.type === "block_comment";
    }
    public isMacro() {
        return this.type === "macro";
    }
    public isOther() {
        return this.type === "other";
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

class Tokenlizer {
    private tokens: Token[] = [];
    lines: Array<string> = [];
    curLine: string = "";
    private curToken: Token | null = null;
    private curLineNo: number = 0;
    private curPos: number = 0;
    private curVal: Array<string> = [];
    private isBlockComment = false;
    public parse(content: string) {
        this.lines = content.replace(/\r\n/g, "\n").split("\n");
        this.eatLine();
        this.checkValidation();
        return this.tokens;
    }
    checkValidation() {
        if (this.curTokenExist()) {
            throw new Error("");
        }
    }
    eatLine() {
        while (this.curLineNo >= this.lines.length) {
            const line = this.lines[this.curLineNo];
            this.parseLine(line);
            this.curLineNo++;
        }
    }

    curTokenExist(): boolean {
        return this.curToken !== null;
    }

    parseLine(line: string) {
        this.curPos = 0;
        const chars = line.split("");
        while (this.curPos < line.length && !this.isBlockComment) {
            const char = chars[this.curPos];
            if (this.isAlphabet(char)) {
                // if (this.isBoolOp(chars)) {
                //     this.eatBoolOp(chars)
                // }
                this.lexIdentifier(chars);
            } else {
                switch (char) {
                    case '+':
                        this.pushCharToken('+');
                        break;
                    case '-':
                        this.pushCharToken('-');
                        break;
                    case '_':
                        this.lexIdentifier(chars);
                        break;
                    case '*':
                        this.pushCharToken('*');
                        break;
                    case '/':
                        if (this.twoSlash(chars)) {
                            this.eatOnelineComment(chars);
                        } else if (this.slashStart(chars)) {
                            this.isBlockComment = true;
                        }
                        this.pushCharToken('*');
                        break;
                    case '(':
                        this.pushCharToken('(');
                        break;
                    default:
                        break;
                }
            }
        }
        if (this.isBlockComment) {
            this.eatBlockComment(chars);
        }
    }
    slashStart(chars: string[]) {
        return chars[this.curPos+1] === '*';
    }
    eatOnelineComment(chars: string[]) {
        throw new Error("Method not implemented.");
    }
    twoSlash(chars: string[]) {
        return chars[this.curPos+1] === '/';
    }
    eatBlockComment(chars: string[]) {
        throw new Error("Method not implemented.");
    }
    eatBoolOp(chars: string[]) {
        let ret;
        const start = this.curPos;
        if (chars.slice(start, start + 3).join() === "or ") {
            ret = chars.slice(start, start + 2);
            this.curPos += 2;
        } else {
            ret = chars.slice(start, start + 3);
            this.curPos += 3;
        }
        this.addToken("op", ret.join(), start, this.curPos, this.curLineNo);
    }
    isBoolOp(chars: string[]) {
        return (chars.slice(this.curPos, this.curPos + 3).join() === "or " ||
            chars.slice(this.curPos, this.curPos + 4).join() === "and " ||
            chars.slice(this.curPos, this.curPos + 4).join() === "not ")
    }
    pushCharToken(char: string) {
        const start = this.curPos;
        this.curPos++;
        this.addToken("op", char, start, this.curPos, this.curLineNo);
    }
    lexIdentifier(chars: string[]) {
        const start = this.curPos;
        do {
            this.curPos++;
        } while (this.isIdentifier(chars[this.curPos]));
        const subarray = chars.slice(start, this.curPos);
        this.addToken('id', subarray.join(), start, this.curPos, this.curLineNo);
    }
    addToken(type: string, value: string, startPos: number, endPos: number, line: number) {
        const token = new Token(type, value);
        token.loc = new Location;
        token.loc.startLine = line;
        token.loc.startPosition = startPos;
        token.loc.endLine = line;
        token.loc.endPosition = endPos;
        this.tokens.push(token);
    }
    isIdentifier(char: string) {
        return _isIdentifier(char);
    }
    isAlphabet(char: string) {
        return _isLetter(char);
    }
}

function tokenize(content: string): Token[] {
    const tokens: Token[] = [];
    const lines: Array<string> = content.replace(/\r\n/g, "\n").split("\n").map((line, index, lines) => {
        // return index === lines.length - 1 ? Array.from(line) : Array.from(line).concat("\n");
        return line;
    });
    lines.forEach((line, index, arr) => {
    })
    return tokens;
}

function tokenizeOld(content: string): Token[] {

    const tokens: Token[] = [];
    const lines: Array<Array<string>> = content.replace(/\r\n/g, "\n").split("\n").map((line, index, lines) => {
        return index === lines.length - 1 ? Array.from(line) : Array.from(line).concat("\n");
    });
    const values: string[] = [];
    let inBlockComment: boolean = false;

    let startLine: number = 0;
    let startPosition: number = 0;
    function pushBlockComment(endLine: number, endPosition: number) {
        const token = new Token("block_comment", values.join(""));
        token.loc = new Location;
        token.loc.startLine = startLine;
        token.loc.startPosition = startPosition;
        token.loc.endLine = endLine;
        token.loc.endPosition = endPosition;
        tokens.push(token);
        values.length = 0;
    }
    function pushToken(type: string, startLine: number, startPosition: number, endLine: number, endPosition: number) {
        const token = new Token(type, values.join(""));
        token.loc = new Location;
        token.loc.startLine = startLine;
        token.loc.startPosition = startPosition;
        token.loc.endLine = endLine;
        token.loc.endPosition = endPosition;
        tokens.push(token);
        values.length = 0;
    }
    lines.forEach((lineChars, lineCount, lines) => {
        for (let position = 0; position < lineChars.length;/*position++*/) {
            const char = lineChars[position];
            function nextChar() {
                return lineChars[position + 1];
            }

            function nextReal(pos: number) {
                const cur = lineChars[pos];
                if (_isNumerical(cur)) {
                    values.push(cur);
                    position++;
                    nextReal(pos + 1);
                } else {
                    pushToken("real", startLine, startPosition, lineCount, position);
                }
            }

            // const next_char = lineChars[position + 1];
            if (inBlockComment) {
                values.push(char);
                if (char === "*") {
                    if (nextChar() === "/") {
                        values.push(nextChar());
                        position += 2;
                        inBlockComment = false;
                        pushBlockComment(lineCount, position);
                    } else {
                        position++;
                    }
                } else {
                    // values.push(char);
                    position++;
                }
            } else if (char === "/") {
                values.push(char);
                if (!inBlockComment && nextChar() === "*") {
                    startLine = lineCount;
                    startPosition = position;
                    values.push(nextChar());
                    inBlockComment = true;
                    position += 2;
                } else if (nextChar() === "/") {
                    startLine = lineCount;
                    startPosition = position;
                    values.push(nextChar());
                    position += 2;
                    function next(pos: number) {
                        const cur = lineChars[pos];
                        if (cur) {
                            values.push(cur);
                            position++;
                            next(pos + 1);
                        } else {
                            pushToken("comment", startLine, startPosition, lineCount, position);
                        }
                    }
                    next(position);
                } else {
                    startLine = lineCount;
                    startPosition = position;
                    position++;
                    pushToken("op", startLine, startPosition, lineCount, position);
                }
            } else if (char === "#") {
                function next(pos: number) {
                    const cur = lineChars[pos];
                    if (cur) {
                        values.push(cur);
                        position++;
                        next(pos + 1);
                    } else {
                        pushToken("macro", startLine, startPosition, lineCount, position);
                    }
                }
                next(position);
            } else if (char === "\"") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);
                position++;

                let inIsm = false;
                function next(pos: number) {
                    const cur = lineChars[pos];
                    if (cur === "\"") {
                        values.push(cur);
                        position++;
                        if (inIsm) {
                            inIsm = false;
                            next(pos + 1);
                        } else {
                            pushToken("string", startLine, startPosition, lineCount, position);
                        }
                    } else if (cur === "\\") {
                        inIsm = !inIsm;
                        values.push(cur);
                        position++;
                        next(pos + 1);
                    } else if (!cur) {
                        pushToken("unclose_string", startLine, startPosition, lineCount, position);
                    } else {
                        if (inIsm) {
                            inIsm = false;
                        }
                        values.push(cur);
                        position++;
                        next(pos + 1);
                    }
                }
                next(position);
            } else if (_isLetter(char)) {
                startLine = lineCount;
                startPosition = position;
                values.push(char);
                position++;
                function next(pos: number) {
                    const cur = lineChars[pos];
                    if (_isIdentifier(cur)) {
                        values.push(cur);
                        position++;
                        next(pos + 1);
                    } else {
                        pushToken("id", startLine, startPosition, lineCount, position);
                    }
                }
                next(position);
            } else if (char === "0") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);
                if (nextChar() === ".") {
                    values.push(nextChar());
                    position += 2;
                    function next(pos: number) {
                        const cur = lineChars[pos];
                        if (_isNumerical(cur)) {
                            values.push(cur);
                            position++;
                            next(pos + 1);
                        } else {
                            pushToken("real", startLine, startPosition, lineCount, position);
                        }
                    }
                    next(position);
                } else if (nextChar() === "x") {
                    values.push(nextChar());
                    if (_isNumerical_16(lineChars[position + 2])) {
                        values.push(lineChars[position + 2]);
                        position += 3;
                        function next(pos: number) {
                            const cur = lineChars[pos];
                            if (_isNumerical_16(cur)) {
                                values.push(cur);
                                position++;
                                next(pos + 1);
                            } else {
                                pushToken("hex", startLine, startPosition, lineCount, position);
                            }
                        }
                        next(position);
                    } else {
                        position += 2;
                        pushToken("error_hex", startLine, startPosition, lineCount, position);
                    }
                } else if (_isNumerical_0_7(nextChar())) {
                    values.push(nextChar());
                    position += 2;
                    function next(pos: number) {
                        const cur = lineChars[pos];
                        if (_isNumerical_0_7(cur)) {
                            values.push(cur);
                            position++;
                            next(pos + 1);
                        } else {
                            pushToken("oct", startLine, startPosition, lineCount, position);
                        }
                    }
                    next(position);
                } else {
                    position++;
                    pushToken("int", startLine, startPosition, lineCount, position);
                }
            } else if (_isNumerical(char) /* 不包含0,1-9 */) {
                startLine = lineCount;
                startPosition = position;
                values.push(char);



                if (nextChar() === ".") {
                    values.push(nextChar());
                    position += 2;
                    nextReal(position);
                } else if (_isNumerical(nextChar())) {
                    values.push(nextChar());
                    position += 2;

                    function next(pos: number) {
                        const cur = lineChars[pos];
                        if (cur === ".") {
                            values.push(cur);
                            position++;
                            nextReal(pos + 1);
                        } else if (_isNumerical(cur)) {
                            values.push(cur);
                            position++;
                            next(pos + 1);
                        } else {
                            pushToken("int", startLine, startPosition, lineCount, position);
                        }
                    }
                    next(position);
                } else {
                    position++;
                    pushToken("int", startLine, startPosition, lineCount, position);
                }
            } else if (char === ".") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);

                if (_isNumerical(nextChar())) {
                    values.push(nextChar());
                    position += 2;

                    nextReal(position);
                } else {
                    position++;
                    pushToken("op", startLine, startPosition, lineCount, position);
                }
            } else if (char === "'") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);
                position++;

                function next(pos: number) {
                    const cur = lineChars[pos];
                    if (cur === "'") {
                        values.push(cur);
                        position++;
                        pushToken("code", startLine, startPosition, lineCount, position);
                    } else if (_isNumerical(cur) || _isLetter(cur)) {
                        values.push(cur);
                        position++;
                        next(pos + 1);
                    } else {
                        pushToken("unclose_code", startLine, startPosition, lineCount, position);
                    }
                }
                next(position);
            } else if (char === "$") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);

                if (_isNumerical_16(nextChar())) {
                    values.push(nextChar());
                    position += 2;
                    function next(pos: number) {
                        const cur = lineChars[pos];
                        if (_isNumerical_16(cur)) {
                            values.push(cur);
                            position++;
                            next(pos + 1);
                        } else {
                            pushToken("hex", startLine, startPosition, lineCount, position);
                        }
                    }
                    next(position);
                } else {
                    position++;
                    pushToken("error_hex", startLine, startPosition, lineCount, position);
                }
            } else if (char === "=") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);
                if (nextChar() === "=") {
                    values.push(nextChar());
                    position += 2;
                    pushToken("op", startLine, startPosition, lineCount, position);
                } else {
                    position++;
                    pushToken("op", startLine, startPosition, lineCount, position);
                }
            } else if (char === "-") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);
                if (nextChar() === ">") {
                    values.push(nextChar());
                    position += 2;
                    pushToken("op", startLine, startPosition, lineCount, position);
                } else {
                    position++;
                    pushToken("op", startLine, startPosition, lineCount, position);
                }
            } else if (char === ">") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);
                if (nextChar() === "=") {
                    values.push(nextChar());
                    position += 2;
                    pushToken("op", startLine, startPosition, lineCount, position);
                } else {
                    position++;
                    pushToken("op", startLine, startPosition, lineCount, position);
                }
            } else if (char === "<") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);
                if (nextChar() === "=") {
                    values.push(nextChar());
                    position += 2;
                    pushToken("op", startLine, startPosition, lineCount, position);
                } else {
                    position++;
                    pushToken("op", startLine, startPosition, lineCount, position);
                }
            } else if (char === "!") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);
                if (nextChar() === "=") {
                    values.push(nextChar());
                    position += 2;
                    pushToken("op", startLine, startPosition, lineCount, position);
                } else {
                    position++;
                    pushToken("op", startLine, startPosition, lineCount, position);
                }
            } else if (char === "|") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);
                if (nextChar() === "|") {
                    values.push(nextChar());
                    position += 2;
                    pushToken("op", startLine, startPosition, lineCount, position);
                } else {
                    position++;
                    pushToken("other", startLine, startPosition, lineCount, position);
                }
            } else if (char === "&") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);
                if (nextChar() === "&") {
                    values.push(nextChar());
                    position += 2;
                    pushToken("op", startLine, startPosition, lineCount, position);
                } else {
                    position++;
                    pushToken("other", startLine, startPosition, lineCount, position);
                }
            } else if (char === "+" || char === "*" || char === "(" || char === ")" || char === "{" || char === "}" || char === "[" || char === "]" || char === "," || char === ";" || char === "%") {
                startLine = lineCount;
                startPosition = position;
                values.push(char);
                position++;
                pushToken("op", startLine, startPosition, lineCount, position);
            }/* else if (char === "\n") {
        startLine = lineCount;
        startPosition = position;
        values.push(char);
        position++;
        pushToken("new_line", startLine, startPosition, lineCount, position);
      } */else if (_isSpace(char)) {
                position++;
            } else {
                startLine = lineCount;
                startPosition = position;
                position++;
                values.push(char);
                position++;
                pushToken("other", startLine, startPosition, lineCount, position);
            }
        }

    });
    return tokens;
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

export { tokenize, Token };

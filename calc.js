const TokenType = {
    Error: "Error",
    Eof: "Eof",

    Num: "Num", // long double

    LParen: "LParen",
    RParen: "RParen",

    Exp: "Exp",

    Tilda: "Tilda", // bitwise not
    Fact: "Fact",

    Mult: "Mult",
    Div: "Div",
    Mod: "Mod",

    Plus: "Plus",
    Minus: "Minus",

    LShift: "LShift",
    RShift: "RShift",

    And: "And", // bitwise And
    Xor: "Xor",
    Or: "Or",

    // constants
    PI: "PI", //3.141592653589793
    E: "E", //2.718281828459045

    // builtin functions
    Sin: "Sin", // input radian
    Cos: "Cos",
    Tan: "Tan",
    Deg: "Deg", // degree to radian
    Log: "Log", // natural log
    Abs: "Abs"
}

class Token {
    constructor(type, value) {
        this.type = type;
        this.value = value;
    }
}

class LexerParser {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.len = input.length;
        this.last = null;
    }

    curChar() {
        if (this.pos < this.len) {
            return this.input[this.pos];
        }
        return null;
    }

    nextChar() {
        if (this.pos + 1 < this.len) {
            return this.input[this.pos + 1];
        }
        return null;
    }

    isWhitespace(ch) { return typeof ch === "string" && ch.length === 1 && ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n'; }
    isDigit(ch) { return typeof ch === "string" && ch.length === 1 && ch >= '0' && ch <= '9'; }
    isSmallAlpha(ch) { return typeof ch === "string" && ch.length === 1 && ch >= 'a' && ch <= 'z'; }
    isBigAlpha(ch) { return typeof ch === "string" && ch.length === 1 && ch >= 'A' && ch <= 'Z'; }

    readNumber() {
        let i = this.pos;
        while (this.isDigit(this.curChar())) {
            this.pos += 1;
        }
        return this.input.substring(i, this.pos);
    }

    lexFloat() {
        let left = this.readNumber();
        if (this.curChar() == '.' && this.isDigit(this.nextChar())) {
            this.pos += 1;
            let right = this.readNumber();
            return new Token(TokenType.Num, Number(left+"."+right));
        }
        return new Token(TokenType.Num, Number(left));
    }

    xNext() {
        while (this.isWhitespace(this.curChar())) {
            this.pos += 1;
        }
        let ch = this.curChar();

        if (this.isDigit(ch)) {
            return this.lexFloat();
        }

        if (this.isSmallAlpha(ch)) {
            let out = null;
            if (this.pos + 3 > this.len)
                return new Token(TokenType.Error, 0);
            let tmp = this.input.substring(this.pos, this.pos + 3);
            this.pos += 3;
            if (tmp == "sin") {
                out = new Token(TokenType.Sin, 0);
            } else if (tmp == "cos") {
                out = new Token(TokenType.Cos, 0);
            } else if (tmp == "tan") {
                out = new Token(TokenType.Tan, 0);
            } else if (tmp == "deg") {
                out = new Token(TokenType.Deg, 0);
            } else if (tmp == "log") {
                out = new Token(TokenType.Log, 0);
            } else if (tmp == "abs") {
                out = new Token(TokenType.Abs, 0);
            } else {
                out = new Token(TokenType.Error, 0);
            }
            return out;
        }

        this.pos += 1;
        switch (ch) {
            case null:
                return new Token(TokenType.Eof, 0);
            case '+':
                return new Token(TokenType.Plus, 0);
            case '-':
                return new Token(TokenType.Minus, 0);
            case '~':
                return new Token(TokenType.Tilda, 0);
            case '%':
                return new Token(TokenType.Mod, 0);
            case '/':
                return new Token(TokenType.Div, 0);
            case '*':
                if (this.curChar() == '*') {
                    this.pos += 1;
                    return new Token(TokenType.Exp, 0);
                }
                return new Token(TokenType.Mult, 0);
            case '!':
                return new Token(TokenType.Fact, 0);
            case '&':
                return new Token(TokenType.And, 0);
            case '|':
                return new Token(TokenType.Or, 0);
            case '^':
                return new Token(TokenType.Xor, 0);
            case '<':
                if (this.curChar() == '<') {
                    this.pos += 1;
                    return new Token(TokenType.LShift, 0);
                }
                return new Token(TokenType.Error, 0);
            case '>':
                if (this.curChar() == '>') {
                    this.pos += 1;
                    return new Token(TokenType.RShift, 0);
                }
                return new Token(TokenType.Error, 0);
            case 'E':
                return new Token(TokenType.Num, Math.E);
            case 'P':
                if (this.curChar() == 'I') {
                    this.pos += 1;
                    return new Token(TokenType.Num, Math.PI);
                }
                return new Token(TokenType.Error, 0);
            case '(':
                return new Token(TokenType.LParen, 0);
            case ')':
                return new Token(TokenType.RParen, 0);
        }
        return new Token(TokenType.Error, 0);
    }

    Next() {
        this.last = this.xNext();
        return this.last;
    }

    Peek() {
        let ind = this.pos;
        let out = this.Next();
        this.pos = ind;
        return out;
    }

    Last() { return this.last; }

    prefixBindingPower(t) {
        switch (t.type) {
            case TokenType.Plus:
            case TokenType.Minus:
            case TokenType.Tilda:
                return [0,95];
            default:
                return [0, 0];
        }
    }

    postfixBindingPower(t) {
        switch (t.type) {
            case TokenType.LParen:
                return [99,0];
            case TokenType.Fact:
                return [97,0];
            default:
                return [0,0];
        }
    }

    infixBindingPower(t) {
        switch (t.type) {
            case TokenType.Exp:
                return [93,92];
            case TokenType.Mult:
            case TokenType.Mod:
            case TokenType.Div:
                return [90,91];
            case TokenType.Plus:
            case TokenType.Minus:
                return [88,89];
            case TokenType.LShift:
            case TokenType.RShift:
                return [86,87];
            case TokenType.And:
                return [84,85];
            case TokenType.Xor:
                return [82,83];
            case TokenType.Or:
                return [80,81];
            default:
                return [0,0];
        }
    }

    isInt(n){
        return Number(n) === n && n % 1 === 0;
    }

    prefixOp(op, rhs) {
        if (rhs.type != TokenType.Num)
            return new Token(TokenType.Error, 0);
        switch (op.type) {
            case TokenType.Plus:
                return rhs;
            case TokenType.Minus:
                rhs.value = -rhs.value;
                return rhs;
            case TokenType.Tilda:
                if (this.isInt(rhs.value) == false)
                    return new Token(TokenType.Error, 0);
                rhs.value = ~rhs.value;
                return rhs;
            default:
                return new Token(TokenType.Error, 0);
        }
    }

    factorial(n) {
        let ans = 1;
        for (let i = 1; i <= n; i++) {
            ans *= i;
        }
        return ans;
    }

    posfixOp(op, lhs) {
        switch (op.type) {
            case TokenType.Fact:
                if (lhs.type != TokenType.Num)
                    return new Token(TokenType.Error, 0);
                if (this.isInt(lhs.value) == false)
                    return new Token(TokenType.Error, 0);
                lhs.value = this.factorial(lhs.value);
                return lhs;
            case TokenType.LParen:
                let rhs = this.expr_bp(0);
                if (rhs.type != TokenType.Num)
                    return new Token(TokenType.Error, 0);
                let t = this.Next();
                if (t.type != TokenType.RParen)
                    return new Token(TokenType.Error, 0);
                switch (lhs.type) {
                    case TokenType.Sin:
                        return new Token(TokenType.Num, Math.sin(rhs.value));
                    case TokenType.Cos:
                        return new Token(TokenType.Num, Math.cos(rhs.value));
                    case TokenType.Tan:
                        return new Token(TokenType.Num, Math.tan(rhs.value));
                    case TokenType.Abs:
                        if (rhs.value < 0)
                            return new Token(TokenType.Num, -rhs.value);
                        return new Token(TokenType.Num, rhs.value);
                    case TokenType.Log:
                        return new Token(TokenType.Num, Math.log(rhs.value));
                    case TokenType.Deg:
                        return new Token(TokenType.Num, rhs.value * Math.PI/ 180);
                    default:
                        return new Token(TokenType.Error, 0);
                }
            default:
                return new Token(TokenType.Error, 0);
        }
    }

    infixOp(op, lhs, rhs) {
        if (rhs.type != TokenType.Num)
            return new Token(TokenType.Error, 0);
        if (lhs.type != TokenType.Num)
            return new Token(TokenType.Error, 0);

        let out = null;
        switch (op.type) {
            case TokenType.Plus:
                out = lhs.value + rhs.value;
                break;
            case TokenType.Minus:
                out = lhs.value - rhs.value;
                break;
            case TokenType.Mult:
                out = lhs.value * rhs.value;
                break;
            case TokenType.Mod:
                if (this.isInt(lhs.value) && this.isInt(rhs.value)) {
                    out = lhs.value % rhs.value;
                    break;
                }
                return new Token(TokenType.Error, 0);
            case TokenType.Div:
                out = lhs.value / rhs.value;
                break;
            case TokenType.LShift:
                if (this.isInt(lhs.value) && this.isInt(rhs.value)) {
                    out = lhs.value << rhs.value;
                    break;
                }
                return new Token(TokenType.Error, 0);
            case TokenType.RShift:
                if (this.isInt(lhs.value) && this.isInt(rhs.value)) {
                    out = lhs.value >> rhs.value;
                    break;
                }
                return new Token(TokenType.Error, 0);
            case TokenType.Xor:
                if (this.isInt(lhs.value) && this.isInt(rhs.value)) {
                    out = lhs.value ^ rhs.value;
                    break;
                }
                return new Token(TokenType.Error, 0);
            case TokenType.Or:
                if (this.isInt(lhs.value) && this.isInt(rhs.value)) {
                    out = lhs.value | rhs.value;
                    break;
                }
                return new Token(TokenType.Error, 0);
            case TokenType.And:
                if (this.isInt(lhs.value) && this.isInt(rhs.value)) {
                    out = lhs.value & rhs.value;
                    break;
                }
                return new Token(TokenType.Error, 0);
            case TokenType.Exp:
                out = Math.pow(lhs.value, rhs.value);
                break;
            default:
                return new Token(TokenType.Error, 0);
        }
        return new Token(TokenType.Num, out);
    }

    expr_bp(min_bp) {
        let lhs = this.Next();
        let rhs = null;
        switch (lhs.type) {
            case TokenType.Num:
                break;
            case TokenType.LParen:
                lhs = this.expr_bp(0);
                let t = this.Next();
                if (t.type != TokenType.RParen)
                    return new Token(TokenType.Error, 0);
                break;
            default:
                let [lbp, rbp] = this.prefixBindingPower(lhs);
                if (rbp == 0)
                    break;
                rhs = this.expr_bp(rbp);
                lhs = this.prefixOp(lhs, rhs);
        }

        while (true) {
            let op = this.Peek();
            if (op.type == TokenType.Eof)
                break;
            let [lbp, rbp] = this.postfixBindingPower(op);
            if (lbp != 0) {
                if (lbp < min_bp)
                    break;
                this.Next();
                lhs = this.posfixOp(op, lhs);
                continue;
            }
            [lbp, rbp] = this.infixBindingPower(op);
            if (lbp != 0 && rbp != 0) {
                if (lbp < min_bp)
                    break;
                this.Next();
                rhs = this.expr_bp(rbp);
                lhs = this.infixOp(op, lhs, rhs);
                continue;
            }
            break;
        }
        return lhs;
    }

    expr() {
        let out = this.expr_bp(0);
        if (this.Last().type == TokenType.Eof && out.type == TokenType.Num) {
            return out.value;
        }
        return null;
    }
}

function parse(str) {
    let l = new LexerParser(str);
    return l.expr();
}


let str = "~77 + 34.34*5/(4+5-3)**1.2 + (4^1>>3<<4&1|4^45) + sin(30) + sin(PI/2+0) + E+abs(-45) + log(12!) ";
// let str = "3+5/3-4! + PI/E";
// let str = "0.1+0.2+log(log(30))";
console.log(parse(str));






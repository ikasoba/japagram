import { Tokens, Values } from "./tokenizer.ts";

export enum RuntimeState {
  None,
  If,
  IfCond,
  Block,
}

export type RuntimeValue = string | number | RuntimeValue[];

export const reprValue = (value: RuntimeValue): string => {
  if (value instanceof Array) {
    return value.map((x) => reprValue(x)).join(" ");
  }

  return "" + value;
};

export const run = (
  tokens: (Values | Tokens)[],
  variables: Record<string, RuntimeValue>,
  fns: Record<string, (x: RuntimeValue) => RuntimeValue>,
) => {
  const stack: (RuntimeValue)[] = [];
  let block: (Values | Tokens)[] = [];
  let state: RuntimeState[] = [];

  const calcValue = (token: Values): RuntimeValue => {
    switch (token.type) {
      case "ident": {
        return variables[token.value] ?? 0;
      }

      case "string":
      case "number": {
        return token.value;
      }
    }
  };

  for (let i = 0; i <= tokens.length; i++) {
    const token = tokens[i] ?? Tokens.NoOp;

    const currentState = state.pop() ?? RuntimeState.None;
    switch (currentState) {
      case RuntimeState.None: {
        if (typeof token == "object") {
          stack.push(calcValue(token));
        } else {
          switch (token) {
            case Tokens.NoOp: {
              break;
            }

            case Tokens.If: {
              state.push(RuntimeState.If, RuntimeState.IfCond);
              block = [];
              break;
            }

            case Tokens.Then:
            case Tokens.EndOfBlock: {
              throw new Error(
                "不正なトークンです。トークンタイプ：" + Tokens[token],
              );
            }

            case Tokens.Not: {
              stack.push(+!stack.pop());
              break;
            }

            case Tokens.Eq: {
              stack.push(+(stack.pop() == stack.pop()));
              break;
            }

            case Tokens.Neq: {
              stack.push(+(stack.pop() != stack.pop()));
              break;
            }

            case Tokens.Pipe: {
              const fnName = tokens[++i];
              if (typeof fnName != "object" || fnName.type != "ident") {
                throw new Error(
                  "不正なトークンです。トークンタイプ：" + Tokens[token],
                );
              }

              const res = fns[fnName.value](stack.pop() ?? 0);
              variables["結果"] = res;
              stack.push(res);
              break;
            }

            case Tokens.Concat: {
              const yToken = tokens[++i];
              if (typeof yToken != "object") {
                throw new Error(
                  "不正なトークンです。トークンタイプ：" + Tokens[token],
                );
              }

              const y = calcValue(yToken);
              const x = stack.pop() ?? 0;

              if (x instanceof Array) {
                stack.push(x.concat(y));
              } else {
                stack.push(([x] as RuntimeValue[]).concat(y));
              }
              break;
            }

            case Tokens.Assign: {
              const identToken = tokens[i - 1];
              const valueToken = tokens[++i];
              if (
                typeof valueToken != "object" ||
                typeof identToken != "object" || identToken.type != "ident"
              ) {
                throw new Error(
                  "不正なトークンです。トークンタイプ：" + Tokens[token],
                );
              }

              const value = calcValue(valueToken);
              variables[identToken.value] = value;
              break;
            }

            case Tokens.Assert: {
              if (!stack.pop()) {
                throw new Error("アサーションエラー");
              }
              break;
            }
          }
        }
        break;
      }

      case RuntimeState.If: {
        if (stack.pop()) {
          run(block, variables, fns);
        }
        break;
      }

      case RuntimeState.IfCond: {
        if (token != Tokens.Then) {
          block.push(token);
          state.push(currentState);
          break;
        } else {
          stack.push(run(block, variables, fns) ?? 0);
          state.push(RuntimeState.Block);
          block = [];
          break;
        }
      }

      case RuntimeState.Block: {
        if (token != Tokens.EndOfBlock) {
          block.push(token);
          state.push(currentState);
          break;
        }
        break;
      }
    }
  }

  return stack.pop();
};

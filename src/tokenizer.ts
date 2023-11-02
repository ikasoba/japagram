import $ from "npm:@ikasoba000/daizu/helper";

export enum Tokens {
  If,
  Then,
  EndOfBlock,
  Not,
  Eq,
  Neq,
  Pipe,
  Concat,
  Assign,
  NoOp,
  Assert,
}

export type Values =
  | {
    type: "ident";
    value: string;
  }
  | {
    type: "number";
    value: number;
  }
  | {
    type: "string";
    value: string;
  };

const ws = $.regexp(/\s+/).ignore();

export const ident = $.createRef<Values, void>();
export const number = $.regexp(/[0-9]+(?:\.[0-9]+)?/).map((x): Values => ({
  type: "number",
  value: parseFloat(x),
}));
export const string = $.tuple(
  $.string("「").ignore(),
  $.regexp(/[^」]*/),
  $.string("」").ignore(),
).map(([x]): Values => ({
  type: "string",
  value: x,
}));

export const ifToken = $.string("もし").map((_) => Tokens.If);
export const thenToken = $.string("なら").map((_) => Tokens.Then);
export const eobToken = $.string("する").map((_) => Tokens.EndOfBlock);
export const notToken = $.string("以外").map((_) => Tokens.Not);
export const eqToken = $.regexp(/であ[るり]/).map((_) => Tokens.Eq);
export const neqToken = $.regexp(/じゃない|ではない/).map((_) => Tokens.Neq);
export const pipeToken = $.string("を").map((_) => Tokens.Pipe);
export const concatToken = $.regexp(/と|、/).map((_) => Tokens.Concat);
export const assignToken = $.string("は").map((_) => Tokens.Assign);
export const noOpToken = $.string("が").map((_) => Tokens.NoOp);
export const assertToken = $.regexp(/です|ます/).map((_) => Tokens.Assert);

export const tokens = $.choice(
  ifToken,
  thenToken,
  eobToken,
  notToken,
  eqToken,
  neqToken,
  pipeToken,
  concatToken,
  assignToken,
  noOpToken,
  assertToken,
);

ident.ref = $.choice(
  tokens,
  number,
  string,
  $.regexp(/\s+/),
).until().map((x): Values => ({
  type: "ident",
  value: x,
}));

export const tokenize = $.choice(
  tokens,
  number,
  string,
  ident,
  ws,
).many0();

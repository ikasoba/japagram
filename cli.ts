import { reprValue, run } from "./src/runtime.ts";
import { tokenize } from "./src/tokenizer.ts";

const source = await Deno.readTextFile(Deno.args[0]);

const tokens = tokenize.parse(source);

run(
  tokens,
  {},
  {
    "出力": (x) => {
      console.log(reprValue(x));
      return 0;
    },
    "尋ねる": (x) => {
      return prompt("" + x) ?? "";
    },
  },
);

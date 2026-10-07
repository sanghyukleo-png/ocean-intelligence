import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// 코어 폰트(src/app/fonts/PretendardVariable.core.woff2)에 넣은 한글 목록과 UI 소스의 한글을 대조한다.
// 실패하면 scripts/subset-fonts.sh를 다시 실행한다. 빠진 글자는 확장 폰트가 받쳐 주므로 화면이 깨지지는
// 않지만, 그 페이지는 확장 폰트(약 270KB)를 추가로 받게 된다. 추출 규칙은 스크립트와 같다.

const SRC = join(process.cwd(), "src");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" ? [] : sourceFiles(path);
    return /\.tsx?$/.test(name) && !name.endsWith(".test.ts") ? [path] : [];
  });
}

function stripComments(code: string) {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

describe("코어 폰트 글자 범위", () => {
  it("UI 문구에 쓰인 한글은 모두 코어 서브셋에 들어 있다", () => {
    const core = new Set(readFileSync(join(SRC, "app/fonts/pretendard-core.txt"), "utf8").trim());
    const missing = new Map<string, string>();
    for (const file of sourceFiles(SRC)) {
      for (const ch of stripComments(readFileSync(file, "utf8"))) {
        if (ch >= "가" && ch <= "힣" && !core.has(ch) && !missing.has(ch)) {
          missing.set(ch, file.slice(SRC.length + 1));
        }
      }
    }
    expect(Object.fromEntries(missing)).toEqual({});
  });
});

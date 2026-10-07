#!/usr/bin/env bash
# Pretendard 서브셋 재생성 스크립트.
# 요구: python3 + fonttools + brotli (pip install fonttools brotli), devDependency `pretendard`.
#
# 결과물 (src/app/fonts/)
#   PretendardVariable.core.woff2  라틴 + 사이트 UI에 실제로 쓰인 한글(주석 제외) + 쓰는 기호. 굵기 축 400–700.
#                                  첫 페인트 직후 받는다(lib/theme.ts의 FONT_LOAD_SCRIPT).
#   PretendardVariable.ext.woff2   나머지 KS X 1001 한글 2,350자 + 자모 + 기호. unicode-range로 선언해
#                                  코어에 없는 글자가 화면에 나올 때만 받는다(예: 기상청 통보문).
#   pretendard-core.txt            코어에 넣은 한글 목록 — font-coverage 테스트가 소스와 대조한다.
#   Pretendard-Bold.og.otf         OG 이미지 렌더 전용(서버에서만 읽음).
#
# UI 문구에 새 한글이 생겨 테스트가 실패하면 이 스크립트를 다시 실행한다.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=node_modules/pretendard/dist
OUT=src/app/fonts
TMP=$(mktemp -d)
PY=${PYTHON:-python3}

# 1) 사이트 한글(주석 제외)과 KS X 1001 나머지
"$PY" - "$TMP" "$OUT/pretendard-core.txt" <<'PY'
import os, re, sys
tmp, core_list = sys.argv[1], sys.argv[2]
han = set()
for root, _, files in os.walk("src"):
    if "__tests__" in root:
        continue
    for f in files:
        if not f.endswith((".ts", ".tsx")) or f.endswith(".test.ts"):
            continue
        s = open(os.path.join(root, f), encoding="utf-8").read()
        s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
        s = re.sub(r"(?m)(^|[^:\"'`])//.*$", r"\1", s)
        han.update(c for c in s if "가" <= c <= "힣")
core = "".join(sorted(han))
ksx = []
for hi in range(0xB0, 0xC9):
    for lo in range(0xA1, 0xFF):
        try:
            ksx.append(bytes([hi, lo]).decode("euc-kr"))
        except UnicodeDecodeError:
            pass
ext = "".join(c for c in ksx if c not in han)
open(f"{tmp}/core.txt", "w", encoding="utf-8").write(core)
open(f"{tmp}/ext.txt", "w", encoding="utf-8").write(ext)
open(f"{tmp}/ksx.txt", "w", encoding="utf-8").write("".join(ksx))
open(core_list, "w", encoding="utf-8").write(core + "\n")
print(f"core hangul {len(core)} · ext hangul {len(ext)}")
PY

CORE_UNICODES="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201D,U+2026,U+2030,U+2082,U+20A9,U+2190-2199,U+2212,U+2264-2265,U+2318"
EXT_UNICODES="U+2010-2027,U+2030-205E,U+20AC,U+2122,U+2190-21FF,U+2200-22FF,U+2460-24FF,U+25A0-25FF,U+3000-303F,U+3131-318E,U+FF01-FF5E"

subset() { # $1 text-file  $2 unicodes  $3 out
  pyftsubset "$SRC/web/variable/woff2/PretendardVariable.woff2" \
    --text-file="$1" --unicodes="$2" --layout-features='kern,liga,calt,tnum,ccmp,locl' --flavor=woff2 --output-file="$TMP/sub.woff2"
  "$PY" - "$TMP/sub.woff2" "$3" <<'PY'
import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
font = instancer.instantiateVariableFont(TTFont(sys.argv[1]), {"wght": (400, 700)})
font.flavor = "woff2"
font.save(sys.argv[2])
PY
}

subset "$TMP/core.txt" "$CORE_UNICODES" "$OUT/PretendardVariable.core.woff2"
subset "$TMP/ext.txt" "$EXT_UNICODES" "$OUT/PretendardVariable.ext.woff2"

pyftsubset "$SRC/public/static/Pretendard-Bold.otf" \
  --text-file="$TMP/ksx.txt" --unicodes="U+0020-007E,U+00A0-00FF,$EXT_UNICODES" \
  --output-file="$OUT/Pretendard-Bold.og.otf"

cp "$SRC/LICENSE.txt" "$OUT/LICENSE-Pretendard.txt"
rm -f "$OUT/PretendardVariable.subset.woff2"
ls -la "$OUT"

#!/usr/bin/env bash
# Pretendard 서브셋 재생성 스크립트.
# 요구: python3 + fonttools + brotli (pip install fonttools brotli), devDependency `pretendard`.
# 결과물: src/app/fonts/PretendardVariable.subset.woff2 (웹, 가변 45–920)
#         src/app/fonts/Pretendard-Bold.og.otf          (OG 이미지 렌더 전용, 서버에서만 읽음)
# 범위: KS X 1001 완성형 한글 2,350자 + 호환 자모 + Basic Latin/Latin-1 + 문장부호·화살표·수학기호·도형.
set -euo pipefail
cd "$(dirname "$0")/.."

SRC=node_modules/pretendard/dist
OUT=src/app/fonts
TMP=$(mktemp -d)

python3 - > "$TMP/ksx.txt" <<'PY'
chars = []
for hi in range(0xB0, 0xC9):
    for lo in range(0xA1, 0xFF):
        try:
            chars.append(bytes([hi, lo]).decode("euc-kr"))
        except UnicodeDecodeError:
            pass
print("".join(chars))
PY

UNICODES="U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-205E,U+20A9,U+20AC,U+2122,U+2190-21FF,U+2200-22FF,U+2460-24FF,U+25A0-25FF,U+3000-303F,U+3131-318E,U+FF01-FF5E"

pyftsubset "$SRC/web/variable/woff2/PretendardVariable.woff2" \
  --text-file="$TMP/ksx.txt" --unicodes="$UNICODES" --layout-features='*' \
  --flavor=woff2 --output-file="$OUT/PretendardVariable.subset.woff2"

pyftsubset "$SRC/public/static/Pretendard-Bold.otf" \
  --text-file="$TMP/ksx.txt" --unicodes="$UNICODES" \
  --output-file="$OUT/Pretendard-Bold.og.otf"

cp "$SRC/LICENSE.txt" "$OUT/LICENSE-Pretendard.txt"
ls -la "$OUT"

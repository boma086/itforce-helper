#!/usr/bin/env python3
"""
Append an 'ultrathink' instruction when the user prompt ends with -u
"""
import json, sys

try:
    data = json.load(sys.stdin)           # Claude Code 把事件信息以 JSON 传进来
    prompt = data.get("prompt", "")

    # 只有以 -u 结尾的提示才追加
    if prompt.rstrip().endswith("-u"):
        print(                       # stdout 会直接变成 Claude 能看的“额外上下文”
            "\nUse the maximum amount of ultrathink. Take all the time you need. It's much better if you do too much research and thinking than not enough."
        )
except Exception as e:
    # 非 0 退出码会在 Claude 界面里显示错误信息，方便调试
    print(f"append_ultrathink hook error: {e}", file=sys.stderr)
    sys.exit(1)

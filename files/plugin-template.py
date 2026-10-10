"""
<アドオン名> — <一行の説明>

使い方: フィルターメニュー → <menu> → "<label>"
必要な依存: 標準ライブラリのみ / numpy（使うなら明記）
"""
import psdpaint


def run():
    # パラメータ（params で宣言したもの）を受け取る
    amount = psdpaint.param("amount", 50)

    # アクティブレイヤーの画素を読む
    img = psdpaint.get_image("active")

    # --- ここで img.data（bytearray, RGBA8）を加工する ---
    # numpy を使う例:
    #   import numpy as np
    #   a = img.to_numpy().astype(np.float32)
    #   a[:, :, :3] = np.clip(a[:, :, :3] * (amount / 50.0), 0, 255)
    #   img = psdpaint.Image.from_numpy(a)

    # 書き戻す（アプリ側で 1 手として取り消し可能）
    psdpaint.set_image("active", img)
    psdpaint.message(f"<アドオン名> を適用しました (amount={amount})")


psdpaint.register(
    "my_addon",                       # 一意の proc id
    "<label>…",                       # メニュー表示名
    run,
    menu="フィルター/Python/自作",     # "/" 区切りのメニューパス
    params=[
        {"name": "amount", "label": "強さ", "type": "int", "default": 50, "min": 0, "max": 100},
    ],
    help="<ダイアログに出す補足>",
)

psdpaint.run()

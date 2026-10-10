# Python プラグイン

`.py` ファイルを 1 つ置くだけでフィルターメニューに項目が増えます。
このフォルダ（アプリ同梱）と、ユーザーデータの `plugins/` フォルダの両方が読み込まれます。
アプリの **フィルター → プラグインフォルダを開く** でユーザー側フォルダが開きます。

## 骨組み

```python
import psdpaint

def run():
    img = psdpaint.get_image("active")     # RGBA8 の Image
    # img.data は bytearray（幅*高さ*4）。numpy があれば img.to_numpy()
    psdpaint.set_image("active", img)
    psdpaint.message("done")

psdpaint.register(
    "my_proc",              # 一意な ID
    "メニュー表示名",        # ラベル
    run,                    # 実行関数
    menu="フィルター/色",    # メニュー階層
    params=[                # 省略可。あれば実行前にダイアログが出る
        {"name": "amount", "label": "量", "type": "int", "default": 10, "min": 0, "max": 100},
    ],
)
psdpaint.run()             # 最後に必ず呼ぶ
```

## API（`psdpaint` モジュール）

| 関数 | 内容 |
| --- | --- |
| `doc()` | `{width, height, layerCount, activeIndex, normalWidth, normalHeight}` |
| `layers()` | レイヤー一覧（下→上） `{id, name, index, opacity, visible, blendMode}` |
| `active_layer()` | アクティブレイヤー情報 |
| `get_image(layer)` | `layer` = `"active"` / `"composite"` / `"normal_map"` / `"normal_height"` / `<id>` |
| `set_image(layer, img)` | 画素を書き戻し（サイズはキャンバスに一致させる）。取り消し可能 |
| `new_layer(name, above=True)` | `{id, index}` を返す |
| `delete_layer(layer)` / `set_layer(layer, name=, opacity=, visible=, blendMode=)` | |
| `fill(layer, r, g, b, a=255)` | |
| `bake(kind, **opts)` | `kind` = `"ao"` / `"light"` / `"objnormal"`。`{layerId}` を返す |
| `message(text)` | ステータスバー |
| `progress(frac, text="")` / `log(*args)` | Python コンソールへ |
| `param(name, default)` | ダイアログで選ばれた値 |

`blendMode` は `normal, multiply, screen, overlay, darken, lighten, color-dodge,
color-burn, hard-light, soft-light, difference, exclusion, hue, saturation,
color, luminosity` のいずれか。

## パラメータの型

`int` `float` `bool` `string` `color`（`#rrggbb` 文字列）`choice`（`choices=[...]` 併記）

## 実行の仕組み

ホスト（Electron メイン）が `python <file>` を 2 通りで起動します。

* `PSDPAINT_MODE=register` … `register()` の内容を JSON で回収してメニュー生成
* `PSDPAINT_MODE=execute PSDPAINT_PROC=<id>` … 実際に実行。`stdin`／複製した `stdout`
  で改行区切り JSON-RPC。`print()` はプロトコルを汚さずコンソールへ転送されます。

Python の場所はアプリの **フィルター → Python の場所を設定** で指定できます
（未設定なら `py` / `python3` / `python` / 既定のインストール先を自動探索）。
numpy を使うプラグインは `pip install numpy` が必要です。

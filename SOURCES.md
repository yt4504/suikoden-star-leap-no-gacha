# 掲載基準と確認資料

2026-09-25時点で、抽選を経ずに確定入手できる**キャラクターの版**のみ収録。たとえばストーリー版のホウ・ラチャナを掲載し、同名のガチャ版は収録しない。イベント版のレオナ・ロモルドを掲載し、ガチャ産の人物は含めない。属性は五行と武器を別フィールドにした。

- KONAMI公式サイト・Fan kit: https://www.konami.com/games/suikoden/star_leap/jp/ja/guideline/fankit
- KONAMI著作物利用ガイドライン: https://www.konami.com/games/suikoden/star_leap/jp/ja/guideline/
- GameWith 108星の個別版、属性、役割、確定加入の分類: https://gamewith.jp/suikoden-star-leap/571900
- Gamerch 108星一覧と章別加入: https://gamerch.com/suikoden/1005683
- GameWith イベント報酬としてのレオナ・ロモルド: https://gamewith.jp/suikoden-star-leap/573130

キャラ画像は参考図鑑 https://playershi.com/gensuisp/character/ の顔アイコンと詳細ページの立ち絵から、版を一件ずつ照合したものを `assets/portraits/` と `assets/fullbody/` に保存した。各画像の対応する版と出典URLは `assets/portrait-sources.json` に記録する。一覧では立ち絵を `portrait-crops.mjs` の座標に従ってCSSで顔が見える位置に表示し、編成では顔アイコンを使う。画像の権利は ©Konami Digital Entertainment に帰属する。利用条件については公開者の確認に基づく。画像が読めない場合は名前の頭文字を表示する。追加キャラは入手経路と版を確認してから `characters.mjs` に加える。

ゴンオウは人間の姿の「数百歳の少女」版を表示する。この版もゲーム内で確定加入できることを個別ページで確認した。https://playershi.com/gensuisp/character/character-11/310023002/

# MedSlime 網站

GitHub Pages 靜態網站（`https://jason900326.github.io/medslime-site/`）。沒有建置步驟，改檔案後 push 到 `main` 即可。

## 1. 用途

`go.html` 是 Threads / Instagram 貼文連結的落地頁。使用者點進來後：

- iPhone：嘗試開啟 MedSlime App，並可直接跳到指定主題；App 未安裝或沒有開啟時，顯示「複製連結 / 到 App Store」。
- Android：顯示「目前只支援 iOS」。
- 桌面：直接提供 App Store 連結。

## 2. 產生 Threads 連結

格式：

```
https://jason900326.github.io/medslime-site/go.html?t=<topic>&c=<campaign>
```

範例：

```
https://jason900326.github.io/medslime-site/go.html?t=gpc&c=threads-261025-gpc
```

`c` 規則：

- 只保留 `A–Z`、`a–z`、`0–9`、`_`、`-`，其他字元會被移除。
- 最多 30 個字元，超過會被截斷。
- 沒有 `c` 或過濾後為空，記為 `web`。

`t` 不認得時會回到首頁（開啟 App 首頁）。目前的主題：

| `t` | 頁面標題 | App 路徑（`appPath`） |
| --- | --- | --- |
| `default`（或不帶 `t`） | 弱點補起來，分數撿回來。 | `medslime://`（首頁） |
| `gpc` | GPC｜革蘭氏陽性球菌 | `medslime://node/gpc` |
| `enterobacterales` | Enterobacterales 腸桿菌目 | `medslime://node/mb05` |
| `mycobacterium` | Mycobacterium 分枝桿菌 | `medslime://node/mb12` |

## 3. 設定 App Store 追蹤（pt）

1. App Store Connect → 分析 (Analytics) → 獲取 (Acquisition) → 行銷活動 (Campaigns) → 產生行銷活動連結。
2. 複製連結中 `pt=` 後面的值。
3. 貼到 `go.js` 最上方的 `PT_TOKEN`：

   ```js
   var PT_TOKEN = '你的 pt 值';
   ```

在填入之前，連結可以正常使用，只是不會帶 `pt`，無法追蹤。

頁面會把 `c` 轉成 App Store 連結的 `ct` 參數，所以每則貼文不需要另外產生一組行銷活動連結，只要換 `c` 就能區分來源。

## 4. 新增主題

在 `go.js` 的 `TOPICS` 加一筆：

```js
'pharm': { title: '藥理學', blurb: '一句話說明。在 MedSlime 用歷屆題練習。', appPath: 'node/xxx' },
```

- `appPath` 是 Expo Router 路徑，不要加開頭的 `/`（例如 `node/gpc` 會開啟 `medslime://node/gpc`）。
- 只能用 App 裡實際存在的路由。節點頁是 `src/app/node/[id].tsx`，節點 id 來自 `src/lib/nodes.ts` 與 `src/lib/curriculum.ts`（`nodeId`）。
- `t` 的 key 必須是小寫。

## 5. 測試

- iPhone Safari：
  - 點上方「打開」會嘗試開啟 App；已安裝時直接開啟。
  - 未安裝或沒有開啟時，約 1.5 秒後顯示提示區塊。
  - Safari 另外可能在頁面頂部出現系統的 Smart App Banner。
- Threads 站內瀏覽器：把連結貼到私人草稿或傳給自己，點開測試。自訂 scheme 可能被擋，此時應看到提示區塊；「到 App Store」應可正常開啟。
- Android：應顯示「目前只支援 iOS」。
- 桌面瀏覽器：應顯示 App Store 連結與「iPhone 版」說明。
- 本機測試：

  ```bash
  python -m http.server 8000
  ```

  然後開啟 `http://localhost:8000/go.html?t=gpc&c=test`。

## 6. 已知限制

- Threads / Instagram 站內瀏覽器可能封鎖 `medslime://`，或顯示確認視窗。
- Safari 的 Smart App Banner 不會出現在站內瀏覽器。
- 沒有延遲深層連結（deferred deep link）：從 App Store 安裝後，App 會開在首頁，不會直接進入主題。
- App Store 行銷活動（`ct`）的資料在 App Store Connect 約 24–48 小時後才會出現，而且只有活動事件數達 5 次以上才會顯示（隱私門檻），也只計算同意分享分析資料的使用者。
- `medslime://node/...` 依賴 Expo Router 解析 URL 路徑，App 目前沒有自訂的連結處理。每次 App 發版後，請在實機上確認一次。

## 7. 發布

commit 並 push 到 `main`，GitHub Pages 約 1 分鐘後更新。

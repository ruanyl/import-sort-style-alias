# import-sort-style-alias

sort webpack resolve.alias separately first by the order defined in the array, then by member name

```
npm i import-sort-style-alias --save-dev
```

package.json
```
  "importSort": {
    ".js, .jsx, .es6, .es": {
      "parser": "babylon",
      "style": "alias",
      "custom": {
        "alias": ["components", "modules"]
      }
    },
    ".ts, .tsx": {
      "parser": "typescript",
      "style": "alias",
      "custom": {
        "alias": ["components", "modules"]
      }
    }
```

# 数据模型 v0.1

一切数据是 JSON。一个"幕(act)"一个文件，实体、关系、出处引用三类对象。

## 时间约定

- 史前用 `BP`（距1950年前），信史期用 `BCE`（公元前）。
- 一律区间：`{"from": 40000, "to": 39000, "unit": "BP", "approx": true}`。
- `approx: true` 表示学界只有量级共识；网页渲染时显示"约"。

## 空间约定

- `location`: 三种形态
  - `{"type":"point","lon":115.8,"lat":39.6}`（遗址精确点）
  - `{"type":"region","desc":"长江中下游至黄河中游","geojson_file":"..."}`（文化范围示意多边形，Phase 2 补）
  - `{"type":"route","desc":"东南亚沿海→华南","geojson_file":"..."}`（迁徙路线）

## 实体 Entity

```json
{
  "id": "site:tianyuan",
  "type": "population | site | culture | climate_event | myth_person | myth_event | tech | polity",
  "name": "田园洞人",
  "aliases": ["Tianyuan man"],
  "time": {"from": 42000, "to": 39000, "unit": "BP", "approx": true},
  "location": {"type": "point", "lon": 115.8, "lat": 39.6},
  "confidence": "A",
  "summary": "一段客观描述，不夹带假说",
  "claims": [
    {
      "claim": "假说内容（可以是激进的）",
      "confidence": "C",
      "source_ids": ["yang2020", "sciadv2025Y"],
      "note": "可选：假说的边界/反对意见"
    }
  ],
  "tags": ["古DNA", "北京"]
}
```

- 实体本体的 `confidence` 表示"这个实体存在与断代的可信度"；
  解释性内容一律放进 `claims` 数组，逐条标级——**事实与解释分离**。

## 关系 Relation

```json
{
  "from": "pop:n_lineage",
  "to": "pop:ne_asian_hg",
  "type": "derives_from",
  "confidence": "B",
  "source_ids": ["sciadv2025Y"],
  "note": "可选说明"
}
```

关系类型（开放枚举，新增需在本文档登记）：

| type | 含义 |
|---|---|
| `derives_from` | A 传承/分化自 B |
| `migrates_to` | A 迁徙至 B（B 为地点或人群） |
| `admixed_with` | A 与 B 发生基因混合 |
| `contemporary_with` | A 与 B 同时段并存 |
| `located_at` | A 位于/分布於 B |
| `corresponds_to` | 神话投影：A（神话人物/事件）对应 B（考古实体）——默认 D/E 级 |
| `driven_by` | A（人文事件）由 B（气候/环境/技术）驱动——本图谱的核心边 |
| `evidence_for` | A（数据/测年/序列）支撑 B（假说） |

## 出处 Source（data/sources.json）

```json
{
  "id": "yang2020",
  "kind": "paper | news | book | wiki | report",
  "title": "中国科学家揭开南北方人群迁徙与混合之历史（付巧妹团队）",
  "url": "https://www.ivpp.ac.cn/kxcb/kpdt/202005/t20200519_5583051.html",
  "year": 2020,
  "note": "9500BP 南北分家、8300BP 融合；福建古南方人群≈南岛语系祖先"
}
```

## ID 规范

`类型前缀:短名`，全库唯一。幕文件只存实体与关系，出处集中在 sources.json。

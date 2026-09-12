#!/usr/bin/env python3
"""shanggu-atlas web 编译器：data/acts/*.json + sources.json → web/data.js
- 地区/路线实体无经纬度 → 用 COORDS 回填表（按实体 id）
- claims/relations 引用的出处 id 解析为元数据
"""
import json, glob, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 地区实体的代表坐标（经度, 纬度）——示意定位，取文化区重心或代表遗址
COORDS = {
    "event:ooa_east_asia": (102, 30), "pop:south_route": (107, 25), "pop:north_route": (116, 43),
    "event:lgm": (102, 36), "event:north_south_split": (112, 33), "pop:ne_asian_hg": (131, 43),
    "pop:n_lineage": (121, 44), "pop:o_lineage": (111, 28),
    "climate_event:younger_dryas": (105, 32), "culture:shangshan": (119.9, 29.45),
    "culture:peiligang": (113.8, 34.4), "tech:rice_domestication": (119.5, 30.0),
    "tech:millet_domestication": (113, 36), "pop:rice_farmer_groups": (117, 29.5),
    "pop:millet_farmer_groups": (112.5, 35), "myth_person:shennong": (112.6, 28.1),
    "climate_event:8_2ka": (105, 33), "culture:xinglongwa": (120.1, 42.3),
    "culture:zhaobaogou": (119.2, 42.3), "culture:hongshan": (119.3, 41.5),
    "culture:houli": (118.1, 36.9), "culture:beixin": (117.6, 35.4),
    "culture:dawenkou": (117.5, 35.9), "culture:daxi": (112.1, 30.7),
    "culture:tangjiagang": (111.7, 29.3), "culture:majiabang": (120.6, 31.0),
    "culture:songze": (121.1, 31.2), "myth_person:taihao": (114.9, 33.9),
    "culture:yangshao_banpo": (109.2, 34.3), "culture:yangshao_miaodigou": (111.2, 34.8),
    "culture:majiayao": (104.0, 35.5), "culture:qujialing": (113.0, 30.8),
    "pop:yangshao_people": (112, 35), "pop:sino_tibetan": (104.5, 34),
    "tech:rice_north_expansion": (112.5, 32.5), "myth_person:yandi": (107.5, 34.5),
    "myth_person:huangdi": (113.7, 34.4), "myth_person:chiyou": (116, 36),
    "myth_event:yandi_huangdi_wars": (115.5, 39.8),
    "climate_event:4_2ka": (105, 33), "culture:liangzhu": (120.0, 30.4),
    "culture:shijiahe": (113.1, 30.7), "culture:wangwan3": (113.0, 34.4),
    "culture:shandong_longshan": (119.2, 35.6), "culture:qijia": (104.4, 35.9),
    "event:great_flood": (110, 33), "myth_person:yao": (111.5, 36.1),
    "myth_person:shun": (115.9, 34.5), "myth_person:yu": (113.1, 34.5),
    "myth_event:shanrang": (111.5, 35.9),
    "culture:xiaqiyuan": (114.3, 36.4), "culture:baodun": (103.9, 30.5),
    "tech:bronze_introduction": (103.5, 36.0), "myth_event:xia_shang_transition": (111.5, 35.3),
    "tech:oracle_script": (114.3, 36.1), "polity:late_shang": (114.3, 36.1),
    "climate_event:late_shang_deterioration": (110, 34), "culture:wucheng": (115.5, 28.1),
    "polity:early_zhou": (107.9, 34.3), "myth_person:di_xin": (114.2, 35.8),
    "myth_event:fengshen": (114, 35), "culture:yueshi": (118.5, 36.7),
}

ACTS_META = [
    {"act": 1, "title": "深古", "range": [50000, 12000], "desc": "南北两条线进入东亚"},
    {"act": 2, "title": "农业起源", "range": [13000, 7000], "desc": "稻粟驯化双线"},
    {"act": 3, "title": "文化爆发", "range": [8500, 5300], "desc": "玉、城、符号"},
    {"act": 4, "title": "仰韶扩张", "range": [7000, 4500], "desc": "第一次中国·炎黄投影"},
    {"act": 5, "title": "龙山万邦", "range": [5300, 3700], "desc": "4.2ka·洪水·尧舜禹"},
    {"act": 6, "title": "二里头早商", "range": [3900, 3300], "desc": "青铜王权"},
    {"act": 7, "title": "殷商牧野", "range": [3400, 3000], "desc": "信史之门"},
]


def main():
    srcs = {s["id"]: s for s in json.load(open(f"{ROOT}/data/sources.json"))["sources"]}
    entities, relations, stories = [], [], []
    for f in sorted(glob.glob(f"{ROOT}/data/acts/*.json")):
        d = json.load(open(f))
        for e in d["entities"]:
            e["_act"] = d["act"]
            loc = e.get("location", {})
            lonlat = None
            if loc.get("type") == "point":
                lonlat = (loc["lon"], loc["lat"])
            elif e["id"] in COORDS:
                lonlat = COORDS[e["id"]]
            e["_lonlat"] = lonlat
            # 出处解析
            for c in e.get("claims", []):
                c["_src"] = [srcs[i] for i in c.get("source_ids", []) if i in srcs]
            entities.append(e)
        for r in d["relations"]:
            r["_act"] = d["act"]
            r["_src"] = [srcs[i] for i in r.get("source_ids", []) if i in srcs]
            relations.append(r)
        for s in d.get("stories", []):
            s["_act"] = d["act"]
            stories.append(s)
    out = {
        "meta": {"name": "中国上古文明演化知识图谱", "version": "0.1.0",
                 "built": __import__("datetime").datetime.now().isoformat(timespec="seconds"),
                 "note": "底图为示意简化图；置信度 A实证/B主流/C竞争假说/D推测/E传说"},
        "acts": ACTS_META, "entities": entities, "relations": relations, "stories": stories,
        "sources": list(srcs.values()),
    }
    os.makedirs(f"{ROOT}/web", exist_ok=True)
    with open(f"{ROOT}/web/data.js", "w") as fp:
        fp.write("// 由 scripts/build_web.py 生成，勿手改\nconst ATLAS = ")
        json.dump(out, fp, ensure_ascii=False, separators=(",", ":"))
        fp.write(";\n")
    noloc = [e["id"] for e in entities if not e["_lonlat"]]
    print(f"实体 {len(entities)} 关系 {len(relations)} 故事 {len(stories)} 出处 {len(srcs)}")
    print("无坐标实体:", noloc if noloc else "无")


if __name__ == "__main__":
    main()

"""Generate Part 05's week table, Part 14 (day by day) and plan.json from plan_data.py.

Usage: python3 roadmap/source/build_plan.py
Writes roadmap/source/plan.json and fills the WEEKS and PART14 markers in roadmap.html.
"""
import datetime as dt
import html
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import plan_data as P  # noqa: E402

ROADMAP = os.path.join(HERE, "roadmap.html")
WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
START = dt.date.fromisoformat(P.START_SUGGESTED)
HOL = dict(P.HOLIDAYS)


def esc(s):
    return html.escape(s, quote=False)


def day_date(d):
    return START + dt.timedelta(days=d - 1)


def all_days():
    out = {}
    for w in P.WEEKS:
        for d, blocks in w["days"].items():
            out[d] = (w, blocks)
    assert sorted(out) == list(range(1, 91)), "plan must cover days 1-90 exactly"
    return out


def plan_json():
    days = {}
    for d, (w, b) in all_days().items():
        item = {"w": w["n"]}
        for k in ("c", "s", "l", "b", "r"):
            if k in b:
                item[k] = b[k]
        if "g" in b:
            item["g"] = b["g"]
        days[str(d)] = item
    weeks = [{k: w[k] for k in ("n", "title", "sales", "content", "proof")} | ({"noseat": w["noseat"]} if "noseat" in w else {})
             for w in P.WEEKS]
    return {"start": P.START_SUGGESTED, "weeks": weeks, "days": days,
            "gates": {str(k): list(v) for k, v in P.GATES.items()},
            "holidays": [list(h) for h in P.HOLIDAYS],
            "prestart": [list(x) for x in P.PRESTART]}


def weeks_table():
    rows = []
    for w in P.WEEKS:
        rows.append(f'      <tr><td>{w["n"]}</td><td><strong>{esc(w["title"])}.</strong> {esc(w["sales"])}</td>'
                    f'<td>{esc(w["content"])}</td><td>{esc(w["proof"])}</td></tr>')
    return ('  <table class="wk">\n    <thead><tr><th style="width:8%">Week</th><th style="width:40%"><span class="tag s">Sales track</span></th>'
            '<th style="width:29%"><span class="tag c">Content track</span></th><th>Proof by Sunday</th></tr></thead>\n    <tbody>\n'
            + "\n".join(rows) + "\n    </tbody>\n  </table>\n")


def part14():
    out = ['<section class="part">',
           '  <div class="kicker">Part 14</div>',
           '  <h1>Day by day: all 90 days</h1>',
           '  <p class="sub">Every block of every day. The same plan is in your tracker, where Today shows only today\'s tasks. '
           'Dates assume you start on Monday 9 November 2026; the tracker recalculates them for any start date.</p>',
           '  <div class="cols3">',
           '    <div class="box"><div class="t">Weekdays</div><p class="sm"><strong>10:30</strong> content (90 min) · <strong>12:15</strong> sales (90 min) · '
           '<strong>19:00</strong> live block: 3 hours of outreach until you have a seat, then your 4-hour shift.</p></div>',
           '    <div class="box"><div class="t">Weekends</div><p class="sm"><strong>Saturday</strong>: a 2-hour batch to finish the week\'s last short or long video. '
           '<strong>Sunday</strong>: a 45-minute review, then rest.</p></div>',
           '    <div class="box warn"><div class="t">Gates</div><p class="sm">Days 21, 35, 45, 60, 75 and 90 carry a decision. They are what make the deadline fixed: '
           'each one switches you to a more certain income source in time.</p></div>',
           '  </div>',
           '  <div class="box sales"><div class="t">Before day 1</div><ul class="check" style="margin:0">'
           + "".join(f"<li>{esc(t)}</li>" for _, t in P.PRESTART) + '</ul></div>']
    days = all_days()
    for w in P.WEEKS:
        dnums = sorted(w["days"])
        a, b = day_date(dnums[0]), day_date(dnums[-1])
        rng = f"{a.day} {a.strftime('%b')} – {b.day} {b.strftime('%b')}"
        live_hdr = "19:00 · live (3 h)" if w["n"] <= 5 else "19:00 · shift (4 h)"
        out.append('  <div class="wkblock">')
        out.append(f'    <div class="wkhead"><span class="wkn">Week {w["n"]}</span><span class="wkt">{esc(w["title"])}</span>'
                   f'<span class="wkd">Days {dnums[0]}–{dnums[-1]} · {rng}</span></div>')
        out.append(f'    <p class="wkproof"><strong>Proof by Sunday:</strong> {esc(w["proof"])}</p>')
        if "noseat" in w:
            ns = w["noseat"]
            out.append(f'    <p class="wknote"><strong>Not in a seat yet?</strong> Replace the sales block with: {esc(ns["sales"])} '
                       f'Replace the evening with: {esc(ns["live"])}</p>')
        out.append('    <table class="daytable">')
        out.append(f'      <thead><tr><th style="width:11%">Day</th><th style="width:30%">10:30 · content</th>'
                   f'<th style="width:30%">12:15 · sales</th><th>{live_hdr}</th></tr></thead>')
        out.append('      <tbody>')
        for d in dnums:
            _, blk = days[d]
            date = day_date(d)
            hol = HOL.get(date.strftime("%m-%d"))
            dcell = f'<strong>D{d}</strong><br>{WD[date.weekday()]} {date.day} {date.strftime("%b")}'
            if hol:
                dcell += f'<br><span class="hol">{esc(hol)}</span>'
            if "b" in blk:
                body = f'<td colspan="3"><span class="lbl">Batch · 2 h</span> {esc(blk["b"])}</td>'
            elif "r" in blk:
                body = f'<td colspan="3"><span class="lbl">Review · 45 min</span> {esc(blk["r"])}</td>'
            else:
                body = f'<td>{esc(blk["c"])}</td><td>{esc(blk["s"])}</td><td>{esc(blk["l"])}</td>'
            out.append(f'        <tr><td class="dcell">{dcell}</td>{body}</tr>')
            if "g" in blk:
                gt, gx = P.GATES[blk["g"]]
                out.append(f'        <tr class="gate"><td colspan="4"><strong>{esc(gt)}.</strong> {esc(gx)}</td></tr>')
        out.append('      </tbody>')
        out.append('    </table>')
        out.append('  </div>')
    out.append('</section>')
    return "\n".join(out) + "\n"


def fill(src, start, end, content):
    i = src.index(start) + len(start)
    j = src.index(end, i)
    return src[:i] + "\n" + content + src[j:]


def main():
    with open(os.path.join(HERE, "plan.json"), "w", encoding="utf-8") as f:
        json.dump(plan_json(), f, ensure_ascii=False, separators=(",", ":"))
    s = open(ROADMAP, encoding="utf-8").read()
    s = fill(s, "<!-- WEEKS:START -->", "<!-- WEEKS:END -->", weeks_table() + "  ")
    s = fill(s, "<!-- PART14:START -->", "<!-- PART14:END -->", part14())
    open(ROADMAP, "w", encoding="utf-8").write(s)
    print("plan.json + roadmap.html updated")


if __name__ == "__main__":
    main()

# ml-service/routes/price_routes.py
"""
Live fertilizer price scraper + smart budget optimizer.

Price sources (free, no API key):
  1. data.gov.in open API  — tried first, cached 6 hours
  2. Govt of India MRP     — instant fallback

Budget optimizer:
  Takes ML fertilizer recommendations + budget + priorities
  → returns full money allocation plan with per-category status
"""

from flask import Blueprint, request, jsonify
import urllib.request, urllib.parse, json, threading
from datetime import datetime, timedelta

price_bp = Blueprint("price", __name__)

# ── PRICE CACHE ───────────────────────────────────────────────────────────────
_cache      = {"data": None, "ts": None}
_lock       = threading.Lock()
_TTL_HOURS  = 6

# ── OFFICIAL GOVT MRP FALLBACK (Dept. of Fertilizers, India 2024) ─────────────
GOVT_MRP = {
    "Urea":      {"price_per_kg": 5.63,  "bag_50kg": 266.50, "source": "Govt MRP (subsidized)"},
    "DAP":       {"price_per_kg": 27.00, "bag_50kg": 1350.0, "source": "Govt MRP"},
    "14-35-14":  {"price_per_kg": 24.00, "bag_50kg": 1200.0, "source": "Govt MRP"},
    "28-28":     {"price_per_kg": 22.00, "bag_50kg": 1100.0, "source": "Govt MRP"},
    "17-17-17":  {"price_per_kg": 23.00, "bag_50kg": 1150.0, "source": "Govt MRP"},
    "20-20":     {"price_per_kg": 20.00, "bag_50kg": 1000.0, "source": "Govt MRP"},
    "10-26-26":  {"price_per_kg": 22.00, "bag_50kg": 1100.0, "source": "Govt MRP"},
}

# ── SEED PRICES (NSC / market rates) ──────────────────────────────────────────
SEED_PRICES = {
    "Maize":       {"price_per_kg": 80,  "kg_per_ha": 20,   "source": "NSC MRP"},
    "Sugarcane":   {"price_per_kg": 3,   "kg_per_ha": 8000, "source": "NSC MRP"},
    "Cotton":      {"price_per_kg": 700, "kg_per_ha": 2.5,  "source": "Market"},
    "Tobacco":     {"price_per_kg": 200, "kg_per_ha": 3,    "source": "Market"},
    "Paddy":       {"price_per_kg": 60,  "kg_per_ha": 25,   "source": "NSC MRP"},
    "Barley":      {"price_per_kg": 40,  "kg_per_ha": 100,  "source": "NSC MRP"},
    "Wheat":       {"price_per_kg": 45,  "kg_per_ha": 100,  "source": "NSC MRP"},
    "Millets":     {"price_per_kg": 50,  "kg_per_ha": 12,   "source": "NSC MRP"},
    "Oil seeds":   {"price_per_kg": 90,  "kg_per_ha": 15,   "source": "NSC MRP"},
    "Pulses":      {"price_per_kg": 120, "kg_per_ha": 20,   "source": "NSC MRP"},
    "Ground Nuts": {"price_per_kg": 90,  "kg_per_ha": 100,  "source": "NSC MRP"},
    # aliases from crop recommender
    "Rice":        {"price_per_kg": 60,  "kg_per_ha": 25,   "source": "NSC MRP"},
    "Soyabean":    {"price_per_kg": 70,  "kg_per_ha": 75,   "source": "NSC MRP"},
    "Groundnut":   {"price_per_kg": 90,  "kg_per_ha": 100,  "source": "NSC MRP"},
    "Default":     {"price_per_kg": 70,  "kg_per_ha": 30,   "source": "Estimated"},
}

# ── PER-CROP BENCHMARK COSTS (₹/ha) ──────────────────────────────────────────
_LABOR      = {"Sugarcane":12000,"Cotton":9000,"Paddy":8000,"Maize":4000,"Wheat":5000,"Barley":4500,"Default":5500}
_IRRIGATION = {"Sugarcane":6000,"Paddy":4000,"Cotton":3000,"Wheat":2000,"Maize":2000,"Default":2500}
_PESTICIDE  = {"Cotton":4000,"Paddy":2500,"Wheat":1500,"Maize":1500,"Default":1500}

# ── GOVT SCHEMES ──────────────────────────────────────────────────────────────
SCHEMES = [
    {"name":"PM-KISAN",            "benefit":"₹6,000/year direct to bank",          "url":"https://pmkisan.gov.in"},
    {"name":"Kisan Credit Card",   "benefit":"Up to ₹3 lakh @ 4% interest/year",    "url":"https://pmkisan.gov.in/kcc.aspx"},
    {"name":"PM Fasal Bima Yojana","benefit":"Crop insurance against losses",        "url":"https://pmfby.gov.in"},
    {"name":"Soil Health Card",    "benefit":"Free soil testing + recommendations",  "url":"https://soilhealth.dac.gov.in"},
    {"name":"eNAM Portal",         "benefit":"Best market prices for your produce",  "url":"https://enam.gov.in"},
]


def _try_live_scrape():
    """Try data.gov.in public API. Returns {} on any failure."""
    scraped = {}
    try:
        url = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24"
        qs  = urllib.parse.urlencode({
            "api-key": "579b464db66ec23bdd000001cdd3946e44ce4aab825286c0",
            "format":  "json", "limit": "100"
        })
        req = urllib.request.Request(f"{url}?{qs}", headers={"User-Agent":"AgriSmart/2.0"})
        with urllib.request.urlopen(req, timeout=5) as r:
            for rec in json.loads(r.read()).get("records", []):
                name  = rec.get("commodity","")
                price = rec.get("modal_price") or rec.get("min_price")
                if name and price:
                    scraped[name.lower()] = float(str(price).replace(",",""))
        print(f"✅ Live scrape: {len(scraped)} prices from data.gov.in")
    except Exception as e:
        print(f"⚠️  data.gov.in unavailable ({e}) — using Govt MRP")
    return scraped


def _get_prices():
    with _lock:
        if _cache["data"] and _cache["ts"] and \
           (datetime.now() - _cache["ts"]) < timedelta(hours=_TTL_HOURS):
            return _cache["data"], "cached"

    scraped = _try_live_scrape()
    result  = {}

    for name, info in GOVT_MRP.items():
        entry = {**info, "name": name, "live": False,
                 "updated": datetime.now().strftime("%Y-%m-%d")}
        # Try to overlay a live price
        for key, val in scraped.items():
            words = name.replace("-"," ").lower().split()
            if any(w in key for w in words[:2]):
                entry.update({
                    "price_per_kg": round(val/50, 2),
                    "bag_50kg":     val,
                    "source":       "Live — data.gov.in",
                    "live":         True,
                    "updated":      datetime.now().strftime("%Y-%m-%d %H:%M"),
                })
                break
        result[name] = entry

    with _lock:
        _cache["data"] = result
        _cache["ts"]   = datetime.now()

    return result, "fresh"


# ── ROUTES ────────────────────────────────────────────────────────────────────

@price_bp.route("/get-prices", methods=["GET"])
def get_prices():
    try:
        prices, status = _get_prices()
        return jsonify({
            "prices":       prices,
            "seed_prices":  SEED_PRICES,
            "cache_status": status,
            "fetched_at":   datetime.now().isoformat(),
        })
    except Exception as e:
        return jsonify({"error": str(e), "prices": GOVT_MRP}), 500


@price_bp.route("/budget-optimize", methods=["POST"])
def budget_optimize():
    """
    Smart budget allocation plan.

    Body (JSON):
        budget                    float   total budget ₹
        crop_name                 str
        area_ha                   float
        fertilizer_recommendations list   top3_fertilizers from /recommend-fertilizers
        priorities                list    ordered spending keys:
                                          ["seeds","fertilizers","labor","irrigation","pesticides"]
    """
    try:
        d          = request.json or {}
        budget     = float(d.get("budget",   10000))
        crop       = str(d.get("crop_name",  "Wheat")).strip().title()
        area_ha    = float(d.get("area_ha",  1.0))
        fert_recs  = d.get("fertilizer_recommendations", [])
        priorities = d.get("priorities", ["seeds","fertilizers","labor","irrigation","pesticides"])

        prices, _  = _get_prices()

        # ── SEED COST ─────────────────────────────────────────────────────────
        seed_info = SEED_PRICES.get(crop, SEED_PRICES["Default"])
        seed_qty  = seed_info["kg_per_ha"] * area_ha
        seed_cost = round(seed_qty * seed_info["price_per_kg"], 2)

        # ── FERTILIZER COST (top 3 from ML, live prices) ──────────────────────
        fert_items = []
        total_fert = 0
        for rec in fert_recs[:3]:
            fname   = rec.get("fertilizer","")
            dose_kg = rec.get("total_dose_kg", rec.get("dose_kg_per_ha", 100) * area_ha)
            ppkg    = prices.get(fname, {}).get("price_per_kg", rec.get("price_per_kg", 20))
            cost    = round(dose_kg * ppkg, 2)
            total_fert += cost
            fert_items.append({
                "name":         fname,
                "full_name":    rec.get("full_name", fname),
                "npk":          rec.get("npk",""),
                "confidence":   rec.get("confidence_pct", 0),
                "dose_kg":      round(dose_kg, 1),
                "price_per_kg": ppkg,
                "cost":         cost,
                "price_source": prices.get(fname, {}).get("source","Govt MRP"),
                "emoji":        rec.get("emoji","🌿"),
            })

        # ── OTHER COSTS ───────────────────────────────────────────────────────
        crop_key    = crop if crop in _LABOR else "Default"
        labor_cost  = _LABOR[crop_key]                             * area_ha
        irr_cost    = _IRRIGATION.get(crop_key, _IRRIGATION["Default"]) * area_ha
        pest_cost   = _PESTICIDE.get(crop_key,  _PESTICIDE["Default"])  * area_ha
        misc_cost   = round(budget * 0.05, 2)

        ideal = {
            "seeds":        round(seed_cost, 2),
            "fertilizers":  round(total_fert, 2),
            "labor":        round(labor_cost, 2),
            "irrigation":   round(irr_cost,   2),
            "pesticides":   round(pest_cost,  2),
            "miscellaneous":round(misc_cost,  2),
        }
        total_ideal = round(sum(ideal.values()), 2)

        # ── SMART ALLOCATION ──────────────────────────────────────────────────
        allocation = {}
        remaining  = budget

        for key in priorities:
            need = ideal.get(key, 0)
            if remaining >= need:
                allocation[key] = {
                    "allocated":  round(need, 2),
                    "ideal":      round(need, 2),
                    "status":     "full",
                    "pct_funded": 100,
                    "note":       "Fully covered ✓"
                }
                remaining -= need
            elif remaining > 0:
                pct = round((remaining / need) * 100, 1) if need else 0
                allocation[key] = {
                    "allocated":  round(remaining, 2),
                    "ideal":      round(need, 2),
                    "status":     "partial",
                    "pct_funded": pct,
                    "note":       f"{pct}% of ₹{need:,.0f} — consider Kisan Credit Card"
                }
                remaining = 0
            else:
                allocation[key] = {
                    "allocated":  0,
                    "ideal":      round(need, 2),
                    "status":     "unfunded",
                    "pct_funded": 0,
                    "note":       f"Needs ₹{need:,.0f} — apply for PM-KISAN / subsidy"
                }

        # Attach detail sub-items
        if "fertilizers" in allocation:
            allocation["fertilizers"]["items"] = fert_items
        if "seeds" in allocation:
            allocation["seeds"]["detail"] = {
                "qty_kg":       round(seed_qty, 1),
                "price_per_kg": seed_info["price_per_kg"],
                "source":       seed_info["source"],
            }

        surplus = round(max(0, budget - total_ideal), 2)
        pct     = round(min(budget, total_ideal) / total_ideal * 100, 1)
        status  = "comfortable" if budget >= total_ideal else ("tight" if pct >= 75 else "critical")

        if status == "comfortable":
            verdict = f"✅ Budget sufficient! Surplus: ₹{surplus:,.0f}"
        elif status == "tight":
            verdict = f"⚠️ Covers {pct}% of needs. Shortfall ₹{total_ideal-budget:,.0f}"
        else:
            verdict = f"🚨 Only {pct}% covered. Consider Kisan Credit Card for ₹{total_ideal-budget:,.0f}"

        return jsonify({
            "crop":         crop,
            "area_ha":      area_ha,
            "total_budget": budget,
            "total_ideal":  total_ideal,
            "surplus":      surplus,
            "pct_covered":  pct,
            "status":       status,
            "verdict":      verdict,
            "allocation":   allocation,
            "ideal_breakdown": ideal,
            "govt_schemes": SCHEMES,
            "price_source": "data.gov.in (live) / Dept. of Fertilizers MRP (fallback)",
            "generated_at": datetime.now().isoformat(),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

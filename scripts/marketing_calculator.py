#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Marketing Unit Economics & Break-even Calculator
Tailored for CasaArt Decor / Artiflora & Amazon Egypt (Flora_Home)
"""

import sys
import argparse

# Force UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def calculate_store_economics(cost: float, price: float) -> dict:
    profit = price - cost
    margin = (profit / price) * 100 if price > 0 else 0
    return {
        "channel": "المحل (أوفلاين - الوراق)",
        "price": price,
        "cost": cost,
        "fees": 0.0,
        "shipping": 0.0,
        "packaging": 2.0,
        "net_profit": round(profit - 2.0, 2),
        "margin_percent": round((profit - 2.0) / price * 100, 1) if price > 0 else 0,
        "is_safe": margin >= 25.0
    }


def calculate_social_cod_economics(cost: float, price: float, courier_fee: float = 45.0, packaging: float = 10.0, return_rate: float = 0.08) -> dict:
    return_buffer = (courier_fee * 1.5) * return_rate
    total_deductions = cost + packaging + return_buffer
    net_profit = price - total_deductions
    margin = (net_profit / price) * 100 if price > 0 else 0
    max_cpa = max(0.0, net_profit * 0.5)
    break_even_roas = round(price / net_profit, 2) if net_profit > 0 else 999.0

    return {
        "channel": "السوشيال ميديا (شحن يدوي COD)",
        "price": price,
        "cost": cost,
        "packaging": packaging,
        "return_buffer": round(return_buffer, 2),
        "net_profit": round(net_profit, 2),
        "margin_percent": round(margin, 1),
        "max_ad_cpa": round(max_cpa, 2),
        "break_even_roas": break_even_roas,
        "is_safe": margin >= 30.0
    }


def calculate_amazon_economics(cost: float, price: float, referral_rate: float = 0.13, easy_ship_deficit: float = 25.0, packaging: float = 12.0, return_rate: float = 0.05) -> dict:
    referral_fee = price * referral_rate
    vat_on_fees = (referral_fee + 51.0) * 0.14
    breakage_buffer = price * return_rate
    total_fees = referral_fee + easy_ship_deficit + packaging + vat_on_fees + breakage_buffer
    net_profit = price - cost - total_fees
    margin = (net_profit / price) * 100 if price > 0 else 0
    max_ppc_spend = max(0.0, net_profit * 0.4)
    target_acos = round((max_ppc_spend / price) * 100, 1) if price > 0 else 0.0

    return {
        "channel": "أمازون مصر (Flora_Home - Easy Ship)",
        "price": price,
        "cost": cost,
        "referral_fee": round(referral_fee, 2),
        "easy_ship_deficit": easy_ship_deficit,
        "vat_on_fees": round(vat_on_fees, 2),
        "packaging": packaging,
        "breakage_buffer": round(breakage_buffer, 2),
        "total_fees": round(total_fees, 2),
        "net_profit": round(net_profit, 2),
        "margin_percent": round(margin, 1),
        "max_ppc_cpa": round(max_ppc_spend, 2),
        "target_acos": target_acos,
        "is_safe": margin >= 30.0
    }


def calculate_amazon_fba_economics(cost: float, price: float, referral_rate: float = 0.13, fba_fee: float = 22.50, inbound_shipping: float = 2.50, storage_fee: float = 0.50, packaging: float = 8.00, return_rate: float = 0.02) -> dict:
    referral_fee = price * referral_rate
    vat_on_fees = (referral_fee + fba_fee) * 0.14
    breakage_buffer = price * return_rate
    total_fees = referral_fee + fba_fee + inbound_shipping + storage_fee + packaging + vat_on_fees + breakage_buffer
    net_profit = price - cost - total_fees
    margin = (net_profit / price) * 100 if price > 0 else 0
    max_ppc_spend = max(0.0, net_profit * 0.4)
    target_acos = round((max_ppc_spend / price) * 100, 1) if price > 0 else 0.0

    return {
        "channel": "أمازون مصر (Flora_Home - FBA شحن من قبل أمازون)",
        "price": price,
        "cost": cost,
        "referral_fee": round(referral_fee, 2),
        "fba_fee": fba_fee,
        "inbound_shipping": inbound_shipping,
        "storage_fee": storage_fee,
        "vat_on_fees": round(vat_on_fees, 2),
        "packaging": packaging,
        "breakage_buffer": round(breakage_buffer, 2),
        "total_fees": round(total_fees, 2),
        "net_profit": round(net_profit, 2),
        "margin_percent": round(margin, 1),
        "max_ppc_cpa": round(max_ppc_spend, 2),
        "target_acos": target_acos,
        "is_safe": margin >= 30.0
    }


def print_report(cost: float, store_price: float, amazon_price: float):
    print("=" * 65)
    print(" 📊 تقرير الجدوى الاقتصادية وهوامش الربح الصافية - Artiflora")
    print("=" * 65)
    print(f"🔹 تكلفة شراء المنتج بالجملة: {cost:.2f} ج.م")
    print(f"🔹 سعر البيع المقترح في المحل: {store_price:.2f} ج.م")
    print(f"🔹 سعر البيع المقترح على أمازون مصر: {amazon_price:.2f} ج.م")
    print("-" * 65)

    # 1. المحل
    store = calculate_store_economics(cost, store_price)
    print(f"\n[1] قناة: {store['channel']}")
    print(f"    - صافي الربح في القطعة: {store['net_profit']} ج.م")
    print(f"    - نسبة هامش الربح: {store['margin_percent']}%")
    status_store = "✅ ممتاز وآمن" if store['is_safe'] else "⚠️ هامش ضعيف"
    print(f"    - الحالة: {status_store}")

    # 2. السوشيال ميديا
    social = calculate_social_cod_economics(cost, store_price)
    print(f"\n[2] قناة: {social['channel']}")
    print(f"    - تكلفة التغليف الآمن: {social['packaging']} ج.م")
    print(f"    - احتياطي مخاطر المرتجعات: {social['return_buffer']} ج.م")
    print(f"    - صافي الربح بعد المخاطر: {social['net_profit']} ج.م")
    print(f"    - نسبة هامش الربح: {social['margin_percent']}%")
    print(f"    - أقصى تكلفة إعلان مسموحة لكل بيعة (Max CPA): {social['max_ad_cpa']} ج.م")
    print(f"    - أقل ROAS مطلوب على فيسبوك: {social['break_even_roas']}x")
    status_social = "✅ مجدي للإعلانات" if social['is_safe'] else "⚠️ غير مجدي للإعلانات الممولة"
    print(f"    - الحالة: {status_social}")

    # 3. أمازون مصر (Easy Ship)
    amz_easy = calculate_amazon_economics(cost, amazon_price)
    print(f"\n[3] قناة: {amz_easy['channel']}")
    print(f"    - عمولة أمازون (13%): {amz_easy['referral_fee']} ج.م")
    print(f"    - عجز شحن إيزي شيب: {amz_easy['easy_ship_deficit']} ج.م")
    print(f"    - ضريبة القيمة المضافة: {amz_easy['vat_on_fees']} ج.م")
    print(f"    - كرتونة وبابلز: {amz_easy['packaging']} ج.م")
    print(f"    - مخصص الكسر والمرتجع: {amz_easy['breakage_buffer']} ج.م")
    print(f"    - إجمالي الخصومات: {amz_easy['total_fees']} ج.م")
    print(f"    - صافي الربح في جيبك: {amz_easy['net_profit']} ج.م ({amz_easy['margin_percent']}%)")
    print(f"    - أقصى صرف إعلاني مسموح: {amz_easy['max_ppc_cpa']} ج.م (ACoS: {amz_easy['target_acos']}%)")

    # 4. أمازون مصر (FBA)
    amz_fba = calculate_amazon_fba_economics(cost, amazon_price)
    print(f"\n[4] قناة: {amz_fba['channel']}")
    print(f"    - عمولة أمازون (13%): {amz_fba['referral_fee']} ج.م")
    print(f"    - رسوم التجهيز والشحن (FBA Fee): {amz_fba['fba_fee']} ج.م")
    print(f"    - تكلفة شحن الدفعة للمستودع (لكل قطعة): {amz_fba['inbound_shipping']} ج.م")
    print(f"    - رسوم التخزين الشهري: {amz_fba['storage_fee']} ج.م")
    print(f"    - ضريبة القيمة المضافة الفعلية: {amz_fba['vat_on_fees']} ج.م")
    print(f"    - تغليف بابلز بدون كرتونة شحن: {amz_fba['packaging']} ج.م")
    print(f"    - مخصص كسر ومرتجع (أمازون تتحمل تلف الشحن): {amz_fba['breakage_buffer']} ج.م")
    print(f"    - إجمالي الخصومات: {amz_fba['total_fees']} ج.م")
    print(f"    - صافي الربح في جيبك: {amz_fba['net_profit']} ج.م ({amz_fba['margin_percent']}%)")
    print(f"    - أقصى صرف إعلاني مسموح: {amz_fba['max_ppc_cpa']} ج.م (ACoS: {amz_fba['target_acos']}%)")
    diff = amz_fba['net_profit'] - amz_easy['net_profit']
    print(f"    - 🌟 فارق الربح لصالح FBA: +{diff:.2f} ج.م إضافية في كل قطعة!")


def main():
    parser = argparse.ArgumentParser(description="حساب اقتصاديات الوحدة لمنتجات الديكور وأمازون مصر")
    parser.add_argument("--cost", type=float, help="سعر جملة المنتج (تكلفة الشراء)")
    parser.add_argument("--store-price", type=float, help="سعر البيع في المحل أو السوشيال ميديا")
    parser.add_argument("--amazon-price", type=float, help="سعر البيع على أمازون مصر")

    args = parser.parse_args()

    if args.cost is not None and args.store_price is not None:
        cost = args.cost
        store_price = args.store_price
        amazon_price = args.amazon_price if args.amazon_price is not None else round(store_price * 1.35, 2)
    else:
        print("\n🔹 مرحباً يا عبده - حاسبة اقتصاديات الوحدة للمحل وأمازون 🔹\n")
        try:
            cost = float(input("أدخل تكلفة شراء المنتج بالجملة (ج.م): "))
            store_price = float(input("أدخل سعر البيع في المحل (ج.م): "))
            amz_input = input(f"أدخل سعر البيع على أمازون مصر [افتراضي: {round(store_price * 1.35, 2)} ج.م]: ")
            amazon_price = float(amz_input) if amz_input.strip() else round(store_price * 1.35, 2)
        except ValueError:
            print("❌ إدخال غير صالح، يرجى كتابة أرقام صحيحة.")
            sys.exit(1)

    print_report(cost, store_price, amazon_price)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Canonical Unit Economics & Break-Even CPC Engine.
Single source of truth for Store, Social COD, Amazon Easy Ship, and Amazon FBA (Flora_Home).
"""

import sys
import argparse

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def estimate_fba_fee(weight_kg: float) -> float:
    """Returns Amazon Egypt FBA Pick & Pack base fee based on parcel weight."""
    if weight_kg <= 1.0:
        return 32.0
    return 32.0 + (weight_kg - 1.0) * 8.0


def estimate_easy_ship_fee(weight_kg: float) -> float:
    """Returns Amazon Egypt Easy Ship base fee based on parcel weight."""
    if weight_kg <= 1.0:
        return 36.0
    return 36.0 + (weight_kg - 1.0) * 10.0


def _compute_amazon_channel(
    channel_label: str,
    cost: float,
    price: float,
    referral_rate: float,
    fulfillment_fee: float,
    closing_fee: float,
    inbound_shipping: float,
    storage_fee: float,
    packaging: float,
    return_rate: float,
    coupon_egp: float,
    estimated_cvr: float,
    placement_modifier_pct: float,
    target_acos_ratio: float,
) -> dict:
    effective_price = max(0.0, price - coupon_egp)
    referral_fee = effective_price * referral_rate
    amazon_service_fees = referral_fee + fulfillment_fee + closing_fee
    vat_on_fees = amazon_service_fees * 0.14
    total_amazon_take = amazon_service_fees + vat_on_fees

    net_payout = effective_price - total_amazon_take
    landed_cogs = cost + packaging + inbound_shipping + storage_fee
    breakage_buffer = effective_price * return_rate
    net_profit = net_payout - landed_cogs - breakage_buffer
    margin_pct = (net_profit / effective_price) * 100.0 if effective_price > 0 else 0.0
    roi_pct = (net_profit / landed_cogs) * 100.0 if landed_cogs > 0 else 0.0

    max_ppc_spend = max(0.0, net_profit * target_acos_ratio)
    target_acos = (max_ppc_spend / effective_price) * 100.0 if effective_price > 0 else 0.0
    break_even_cpc = max(0.0, net_profit * estimated_cvr)
    placement_mult = 1.0 + (max(0.0, placement_modifier_pct) / 100.0)
    safe_max_base_bid = break_even_cpc / placement_mult

    # Minimum selling price to preserve 20% net margin on effective revenue
    fixed_overhead = landed_cogs + (fulfillment_fee + closing_fee) * 1.14
    denom = 1.0 - (referral_rate * 1.14) - return_rate - 0.20
    min_price_20pct = fixed_overhead / denom if denom > 0 else 0.0

    return {
        "channel": channel_label,
        "price": round(price, 2),
        "coupon_egp": round(coupon_egp, 2),
        "effective_price": round(effective_price, 2),
        "cost": round(cost, 2),
        "packaging": round(packaging, 2),
        "inbound_shipping": round(inbound_shipping, 2),
        "storage_fee": round(storage_fee, 2),
        "total_cogs": round(landed_cogs, 2),
        "referral_fee": round(referral_fee, 2),
        "referral_rate_pct": round(referral_rate * 100.0, 1),
        "fulfillment_fee": round(fulfillment_fee, 2),
        "fba_fee": round(fulfillment_fee, 2),
        "closing_fee": round(closing_fee, 2),
        "vat_on_fees": round(vat_on_fees, 2),
        "total_amazon_take": round(total_amazon_take, 2),
        "breakage_buffer": round(breakage_buffer, 2),
        "total_fees": round(total_amazon_take + packaging + inbound_shipping + storage_fee + breakage_buffer, 2),
        "net_payout": round(net_payout, 2),
        "net_profit": round(net_profit, 2),
        "margin_percent": round(margin_pct, 1),
        "roi_percent": round(roi_pct, 1),
        "max_ppc_cpa": round(max_ppc_spend, 2),
        "target_acos": round(target_acos, 1),
        "break_even_cpc": round(break_even_cpc, 2),
        "safe_max_base_bid": round(safe_max_base_bid, 2),
        "min_price_20pct_margin": round(min_price_20pct, 2),
        "is_safe": margin_pct >= 25.0,
    }


def calculate_store_economics(cost: float, price: float) -> dict:
    profit = price - cost
    net_profit = profit - 2.0
    margin = (net_profit / price) * 100 if price > 0 else 0
    return {
        "channel": "المحل (أوفلاين)",
        "price": price,
        "cost": cost,
        "fees": 0.0,
        "shipping": 0.0,
        "packaging": 2.0,
        "net_profit": round(net_profit, 2),
        "margin_percent": round(margin, 1),
        "is_safe": margin >= 25.0,
    }


def calculate_social_cod_economics(
    cost: float,
    price: float,
    courier_fee: float = 45.0,
    packaging: float = 10.0,
    return_rate: float = 0.08,
) -> dict:
    return_buffer = (courier_fee * 1.5) * return_rate
    total_deductions = cost + packaging + return_buffer
    net_profit = price - total_deductions
    margin = (net_profit / price) * 100 if price > 0 else 0
    max_cpa = max(0.0, net_profit * 0.5)
    break_even_roas = round(price / net_profit, 2) if net_profit > 0 else 999.0

    return {
        "channel": "السوشيال ميديا (شحن COD)",
        "price": price,
        "cost": cost,
        "packaging": packaging,
        "return_buffer": round(return_buffer, 2),
        "net_profit": round(net_profit, 2),
        "margin_percent": round(margin, 1),
        "max_ad_cpa": round(max_cpa, 2),
        "break_even_roas": break_even_roas,
        "is_safe": margin >= 30.0,
    }


def calculate_amazon_economics(
    cost: float,
    price: float,
    referral_rate: float = 0.13,
    easy_ship_fee: float = None,
    easy_ship_deficit: float = None,
    closing_fee: float = 5.0,
    packaging: float = 25.78,
    return_rate: float = 0.03,
    weight_kg: float = 0.75,
    coupon_egp: float = 0.0,
    estimated_cvr: float = 0.10,
    placement_modifier_pct: float = 150.0,
) -> dict:
    if easy_ship_fee is not None:
        fulfillment = easy_ship_fee
    elif easy_ship_deficit is not None:
        fulfillment = easy_ship_deficit
    else:
        fulfillment = estimate_easy_ship_fee(weight_kg)

    res = _compute_amazon_channel(
        channel_label="أمازون مصر (Flora_Home - Easy Ship)",
        cost=cost,
        price=price,
        referral_rate=referral_rate,
        fulfillment_fee=fulfillment,
        closing_fee=closing_fee,
        inbound_shipping=0.0,
        storage_fee=0.0,
        packaging=packaging,
        return_rate=return_rate,
        coupon_egp=coupon_egp,
        estimated_cvr=estimated_cvr,
        placement_modifier_pct=placement_modifier_pct,
        target_acos_ratio=0.40,
    )
    res["easy_ship_deficit"] = res["fulfillment_fee"]
    return res


def calculate_amazon_fba_economics(
    cost: float,
    price: float,
    referral_rate: float = 0.13,
    fba_fee: float = None,
    closing_fee: float = 5.0,
    inbound_shipping: float = 6.86,
    storage_fee: float = 0.0,
    packaging: float = 25.78,
    return_rate: float = 0.03,
    weight_kg: float = 0.75,
    coupon_egp: float = 0.0,
    estimated_cvr: float = 0.10,
    placement_modifier_pct: float = 150.0,
) -> dict:
    fulfillment = fba_fee if fba_fee is not None else estimate_fba_fee(weight_kg)
    return _compute_amazon_channel(
        channel_label="أمازون مصر (Flora_Home - FBA)",
        cost=cost,
        price=price,
        referral_rate=referral_rate,
        fulfillment_fee=fulfillment,
        closing_fee=closing_fee,
        inbound_shipping=inbound_shipping,
        storage_fee=storage_fee,
        packaging=packaging,
        return_rate=return_rate,
        coupon_egp=coupon_egp,
        estimated_cvr=estimated_cvr,
        placement_modifier_pct=placement_modifier_pct,
        target_acos_ratio=0.40,
    )


def print_report(cost: float, store_price: float, amazon_price: float):
    print("=" * 65)
    print(" Flora_Home Unit Economics Report (13% Egypt Home Decor)")
    print("=" * 65)
    amz_fba = calculate_amazon_fba_economics(cost, amazon_price)
    print(f"Selling Price: {amz_fba['price']} EGP | Payout: {amz_fba['net_payout']} EGP")
    print(f"Landed COGS:   {amz_fba['total_cogs']} EGP | Net Profit: {amz_fba['net_profit']} EGP ({amz_fba['margin_percent']}%)")
    print(f"Break-Even CPC (10% CVR): {amz_fba['break_even_cpc']} EGP | Safe Base Bid (@150% Top): {amz_fba['safe_max_base_bid']} EGP")


def main():
    parser = argparse.ArgumentParser(description="Flora_Home Unit Economics Calculator")
    parser.add_argument("--cost", type=float, required=True)
    parser.add_argument("--store-price", type=float, required=True)
    parser.add_argument("--amazon-price", type=float)
    args = parser.parse_args()
    amz_price = args.amazon_price if args.amazon_price is not None else round(args.store_price * 1.35, 2)
    print_report(args.cost, args.store_price, amz_price)


if __name__ == "__main__":
    main()

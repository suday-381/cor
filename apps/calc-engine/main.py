from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional

app = FastAPI(title="CorPlan Calculation Engine", version="1.0.0")

class MonthlyValues(BaseModel):
    jan: float = 0.0
    feb: float = 0.0
    mar: float = 0.0
    apr: float = 0.0
    may: float = 0.0
    jun: float = 0.0
    jul: float = 0.0
    aug: float = 0.0
    sep: float = 0.0
    oct: float = 0.0
    nov: float = 0.0
    dec: float = 0.0

class MacroAssumptions(BaseModel):
    inflationRate: float
    exchangeRateUsdIdr: float
    biInterestRate: float
    industryGrowthRate: float
    commodityPrices: Dict[str, float] = {}
    taxRate: float = 22.0

class RevenueItem(BaseModel):
    id: str
    productName: str
    segment: str
    channel: str
    monthlyTargets: MonthlyValues

class CostItem(BaseModel):
    id: str
    category: str
    departmentId: str
    monthlyAmounts: MonthlyValues

class PersonnelItem(BaseModel):
    id: str
    position: str
    totalAnnual: float

class CapExItem(BaseModel):
    id: str
    assetName: str
    totalCost: float
    usefulLife: int
    procurementMonth: str

class WorkingCapitalAssumptions(BaseModel):
    dso: float
    dio: float
    dpo: float

class CalculationPayload(BaseModel):
    macroAssumptions: Optional[MacroAssumptions] = None
    revenues: List[RevenueItem] = []
    costs: List[CostItem] = []
    personnel: List[PersonnelItem] = []
    capex: List[CapExItem] = []
    wcAssumptions: Optional[WorkingCapitalAssumptions] = None

def create_empty_mv() -> Dict[str, float]:
    return {m: 0.0 for m in ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]}

MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

@app.post("/calculate/all")
def calculate_all(payload: CalculationPayload):
    # Set default macro and working capital if not provided
    tax_rate = payload.macroAssumptions.taxRate if payload.macroAssumptions else 22.0
    wc = payload.wcAssumptions or WorkingCapitalAssumptions(dso=45, dio=30, dpo=35)

    # 1. P&L Calculations
    gross_revenue = create_empty_mv()
    for rev in payload.revenues:
        for m in MONTH_KEYS:
            gross_revenue[m] += getattr(rev.monthlyTargets, m)

    cogs = create_empty_mv()
    for cost in payload.costs:
        if cost.category == "variable" or cost.departmentId == "d-prod":
            for m in MONTH_KEYS:
                cogs[m] += getattr(cost.monthlyAmounts, m)
                
    # Fallback default COGS (52% of revenue) if no costs are present
    for m in MONTH_KEYS:
        if cogs[m] == 0:
            cogs[m] = round(gross_revenue[m] * 0.52)

    gross_profit = create_empty_mv()
    for m in MONTH_KEYS:
        gross_profit[m] = gross_revenue[m] - cogs[m]

    opex = create_empty_mv()
    for cost in payload.costs:
        if cost.category != "variable" and cost.departmentId != "d-prod":
            for m in MONTH_KEYS:
                opex[m] += getattr(cost.monthlyAmounts, m)
                
    for pers in payload.personnel:
        monthly_cost = round(pers.totalAnnual / 12.0)
        for m in MONTH_KEYS:
            opex[m] += monthly_cost

    ebitda = create_empty_mv()
    for m in MONTH_KEYS:
        ebitda[m] = gross_profit[m] - opex[m]

    depreciation = create_empty_mv()
    # Base historical depreciation
    for m in MONTH_KEYS:
        depreciation[m] = 380000000.0
        
    for cap in payload.capex:
        monthly_dep = round(cap.totalCost / (cap.usefulLife * 12.0))
        p_month = cap.procurementMonth.lower()
        if p_month in MONTH_KEYS:
            start_idx = MONTH_KEYS.index(p_month)
            for idx, m in enumerate(MONTH_KEYS):
                if idx >= start_idx:
                    depreciation[m] += monthly_dep

    ebit = create_empty_mv()
    for m in MONTH_KEYS:
        ebit[m] = ebitda[m] - depreciation[m]

    interest_expense = create_empty_mv()
    for m in MONTH_KEYS:
        interest_expense[m] = 125000000.0

    ebt = create_empty_mv()
    for m in MONTH_KEYS:
        ebt[m] = ebit[m] - interest_expense[m]

    tax_factor = tax_rate / 100.0
    income_tax = create_empty_mv()
    for m in MONTH_KEYS:
        income_tax[m] = round(max(0.0, ebt[m]) * tax_factor)

    net_income = create_empty_mv()
    for m in MONTH_KEYS:
        net_income[m] = ebt[m] - income_tax[m]

    pnl_summary = {
        "grossRevenue": gross_revenue,
        "cogs": cogs,
        "grossProfit": gross_profit,
        "operatingExpenses": opex,
        "ebitda": ebitda,
        "depreciation": depreciation,
        "ebit": ebit,
        "interestExpense": interest_expense,
        "ebt": ebt,
        "incomeTax": income_tax,
        "netIncome": net_income
    }

    # 2. Cash Flow Calculation (Indirect Method)
    receivables_change = create_empty_mv()
    inventory_change = create_empty_mv()
    payables_change = create_empty_mv()

    for idx, m in enumerate(MONTH_KEYS):
        prev_rev = gross_revenue[MONTH_KEYS[idx - 1]] if idx > 0 else gross_revenue["dec"]
        receivables_change[m] = round((prev_rev - gross_revenue[m]) * (wc.dso / 360.0))

        prev_cogs = cogs[MONTH_KEYS[idx - 1]] if idx > 0 else cogs["dec"]
        inventory_change[m] = round((prev_cogs - cogs[m]) * (wc.dio / 360.0))

        payables_change[m] = round((cogs[m] - prev_cogs) * (wc.dpo / 360.0))

    other_adjustments = create_empty_mv()
    for m in MONTH_KEYS:
        other_adjustments[m] = 50000000.0

    total_operating = create_empty_mv()
    for m in MONTH_KEYS:
        total_operating[m] = net_income[m] + depreciation[m] + receivables_change[m] + inventory_change[m] + payables_change[m] + other_adjustments[m]

    capex_flow = create_empty_mv()
    for cap in payload.capex:
        p_month = cap.procurementMonth.lower()
        if p_month in MONTH_KEYS:
            capex_flow[p_month] -= cap.totalCost

    asset_disposal = create_empty_mv()
    asset_disposal["mar"] = 50000000.0
    asset_disposal["aug"] = 100000000.0

    investments = create_empty_mv()
    total_investing = create_empty_mv()
    for m in MONTH_KEYS:
        total_investing[m] = capex_flow[m] + asset_disposal[m] + investments[m]

    loan_proceeds = create_empty_mv()
    loan_proceeds["jan"] = 5000000000.0
    loan_repayments = create_empty_mv()
    for m in MONTH_KEYS:
        loan_repayments[m] = -420000000.0
        
    equity_issuance = create_empty_mv()
    dividends_paid = create_empty_mv()
    dividends_paid["apr"] = -2000000000.0

    total_financing = create_empty_mv()
    for m in MONTH_KEYS:
        total_financing[m] = loan_proceeds[m] + loan_repayments[m] + equity_issuance[m] + dividends_paid[m]

    net_cash_flow = create_empty_mv()
    for m in MONTH_KEYS:
        net_cash_flow[m] = total_operating[m] + total_investing[m] + total_financing[m]

    opening_cash = create_empty_mv()
    closing_cash = create_empty_mv()
    current_cash = 15000000000.0

    for m in MONTH_KEYS:
        opening_cash[m] = current_cash
        current_cash += net_cash_flow[m]
        closing_cash[m] = current_cash

    cash_flow_projection = {
        "operatingActivities": {
            "netIncome": net_income,
            "depreciationAdj": depreciation,
            "receivablesChange": receivables_change,
            "inventoryChange": inventory_change,
            "payablesChange": payables_change,
            "otherAdjustments": other_adjustments,
            "totalOperating": total_operating
        },
        "investingActivities": {
            "capex": capex_flow,
            "assetDisposal": asset_disposal,
            "investments": investments,
            "totalInvesting": total_investing
        },
        "financingActivities": {
            "loanProceeds": loan_proceeds,
            "loanRepayments": loan_repayments,
            "equityIssuance": equity_issuance,
            "dividendsPaid": dividends_paid,
            "totalFinancing": total_financing
        },
        "netCashFlow": net_cash_flow,
        "openingCash": opening_cash,
        "closingCash": closing_cash,
        "wcAssumptions": {
            "dso": wc.dso,
            "dio": wc.dio,
            "dpo": wc.dpo
        }
    }

    # 3. Balance Sheet Projection
    accounts_receivable = create_empty_mv()
    inventory = create_empty_mv()
    prepaid_expenses = create_empty_mv()

    for m in MONTH_KEYS:
        accounts_receivable[m] = round(gross_revenue[m] * (wc.dso / 30.0))
        inventory[m] = round(cogs[m] * (wc.dio / 30.0))
        prepaid_expenses[m] = 250000000.0

    total_current_assets = create_empty_mv()
    for m in MONTH_KEYS:
        total_current_assets[m] = closing_cash[m] + accounts_receivable[m] + inventory[m] + prepaid_expenses[m]

    fixed_assets = create_empty_mv()
    accumulated_depreciation = create_empty_mv()
    net_fixed_assets = create_empty_mv()
    base_fa = 25000000000.0
    base_acc_dep = 5000000000.0

    for m in MONTH_KEYS:
        base_fa += abs(capex_flow[m])
        base_acc_dep += depreciation[m]
        fixed_assets[m] = base_fa
        accumulated_depreciation[m] = base_acc_dep
        net_fixed_assets[m] = base_fa - base_acc_dep

    long_term_investments = create_empty_mv()
    other_assets = create_empty_mv()
    for m in MONTH_KEYS:
        long_term_investments[m] = 3000000000.0
        other_assets[m] = 500000000.0

    total_non_current_assets = create_empty_mv()
    for m in MONTH_KEYS:
        total_non_current_assets[m] = net_fixed_assets[m] + long_term_investments[m] + other_assets[m]

    total_assets = create_empty_mv()
    for m in MONTH_KEYS:
        total_assets[m] = total_current_assets[m] + total_non_current_assets[m]

    # Liabilities
    accounts_payable = create_empty_mv()
    tax_payable = create_empty_mv()
    accrued_expenses = create_empty_mv()
    short_term_debt = create_empty_mv()

    for m in MONTH_KEYS:
        accounts_payable[m] = round(cogs[m] * (wc.dpo / 30.0))
        tax_payable[m] = round(income_tax[m] * 0.5)
        accrued_expenses[m] = 800000000.0
        short_term_debt[m] = 2000000000.0

    total_current_liabilities = create_empty_mv()
    for m in MONTH_KEYS:
        total_current_liabilities[m] = accounts_payable[m] + tax_payable[m] + accrued_expenses[m] + short_term_debt[m]

    long_term_debt = create_empty_mv()
    bonds = create_empty_mv()
    employee_benefits = create_empty_mv()
    base_lt_debt = 10000000000.0

    for m in MONTH_KEYS:
        base_lt_debt += loan_proceeds[m] + loan_repayments[m]
        long_term_debt[m] = base_lt_debt
        bonds[m] = 5000000000.0
        employee_benefits[m] = 1200000000.0

    total_long_term_liabilities = create_empty_mv()
    for m in MONTH_KEYS:
        total_long_term_liabilities[m] = long_term_debt[m] + bonds[m] + employee_benefits[m]

    total_liabilities = create_empty_mv()
    for m in MONTH_KEYS:
        total_liabilities[m] = total_current_liabilities[m] + total_long_term_liabilities[m]

    # Equity
    share_capital = create_empty_mv()
    retained_earnings = create_empty_mv()
    reserves = create_empty_mv()
    base_re = 8000000000.0

    for m in MONTH_KEYS:
        base_re += net_income[m] + dividends_paid[m]
        share_capital[m] = 10000000000.0
        retained_earnings[m] = base_re
        reserves[m] = 1500000000.0

    total_equity = create_empty_mv()
    for m in MONTH_KEYS:
        total_equity[m] = share_capital[m] + retained_earnings[m] + reserves[m]

    total_liabilities_and_equity = create_empty_mv()
    for m in MONTH_KEYS:
        total_liabilities_and_equity[m] = total_liabilities[m] + total_equity[m]

    discrepancy = create_empty_mv()
    for m in MONTH_KEYS:
        discrepancy[m] = total_assets[m] - total_liabilities_and_equity[m]

    # Ratios
    current_ratio = create_empty_mv()
    debt_to_equity = create_empty_mv()
    roe = create_empty_mv()
    roa = create_empty_mv()

    for m in MONTH_KEYS:
        current_ratio[m] = round(total_current_assets[m] / total_current_liabilities[m], 2) if total_current_liabilities[m] else 0.0
        debt_to_equity[m] = round(total_liabilities[m] / total_equity[m], 2) if total_equity[m] else 0.0
        roe[m] = round((net_income[m] * 12.0) / total_equity[m] * 100.0, 1) if total_equity[m] else 0.0
        roa[m] = round((net_income[m] * 12.0) / total_assets[m] * 100.0, 1) if total_assets[m] else 0.0

    balance_sheet = {
        "currentAssets": {
            "cashAndEquivalents": closing_cash,
            "accountsReceivable": accounts_receivable,
            "inventory": inventory,
            "prepaidExpenses": prepaid_expenses,
            "totalCurrentAssets": total_current_assets
        },
        "nonCurrentAssets": {
            "fixedAssets": fixed_assets,
            "accumulatedDepreciation": accumulated_depreciation,
            "netFixedAssets": net_fixed_assets,
            "longTermInvestments": long_term_investments,
            "otherAssets": other_assets,
            "totalNonCurrentAssets": total_non_current_assets
        },
        "totalAssets": total_assets,
        "currentLiabilities": {
            "accountsPayable": accounts_payable,
            "taxPayable": tax_payable,
            "accruedExpenses": accrued_expenses,
            "shortTermDebt": short_term_debt,
            "totalCurrentLiabilities": total_current_liabilities
        },
        "longTermLiabilities": {
            "longTermDebt": long_term_debt,
            "bonds": bonds,
            "employeeBenefits": employee_benefits,
            "totalLongTermLiabilities": total_long_term_liabilities
        },
        "totalLiabilities": total_liabilities,
        "equity": {
            "shareCapital": share_capital,
            "retainedEarnings": retained_earnings,
            "reserves": reserves,
            "totalEquity": total_equity
        },
        "totalLiabilitiesAndEquity": total_liabilities_and_equity,
        "isBalanced": all(abs(discrepancy[m]) < 1000.0 for m in MONTH_KEYS),
        "discrepancy": discrepancy,
        "financialRatios": {
            "currentRatio": current_ratio,
            "debtToEquity": debt_to_equity,
            "roe": roe,
            "roa": roa
        }
    }

    return {
        "pnl": pnl_summary,
        "cashflow": cash_flow_projection,
        "balancesheet": balance_sheet
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

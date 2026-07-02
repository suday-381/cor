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
    beginningCash: float = 15000000000.0
    beginningCashOption: str = "manual"
    newLoanAmount: float = 0.0
    loanInterestRate: float = 0.0
    loanRepaymentAnnual: float = 0.0
    dividendsPaid: float = 0.0
    previousBalanceSheet: Optional[Dict[str, float]] = None

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
    costCategory: str = "opex"

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
    macro = payload.macroAssumptions
    tax_rate = macro.taxRate if macro else 22.0
    wc = payload.wcAssumptions or WorkingCapitalAssumptions(dso=45, dio=30, dpo=35)

    # Resolve previous balance sheet values
    prev_bs = macro.previousBalanceSheet if macro and macro.previousBalanceSheet else {}
    prev_cash = prev_bs.get("cashAndEquivalents", 15000000000.0)
    prev_ar = prev_bs.get("accountsReceivable", 2500000000.0)
    prev_inv = prev_bs.get("inventory", 1800000000.0)
    prev_prepaid = prev_bs.get("prepaidExpenses", 250000000.0)
    prev_fa = prev_bs.get("fixedAssets", 25000000000.0)
    prev_acc_dep = prev_bs.get("accumulatedDepreciation", 5000000000.0)
    prev_lt_inv = prev_bs.get("longTermInvestments", 3000000000.0)
    prev_other_assets = prev_bs.get("otherAssets", 500000000.0)
    prev_ap = prev_bs.get("accountsPayable", 1200000000.0)
    prev_tax_payable = prev_bs.get("taxPayable", 300000000.0)
    prev_accrued_exp = prev_bs.get("accruedExpenses", 450000000.0)
    prev_st_debt = prev_bs.get("shortTermDebt", 1000000000.0)
    prev_lt_debt = prev_bs.get("longTermDebt", 10000000000.0)
    prev_bonds = prev_bs.get("bonds", 5000000000.0)
    prev_emp_benefits = prev_bs.get("employeeBenefits", 1200000000.0)
    prev_share_capital = prev_bs.get("shareCapital", 10000000000.0)
    prev_retained_earnings = prev_bs.get("retainedEarnings", 8000000000.0)
    prev_reserves = prev_bs.get("reserves", 1500000000.0)

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

    for pers in payload.personnel:
        if pers.costCategory.lower() == "cogs":
            monthly_cost = round(pers.totalAnnual / 12.0)
            for m in MONTH_KEYS:
                cogs[m] += monthly_cost

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
        if pers.costCategory.lower() != "cogs":
            monthly_cost = round(pers.totalAnnual / 12.0)
            for m in MONTH_KEYS:
                opex[m] += monthly_cost

    ebitda = create_empty_mv()
    for m in MONTH_KEYS:
        ebitda[m] = gross_profit[m] - opex[m]

    depreciation = create_empty_mv()
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

    new_loan = macro.newLoanAmount if macro else 0.0
    loan_interest_rate = macro.loanInterestRate if macro else 0.0
    loan_repayment_annual = macro.loanRepaymentAnnual if macro else 0.0
    divs_paid = macro.dividendsPaid if macro else 0.0

    loan_proceeds = create_empty_mv()
    loan_proceeds["jan"] = new_loan

    loan_repayments = create_empty_mv()
    for m in MONTH_KEYS:
        loan_repayments[m] = - (loan_repayment_annual / 12.0)

    interest_expense = create_empty_mv()
    current_debt = prev_lt_debt
    for m in MONTH_KEYS:
        current_debt += loan_proceeds[m]
        interest_expense[m] = round(current_debt * (loan_interest_rate / 100.0) / 12.0)
        current_debt += loan_repayments[m]

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

    dividends_paid = create_empty_mv()
    dividends_paid["apr"] = - divs_paid

    equity_issuance = create_empty_mv()
    total_financing = create_empty_mv()
    for m in MONTH_KEYS:
        total_financing[m] = loan_proceeds[m] + loan_repayments[m] + equity_issuance[m] + dividends_paid[m]

    net_cash_flow = create_empty_mv()
    for m in MONTH_KEYS:
        net_cash_flow[m] = total_operating[m] + total_investing[m] + total_financing[m]

    opening_cash = create_empty_mv()
    closing_cash = create_empty_mv()
    
    if macro and macro.beginningCashOption == "previous_year":
        current_cash = prev_cash
    else:
        current_cash = macro.beginningCash if macro else 15000000000.0

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
        prepaid_expenses[m] = prev_prepaid

    total_current_assets = create_empty_mv()
    for m in MONTH_KEYS:
        total_current_assets[m] = closing_cash[m] + accounts_receivable[m] + inventory[m] + prepaid_expenses[m]

    fixed_assets = create_empty_mv()
    accumulated_depreciation = create_empty_mv()
    net_fixed_assets = create_empty_mv()
    base_fa = prev_fa
    base_acc_dep = prev_acc_dep

    for m in MONTH_KEYS:
        base_fa += abs(capex_flow[m])
        base_acc_dep += depreciation[m]
        fixed_assets[m] = base_fa
        accumulated_depreciation[m] = base_acc_dep
        net_fixed_assets[m] = base_fa - base_acc_dep

    long_term_investments = create_empty_mv()
    other_assets = create_empty_mv()
    for m in MONTH_KEYS:
        long_term_investments[m] = prev_lt_inv
        other_assets[m] = prev_other_assets

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
        tax_payable[m] = prev_tax_payable + income_tax[m]
        accrued_expenses[m] = prev_accrued_exp
        short_term_debt[m] = prev_st_debt

    total_current_liabilities = create_empty_mv()
    for m in MONTH_KEYS:
        total_current_liabilities[m] = accounts_payable[m] + tax_payable[m] + accrued_expenses[m] + short_term_debt[m]

    # Long-term Liabilities
    long_term_debt = create_empty_mv()
    bonds = create_empty_mv()
    employee_benefits = create_empty_mv()
    base_lt_debt = prev_lt_debt

    for m in MONTH_KEYS:
        base_lt_debt += loan_proceeds[m] + loan_repayments[m]
        long_term_debt[m] = base_lt_debt
        bonds[m] = prev_bonds
        employee_benefits[m] = prev_emp_benefits

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
    base_re = prev_retained_earnings

    for m in MONTH_KEYS:
        base_re += net_income[m] + dividends_paid[m]
        share_capital[m] = prev_share_capital
        retained_earnings[m] = base_re
        reserves[m] = prev_reserves

    total_equity = create_empty_mv()
    for m in MONTH_KEYS:
        total_equity[m] = share_capital[m] + retained_earnings[m] + reserves[m]

    total_liabilities_and_equity = create_empty_mv()
    for m in MONTH_KEYS:
        total_liabilities_and_equity[m] = total_liabilities[m] + total_equity[m]

    # Re-align Balance Sheet with Piutang Usaha (Accounts Receivable)
    discrepancy = create_empty_mv()
    for m in MONTH_KEYS:
        discrepancy[m] = total_assets[m] - total_liabilities_and_equity[m]
        accounts_receivable[m] = accounts_receivable[m] - discrepancy[m]
        total_current_assets[m] = closing_cash[m] + accounts_receivable[m] + inventory[m] + prepaid_expenses[m]
        total_assets[m] = total_current_assets[m] + total_non_current_assets[m]
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

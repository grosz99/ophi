export const SAMPLES: Record<string, { label: string; code: string }> = {
  sales: {
    label: 'Sales Pipeline',
    code: `import pandas as pd

# Load the sales data
df = pd.read_csv("sales_data.csv")

# Filter to only high-value orders
df = df[df["Sales"] > 1000]

# Remove rows with missing regions
df = df.dropna(subset=["Region"])

# Calculate profit margin
df["Profit"] = df["Sales"] - df["Cost"]
df["Margin"] = df["Profit"] / df["Sales"]

# Sort by profit descending
df = df.sort_values("Profit", ascending=False)

# Aggregate by region
summary = df.groupby("Region").agg({
    "Sales": "sum",
    "Profit": "sum",
    "OrderID": "count"
}).reset_index()

# Rename count column
summary = summary.rename(columns={"OrderID": "Order_Count"})

# Export results
summary.to_csv("regional_summary.csv", index=False)`,
  },

  etl: {
    label: 'ETL Workflow',
    code: `import pandas as pd

# Extract: Load from multiple sources
customers = pd.read_csv("customers.csv")
orders = pd.read_excel("orders.xlsx")
products = pd.read_csv("products.csv")

# Transform: Clean customer data
customers["Name"] = customers["Name"].str.strip().str.title()
customers["Email"] = customers["Email"].str.lower()
customers = customers.drop_duplicates(subset=["Email"])

# Join orders with customers
merged = pd.merge(orders, customers, on="CustomerID", how="left")

# Join with products
merged = pd.merge(merged, products, on="ProductID", how="left")

# Filter out cancelled orders
merged = merged[merged["Status"] != "Cancelled"]

# Calculate order total
merged["Total"] = merged["Quantity"] * merged["UnitPrice"]

# Summarize by customer
customer_summary = merged.groupby("CustomerID").agg({
    "Total": "sum",
    "OrderID": "count",
    "Name": "first"
}).reset_index()

# Load: Export
customer_summary.to_csv("customer_totals.csv", index=False)`,
  },

  analysis: {
    label: 'Data Analysis',
    code: `import pandas as pd

df = pd.read_csv("survey_results.csv")

# Basic cleaning
df.columns = df.columns.str.strip().str.replace(" ", "_")
df = df.dropna()
df["Response_Date"] = pd.to_datetime(df["Response_Date"])
df["Year"] = df["Response_Date"].dt.year
df["Month"] = df["Response_Date"].dt.month

# Filter to 2025 only
df = df[df["Year"] == 2025]

# Recode satisfaction scores
df["Satisfaction_Group"] = pd.cut(
    df["Score"], bins=[0, 3, 7, 10],
    labels=["Low", "Medium", "High"]
)

# Sample for analysis
sample = df.sample(n=500, random_state=42)

# Pivot: count by month and satisfaction
pivot = sample.pivot_table(
    index="Month", columns="Satisfaction_Group",
    values="Score", aggfunc="count"
).fillna(0)

pivot.to_excel("satisfaction_by_month.xlsx")`,
  },

  chained: {
    label: 'Method Chaining',
    code: `import pandas as pd

result = (
    pd.read_csv("transactions.csv")
    .query("Amount > 0")
    .assign(
        Fee=lambda x: x["Amount"] * 0.029,
        Net=lambda x: x["Amount"] - x["Amount"] * 0.029
    )
    .drop(columns=["InternalID", "Debug_Flag"])
    .sort_values("Date")
    .groupby("Merchant")
    .agg({"Net": "sum", "Amount": "count"})
    .rename(columns={"Amount": "Txn_Count"})
    .reset_index()
    .sort_values("Net", ascending=False)
)

result.to_csv("merchant_summary.csv", index=False)`,
  },

  notebook: {
    label: 'Notebook Style',
    code: `# Cell 1: Setup
import pandas as pd
import numpy as np

# Cell 2: Load data
raw = pd.read_csv("ecommerce_events.csv")
print(f"Loaded {len(raw)} rows")

# Cell 3: Explore
raw.head()
raw.info()
raw.describe()

# Cell 4: Filter and clean
df = raw[raw["event_type"].isin(["purchase", "cart"])].copy()
df = df.dropna(subset=["user_id", "product_id"])
df["price"] = pd.to_numeric(df["price"], errors="coerce")
df = df[df["price"] > 0]

# Cell 5: Feature engineering
df["event_date"] = pd.to_datetime(df["event_time"]).dt.date
df["day_of_week"] = pd.to_datetime(df["event_time"]).dt.day_name()
df["hour"] = pd.to_datetime(df["event_time"]).dt.hour

# Cell 6: Aggregate
daily = df.groupby(["event_date", "event_type"]).agg(
    total_revenue=("price", "sum"),
    order_count=("user_id", "nunique"),
    avg_price=("price", "mean")
).reset_index()

# Cell 7: Pivot for comparison
comparison = daily.pivot_table(
    index="event_date", columns="event_type",
    values="total_revenue", aggfunc="sum"
).fillna(0)

# Cell 8: Export
daily.to_csv("daily_metrics.csv", index=False)
comparison.to_excel("purchase_vs_cart.xlsx")`,
  },
}

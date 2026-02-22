export const SAMPLES: Record<string, { label: string; code: string }> = {
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

  polars: {
    label: 'Polars Big Data Analysis',
    code: `import polars as pl

# Load the data
df = pl.read_csv("events.csv")

# Filter to high-value purchases
df = df.filter(pl.col("amount") > 500)

# Drop rows with null user IDs
df = df.drop_nulls(subset=["user_id"])

# Fill missing regions with "Unknown"
df = df.fill_null({"region": "Unknown"})

# Add calculated columns
df = df.with_columns(
    (pl.col("amount") * 0.08).alias("tax"),
    (pl.col("amount") * 1.08).alias("total"),
    pl.col("name").str.to_uppercase().alias("name_upper"),
    pl.col("event_date").str.to_date("%Y-%m-%d").alias("date"),
)

# Type conversion
df = df.with_columns(pl.col("zip_code").cast(pl.Utf8))

# Select only needed columns
df = df.select(["user_id", "region", "amount", "total", "date"])

# Sort by total descending
df = df.sort("total", descending=True)

# Remove duplicate users
df = df.unique(subset=["user_id"])

# Group by region
summary = df.group_by("region").agg(
    pl.col("total").sum().alias("revenue"),
    pl.col("user_id").count().alias("order_count"),
    pl.col("amount").mean().alias("avg_order"),
)

# Join with a lookup table
regions = pl.read_csv("region_lookup.csv")
summary = summary.join(regions, on="region", how="left")

# Unpivot for long format
long = summary.unpivot(
    index=["region"],
    on=["revenue", "order_count"],
)

# Combine with another dataset
other = pl.read_csv("other_metrics.csv")
combined = pl.concat([summary, other])

# Export
combined.write_csv("regional_report.csv")`,
  },

  etl: {
    label: 'ETL Pipeline',
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
}

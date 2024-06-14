# Question 1
In the context of compounded rate calculations (SARON, SOFR, ESTR, TONA),  
with a calculation of "full shift lookback" (lookback with observation shift).  
and an interest period including n rates (with several weights),  
is it correct that the observation period should also include just n rates, disregarding their weights?

# Answer 1

In the context of calculating compounded rates like SARON, SOFR, ESTR, or TONA using a "full shift lookback" methodology (lookback with observation shift), it is crucial to align the observation period with the interest period correctly. Let's break down the key concepts:

1. Interest Period: This is the period over which the interest is being calculated. For example, a 30-day period.

2. Observation Period: This is the period over which the daily rates are observed to calculate the compounded rate. The observation period is usually shifted back by a specified number of days (the lookback period) relative to the interest period.

3. Full Shift Lookback: In this method, the observation period starts a specific number of days before the interest period starts and ends the same number of days before the interest period ends. This shift is typically done to provide certainty of rates for a known period before the interest calculation is finalized.

## Key Points for Observation Period and Rate Inclusion:

- Alignment of Periods: The observation period should indeed be aligned with the interest period in terms of the number of days. For example, if the interest period is 30 days, the observation period should also cover 30 days, but shifted back by the lookback period.

- Number of Rates: The number of rates included in the calculation should correspond to the number of days in the observation period. Therefore, if the interest period includes 'n' days, the observation period should also include 'n' rates.

- Disregarding Weights: When considering the number of rates, weights assigned to specific days or rates (which could be based on conventions like calendar adjustments or business day conventions) should not affect the count of the rates. Each day in the observation period contributes one rate, regardless of how those rates are weighted or used in the final calculation.

## Practical Example:
- Interest Period: January 1 to January 30 (30 days)
- Lookback Period: 5 days

## Observation Period:
- Starts: December 27 (5 days before January 1)
- Ends: January 25 (5 days before January 30)

## Inclusion of Rates:
Each day from December 27 to January 25 contributes one rate.
The total number of rates used in the calculation is 30, matching the number of days in the interest period.

## Conclusion:

Yes, the observation period should include exactly 'n' rates if the interest period includes 'n' days, regardless of their weights. The weights applied to these rates are used in the calculation to derive the compounded rate but do not change the number of rates considered. This ensures that the calculation aligns with the intended interest period accurately.

# Question 2

Ok, based on your answer there seems to still exist a possible misunderstanding of my question.  
Let's look at some practical data:

Date	| Rate	| Weight
--- | --- | ---
2024-04-03	| 1.460285	| 1
2024-04-02	| 1.456716	| 1
2024-03-28	| 1.464207	| 5
2024-03-27	| 1.458166	| 1
2024-03-26	| 1.454520	| 1
2024-03-25	| 1.454148	| 1
2024-03-22	| 1.447580	| 3
2024-03-21	| 1.691800	| 1
2024-03-20	| 1.693594	| 1

So for a calculation of the compounded rate with "Full Shift Lookback":  
Interest period: 2024-03-27 - 2024-04-02  
Lookback days: 5  

Which rates would have to be considered in the calculation?

# Answer 2

Let's analyze the provided data to determine which rates would be included in the calculation of the compounded rate with a "Full Shift Lookback."

## Interest Period and Lookback
- Interest Period: 2024-03-27 to 2024-04-02 (7 days)
- Lookback Days: 5 days

## Determining the Observation Period
With a lookback of 5 days, the observation period starts 5 days before the interest period begins and ends 5 days before the interest period ends.

- Start of Observation Period: 2024-03-22 (2024-03-27 minus 5 days)
- End of Observation Period: 2024-03-28 (2024-04-02 minus 5 days)

## Extracting Relevant Rates from the Data
Here is the data filtered for the observation period:

Date	| Rate	| Weight
--- | --- | ---
2024-03-28	| 1.464207	| 5
2024-03-27	| 1.458166	| 1
2024-03-26	| 1.454520	| 1
2024-03-25	| 1.454148	| 1
2024-03-22	| 1.447580	| 3

## Explanation of Data Inclusion
- 2024-03-28 is the last day of the observation period.
- 2024-03-22 is the first day of the observation period.
- The weights indicate how many times each rate should be considered for compounding.

## Rates to Consider
The rates to consider for the compounded rate calculation, with the corresponding weights, are:

- 2024-03-28: 1.464207 (Weight: 5)
- 2024-03-27: 1.458166 (Weight: 1)
- 2024-03-26: 1.454520 (Weight: 1)
- 2024-03-25: 1.454148 (Weight: 1)
- 2024-03-22: 1.447580 (Weight: 3)

## Conclusion
The observation period for the interest period from 2024-03-27 to 2024-04-02 with a 5-day lookback should include the rates from 2024-03-22 to 2024-03-28.  
The calculation of the compounded rate will use these rates, weighted according to the given weights, but each rate will count as a single observation regardless of the weight.

# Question 3
In your lookback, you consider calendar days. In official documents for SARON, the practice is to consider bank workdays. Based on which documents is your conclusion done?

# Answer 3
Thank you for the clarification. You are correct that for financial benchmarks like SARON, the lookback period typically considers business days (bank workdays) rather than calendar days. My previous response did not account for this important detail.

Given this, let’s revise the calculation considering business days.

Revised Analysis Considering Business Days

Provided Data:

Date	| Rate	| Weight
--- | --- | ---
2024-04-03	| 1.460285	| 1
2024-04-02	| 1.456716	| 1
2024-03-28	| 1.464207	| 5
2024-03-27	| 1.458166	| 1
2024-03-26	| 1.454520	| 1
2024-03-25	| 1.454148	| 1
2024-03-22	| 1.447580	| 3
2024-03-21	| 1.691800	| 1
2024-03-20	| 1.693594	| 1

## Interest Period and Lookback
Interest Period: 2024-03-27 to 2024-04-02 (7 days)
Lookback Days: 5 business days
Determining the Observation Period
The observation period starts 5 business days before the interest period begins and ends 5 business days before the interest period ends.

## Calculating Business Days
Interest Period Start: 2024-03-27
Lookback Period: 5 business days before 2024-03-27
To find the start of the observation period, we count backward 5 business days from 2024-03-27. 

If weekends are non-business days:

- 2024-03-26 (1 day back)
- 2024-03-25 (2 days back)
- 2024-03-22 (3 days back)
- 2024-03-21 (4 days back)
- 2024-03-20 (5 days back)

Thus, the observation period starts on 2024-03-20 and ends 5 business days before 2024-04-02, which is:

- 2024-04-01 (1 day back)
- 2024-03-29 (2 days back, considering 2024-03-30 and 2024-03-31 as weekend days)
- 2024-03-28 (3 days back)
- 2024-03-27 (4 days back)
- 2024-03-26 (5 days back)

Extracting Relevant Rates from the Data
The relevant rates for the observation period are:

Date	| Rate	| Weight
--- | --- | ---
2024-03-26	| 1.454520	| 1
2024-03-25	| 1.454148	| 1
2024-03-22	| 1.447580	| 3
2024-03-21	| 1.691800	| 1
2024-03-20	| 1.693594	| 1

## Conclusion
The observation period for the interest period from 2024-03-27 to 2024-04-02 with a 5-business-day lookback should include the rates from 2024-03-20 to 2024-03-26. These rates, weighted as provided, are used for the calculation of the compounded rate.

This approach aligns with the common practice described in official documents for SARON and similar benchmarks, where business days are considered instead of calendar days for lookback periods.

# Question 4
What about the practices with:
SOFR, SONIA, ESTR and TONA
?

# Answer 4

Searched 6 sites

The practices for calculating compounded rates with a lookback period for different benchmarks (SOFR, SONIA, ESTR, TONA) typically involve using business days for the observation period. Here's an overview for each rate:

## SOFR (Secured Overnight Financing Rate)
For SOFR, the lookback period generally uses business days rather than calendar days. The standard practices involve two main types of lookback methodologies:

1. Lookback without Observation Shift: The rate used for any given day in the interest period is taken from a specified number of business days prior to that day. For example, if a 5-business day lookback is used, the rate for a given day would be the rate from 5 business days earlier.

2. Lookback with Observation Shift: Similar to the method without a shift, but the rate applies to the number of calendar days from the observation date until the next business day. This helps in aligning the accruals more accurately with the interest period​ (PCBB)​​ (New York Fed)​.

## SONIA (Sterling Overnight Index Average)
SONIA also follows a similar approach with lookbacks using business days. Typically, SONIA uses a lookback period of 5 business days. This method is consistent with the practices observed for other overnight rates, ensuring the rates applied are from a specific number of business days before the interest calculation​ (Read Kong)​.

## ESTR (Euro Short-Term Rate)
For ESTR, the lookback method is also applied using business days. This ensures that the compounding calculation is based on the rates observed a specific number of business days before the interest period. The European Central Bank provides guidelines to ensure consistency across the use of ESTR in various financial products​ (Read Kong)​.

## TONA (Tokyo Overnight Average Rate)
TONA follows similar conventions as SOFR and SONIA, with the lookback periods typically calculated using business days. This practice is consistent with ensuring that the rates used reflect the true economic activity over the relevant periods​ (Schroders global)​.

In summary, for SOFR, SONIA, ESTR, and TONA, the lookback periods are generally based on business days to ensure the rates used for compounding are appropriately aligned with the financial markets' operational days. This practice ensures the accuracy and reliability of interest calculations based on these rates.
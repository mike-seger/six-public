package com.net128.apps.saron.jdk11plus;

import com.net128.apps.saron.BigRational;

import java.io.*;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static java.time.temporal.ChronoUnit.DAYS;

public class CompoundRateCalculator {
	private final static MathContext mathContext = new MathContext(128, RoundingMode.HALF_UP);
	private final static BigDecimal commonFactor = new BigDecimal(36000, mathContext);
	private final static BigRational commonFactorR = new BigRational(36000);
	private final static int rateScale = 1000000;
	private static int debugLevel;
	public static void main(String[] args) throws IOException {
		new CompoundRateCalculator().compoundRates(args);
	}

	private static class CompoundRate {
		public CompoundRate(LocalDate startDate, LocalDate endDate, BigDecimal value, BigRational valueR) {
			this.startDate = startDate;
			this.endDate = endDate;
			this.value = value;
			this.valueR = valueR;
		}

		LocalDate startDate;
		LocalDate endDate;
		BigDecimal value;
		BigRational valueR;
		public String toString() {
			var r4Value = r4(value);
			var r6Value = r6(value);
			var r4ValueR = r4(valueR.bigDecimal());
			var r6ValueR = r6(valueR.bigDecimal());
			var rValue = rDebug(value);
			var error = false;
			if(!(r4Value+r6Value).equals(r4ValueR+r6ValueR)) {
				rValue = r(128, value).replaceAll("0*$", "");
				error = true;
			}
			return String.format("{\"startDate\": \"%s\", \"endDate\": \"%s\", \"valueD4\": \"%s\", \"valueD6\": \"%s\""+
				", \"valueD4R\": \"%s\", \"valueD6R\": \"%s\", \"value\": \"%s\", \"valueR\": \"%s\", \"error\": \"%s\"}",
				startDate, endDate, r4Value, r6Value, r4ValueR, r6ValueR, rValue, valueR, error);
		}
	}

	public static class Rate {
		public Rate(LocalDate date, BigDecimal value, BigDecimal weight) {
			this.date = date;
			this.value = value;
			this.weight = weight;
			this.weightR = new BigRational(weight.intValue());
			this.valueR = new BigRational(value.multiply(new BigDecimal(rateScale)).intValue(), rateScale);
		}

		LocalDate date;
		BigDecimal value;
		BigDecimal weight;

		BigRational weightR;
		BigRational valueR;

		public String toString() {
			return String.format("{\"date\": \"%s\", \"value\": \"%s\", \"valueR\": \"%s\", \"days\": \"%s\"}\n", date, rDebug(value), rDebug(valueR.bigDecimal()), weight);
		}
	}

	private List<CompoundRate> compoundRates(String[] args) throws IOException {
		var argList = new ArrayList<>(Arrays.asList(args));
		var optArgs = new ArrayList<String>();
		argList.forEach(arg -> {
			if(arg.startsWith("-")) {
				optArgs.add(arg);
				if(arg.startsWith("-debug=")) {
					debugLevel = Integer.parseInt(arg.substring("-debug=".length()));
				}
			}
		});
		argList.removeAll(optArgs);

		if (argList.size() != 3 && argList.size()!=4)
			throw new RuntimeException(getClass().getSimpleName() + " <rates-file> <startdate> <enddate>");
		var ratesFile = new File(argList.get(0));
		var startDate = LocalDate.parse(argList.get(1));
		var endDate = LocalDate.parse(argList.get(2));
		return compoundRates(ratesFile, startDate, endDate, argList.size()==4 && argList.get(3).equals("all"));
	}

	public List<CompoundRate> compoundRates(File ratesFile, LocalDate startDate, LocalDate endDate, boolean all) throws IOException {
		if(!ratesFile.exists()) throw new RuntimeException("ratesFile not found: "+ratesFile.getAbsolutePath());
		return compoundRates(getRateMap(ratesFile), startDate, endDate, all);
	}

	public List<CompoundRate> compoundRates(SortedMap<LocalDate, Rate> rateMap, LocalDate startDate, LocalDate endDate, boolean all) {
		if(debugLevel>2) System.out.println(rateMap.values());
		var compoundRates = new ArrayList<CompoundRate>();
		var sd = startDate;
		var rateDates = new ArrayList<>(rateMap.keySet());
		if(rateDates.size()==0) throw new RuntimeException("No rates found");
		if(startDate.isBefore(rateDates.get(0)))
			throw new RuntimeException("Startdate is before first rate date: "+rateDates.get(0));
		if(startDate.isAfter(rateDates.get(rateDates.size()-1)))
			throw new RuntimeException("Enddate is after last rate date: "+rateDates.get(rateDates.size()-1));

		if(all)
			while(sd.isBefore(endDate.plusDays(1))) {
				var ed = sd.plusDays(1);
				System.err.println("CR "+sd+"-"+ed+ " : "+endDate + " " + ChronoUnit.DAYS.between(startDate, sd) + " / " + compoundRates.size());
				while (ed.isBefore(endDate.plusDays(1))) {
					compoundRates.add(compoundRate(rateMap, sd, ed));
					ed = ed.plusDays(1);
				}
				sd = sd.plusDays(1);
//				if(ChronoUnit.DAYS.between(startDate, sd)>=2)
//					break;
			}
		else compoundRates.add(compoundRate(rateMap, startDate, endDate));
		return compoundRates;
	}

	public CompoundRate compoundRate(SortedMap<LocalDate, Rate> rateMap, LocalDate startDate, LocalDate endDate) {
		var date = startDate;
		var product = BigDecimal.ONE;
		var productR = BigRational.ONE;
		while(date.isBefore(endDate)) {
			var rate = rateMap.get(date);
			if(rate==null)
				System.currentTimeMillis();
			date = date.plusDays(rate.weight.longValue());
			var weight = rate.weight;
			var weightR = rate.weightR;
			if(weight.compareTo(BigDecimal.ONE)>0 && !date.isBefore(endDate)) {
				weight = new BigDecimal(DAYS.between(rate.date, endDate), mathContext);
				weightR = new BigRational(weight.intValue());
			}
			var factor = rate.value.multiply(weight).divide(commonFactor, mathContext).add(BigDecimal.ONE);
			var factorR = rate.valueR.times(weightR).divides(commonFactorR).plus(BigRational.ONE);
			debugFactor(weight, rate, factor, product, factorR, productR);
			product = product.multiply(factor);
			productR = productR.times(factorR);
		}

		var result = product.subtract(BigDecimal.ONE).multiply(commonFactor).divide(new BigDecimal(DAYS.between(startDate, endDate), mathContext), mathContext);
		var resultR = productR.minus(BigRational.ONE).times(commonFactorR).divides(new BigRational((int) DAYS.between(startDate, endDate)));
		debugResult(startDate, endDate, product, result, resultR);
		var compoundRate = new CompoundRate(startDate, endDate, result, resultR);
		System.out.println(compoundRate);
		return compoundRate;
	}

	private void debugFactor(BigDecimal weight, Rate rate, BigDecimal factor, BigDecimal product, BigRational factorR, BigRational productR) {
		if(debugLevel<2) return;
		System.out.printf("# factor = 1 + weight * rate.value / 36000.0 = 1 + %d * %s / 36000 = %s (factorR=%s, productR=%s)\n",
			weight.intValue(), r6(rate.value), rDebug(factor), factorR, rDebug(productR.times(factorR).bigDecimal()));
		System.out.printf("# product * factor = %s * %s = %s\n",
			r16(product), rDebug(factor), rDebug(product.multiply(factor)));
	}

	private void debugResult(LocalDate startDate, LocalDate endDate, BigDecimal product, BigDecimal result, BigRational resultR) {
		if(debugLevel<2) return;
		System.out.printf("# result = (product-1) * 36000.0 / DAYS.between(startDate, endDate) = (%f -1) * 36000.0 / %d = %f\n",
			product, DAYS.between(startDate, endDate), result.doubleValue());
	}

	private static String r16(BigDecimal value) { return r(16, value); }
	private static String r6(BigDecimal value) { return r(6, value); }
	private static String r4(BigDecimal value) { return r(4, value); }
	private static String rDebug(BigDecimal value) {
		int digits = 16;
		if(debugLevel==2) digits = 32;
		if(debugLevel>2) digits = 128;
		return r(digits, value);
	}
	private static String r(int digits, BigDecimal value) {
		return value.setScale(digits, RoundingMode.HALF_UP).toString();
	}

	private SortedMap<LocalDate, Rate> getRateMap(File ratesFile) throws IOException {
		TreeMap<LocalDate, Rate> rates = new TreeMap<>();
		try (BufferedReader br= new BufferedReader(new FileReader(ratesFile))) {
			String line;
			int lineNo=0;
			while((line  = br.readLine()) != null) {
				++lineNo;
				var tokens = line.trim().split("\t");
				if (tokens.length != 2) throw new RuntimeException(
						"Rates File contains invalid line ("+lineNo+"): \n" + line + "\nwith only " + tokens.length + " tokens instead of 2");
				if(!line.matches("[0-9-]*\t[0-9.-]*")) {
					System.err.println("Warning - Skipping line ("+lineNo+"): "+line);
					continue;
				}
				var date = parseDate(tokens[0]);
				rates.put(date, new Rate(date, new BigDecimal(tokens[1], mathContext),BigDecimal.ONE));
			}
		}
		return fillGaps(rates);
	}

	private SortedMap<LocalDate, Rate> fillGaps(SortedMap<LocalDate, Rate> rates) {
		if(rates.size()==0) return rates;
		var dates = new ArrayList<>(rates.keySet());
		var previousDay = dates.get(0);
		System.err.println("Initial Read "+rates.size());
		for(var d : dates) {
			var offset = BigDecimal.ONE;
			var previousRate = rates.get(previousDay);
			while(previousDay.plusDays(offset.intValue()).isBefore(d)) offset = offset.add(BigDecimal.ONE);
			previousRate.weight = offset;
			previousRate.weightR = new BigRational(offset.intValue());
			offset = BigDecimal.ONE;
			while(previousDay.plusDays(offset.intValue()).isBefore(d)) {
				var newDate = previousDay.plusDays(offset.intValue());
				rates.put(newDate, new Rate(newDate, previousRate.value, previousRate.weight.subtract(offset)));
				offset = offset.add(BigDecimal.ONE);
			}

			previousDay = d;
		}
		System.err.println("Filled Read "+rates.size());
		return rates;
	}

	private LocalDate parseDate(String dateString) {
		if(dateString.matches("[0-9]+-[0-9]+-[0-9]+")) return LocalDate.parse(dateString);
		return LocalDate.ofEpochDay(Long.parseLong(dateString)/(60*60*24)).plusDays(1);
	}
}
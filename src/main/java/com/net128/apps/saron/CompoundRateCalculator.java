package com.net128.apps.saron;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
	private final static BigRational commonFactorR = new BigRational(36000);
	private final static int rateScale = 1000000;
	private static int debugLevel;
	public static void main(String[] args) throws IOException {
		new CompoundRateCalculator().compoundRates(args);
	}

	@JsonInclude(JsonInclude.Include.NON_EMPTY)
	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class CompoundRate {
//		public CompoundRate(LocalDate startDate, LocalDate endDate, BigRational value) {
//			this.startDate = startDate;
//			this.endDate = endDate;
//			this.value = value;
//		}

		@JsonProperty("value")
		public String getValue() {
			return decimal4(value.bigDecimal());
		}

		LocalDate startDate;
		LocalDate endDate;
		BigRational value;
		public String toString() {
			return String.format("{\"startDate\": \"%s\", \"endDate\": \"%s\""+
				", \"valueD4R\": \"%s\", \"valueD6R\": \"%s\", \"valueR\": \"%s\"}",
				startDate, endDate, decimal4(value.bigDecimal()), decimal6(value.bigDecimal()), value);
		}
	}

	public static class Rate {
		public Rate(LocalDate date, BigDecimal value, BigDecimal weight) {
			this.date = date;
			this.weight = weight;
			this.weightR = new BigRational(weight.intValue());
			this.valueR = new BigRational(value.multiply(new BigDecimal(rateScale)).intValue(), rateScale);
		}
		public Rate(LocalDate date, BigRational valueR, BigDecimal weight) {
			this.date = date;
			this.weight = weight;
			this.weightR = new BigRational(weight.intValue());
			this.valueR = valueR;
		}

		LocalDate date;
		BigDecimal weight;

		BigRational weightR;
		BigRational valueR;

		public String toString() {
			return String.format("{\"date\": \"%s\", \"valueR\": \"%s\", \"days\": \"%s\"}\n", date, valueR.bigDecimal(), weight);
		}
	}

	private List<CompoundRate> compoundRates(String[] args) throws IOException {
		List<String> argList = new ArrayList<>(Arrays.asList(args));
		List<String> optArgs = new ArrayList<>();
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
		File ratesFile = new File(argList.get(0));
		LocalDate startDate = LocalDate.parse(argList.get(1));
		LocalDate endDate = LocalDate.parse(argList.get(2));
		return compoundRates(ratesFile, startDate, endDate, argList.size()==4 && argList.get(3).equals("all"));
	}

	public List<CompoundRate> compoundRates(File ratesFile, LocalDate startDate, LocalDate endDate, boolean all) throws IOException {
		List<CompoundRate> compoundRates = compoundRates(getRateMap(ratesFile), startDate, endDate, all);
		compoundRates.forEach(System.out::println);
		return compoundRates;
	}

	public List<CompoundRate> compoundRates(Reader ratesReader, LocalDate startDate, LocalDate endDate, boolean all) throws IOException {
		return compoundRates(getRateMap(ratesReader), startDate, endDate, all);
	}

	public List<CompoundRate> compoundRates(SortedMap<LocalDate, Rate> rateMap, LocalDate startDate, LocalDate endDate, boolean all) {
		if(debugLevel>2) System.out.println(rateMap.values());
		List<CompoundRate> compoundRates = new ArrayList<>();
		LocalDate sd = startDate;
		List<LocalDate> rateDates = new ArrayList<>(rateMap.keySet());
		if(rateDates.size()==0) throw new RuntimeException("No rates found");
		if(startDate.isBefore(rateDates.get(0)))
			throw new RuntimeException("Startdate is before first rate date: "+rateDates.get(0));
		if(startDate.isAfter(rateDates.get(rateDates.size()-1)))
			throw new RuntimeException("Enddate is after last rate date: "+rateDates.get(rateDates.size()-1));

		if(all)
			while(sd.isBefore(endDate.plusDays(1))) {
				LocalDate ed = sd.plusDays(1);
				System.err.println("CR "+sd+"-"+ed+ " : "+endDate + " " + ChronoUnit.DAYS.between(startDate, sd) + " / " + compoundRates.size());
				while (ed.isBefore(endDate.plusDays(1))) {
					compoundRates.add(compoundRate(rateMap, sd, ed));
					ed = ed.plusDays(1);
				}
				sd = sd.plusDays(1);
			}
		else compoundRates.add(compoundRate(rateMap, startDate, endDate));
		return compoundRates;
	}

	public CompoundRate compoundRate(SortedMap<LocalDate, Rate> rateMap, LocalDate startDate, LocalDate endDate) {
		LocalDate date = startDate;
		BigRational product = BigRational.ONE;
		while(date.isBefore(endDate)) {
			Rate rate = rateMap.get(date);
			date = date.plusDays(rate.weight.longValue());
			BigDecimal weight = rate.weight;
			BigRational weightR = rate.weightR;
			if(weight.compareTo(BigDecimal.ONE)>0 && !date.isBefore(endDate)) {
				weight = new BigDecimal(DAYS.between(rate.date, endDate), mathContext);
				weightR = new BigRational(weight.intValue());
			}
			BigRational factor = rate.valueR.times(weightR).divides(commonFactorR).plus(BigRational.ONE);
			product = product.times(factor);
		}

		BigRational result= product.minus(BigRational.ONE).times(commonFactorR).divides(new BigRational((int) DAYS.between(startDate, endDate)));
		return new CompoundRate(startDate, endDate, result);
	}

	private static String decimal6(BigDecimal value) { return decimalRound(6, value); }
	private static String decimal4(BigDecimal value) { return decimalRound(4, value); }
	private static String decimalRound(int digits, BigDecimal value) {
		return value.setScale(digits, RoundingMode.HALF_UP).toString();
	}

	private SortedMap<LocalDate, Rate> getRateMap(File ratesFile) throws IOException {
		return getRateMap(new FileReader(ratesFile));
	}

	private SortedMap<LocalDate, Rate> getRateMap(Reader reader) throws IOException {
		TreeMap<LocalDate, Rate> rates = new TreeMap<>();
		try (BufferedReader br= new BufferedReader(reader)) {
			String line;
			int lineNo=0;
			while((line  = br.readLine()) != null) {
				++lineNo;
				String [] tokens = line.trim().split("[\t,;]");
				if (tokens.length != 2) throw new RuntimeException(
					"Rates File contains invalid line ("+lineNo+"): \n" + line + "\nwith only " + tokens.length + " tokens instead of 2");
				if(!line.matches("[0-9-]*[\t,;][0-9.-]*")) {
					System.err.println("Warning - Skipping line ("+lineNo+"): "+line);
					continue;
				}
				LocalDate date = parseDate(tokens[0]);
				rates.put(date, new Rate(date, new BigDecimal(tokens[1], mathContext),BigDecimal.ONE));
			}
		}
		return fillGaps(rates);
	}

	private SortedMap<LocalDate, Rate> fillGaps(SortedMap<LocalDate, Rate> rates) {
		if(rates.size()==0) return rates;
		List<LocalDate> dates = new ArrayList<>(rates.keySet());
		LocalDate previousDay = dates.get(0);
		System.err.println("Initial Read "+rates.size());
		for(LocalDate d : dates) {
			BigDecimal offset = BigDecimal.ONE;
			Rate previousRate = rates.get(previousDay);
			while(previousDay.plusDays(offset.intValue()).isBefore(d)) offset = offset.add(BigDecimal.ONE);
			previousRate.weight = offset;
			previousRate.weightR = new BigRational(offset.intValue());
			offset = BigDecimal.ONE;
			while(previousDay.plusDays(offset.intValue()).isBefore(d)) {
				LocalDate newDate = previousDay.plusDays(offset.intValue());
				rates.put(newDate, new Rate(newDate, previousRate.valueR, previousRate.weight.subtract(offset)));
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
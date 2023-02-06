package com.net128.apps.saron;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

import static java.time.temporal.ChronoUnit.DAYS;

public class CompoundRateCalculator {
	private final static BigRational commonFactorR = new BigRational(36000);
	private static int debugLevel;
	public static void main(String[] args) throws IOException {
		new CompoundRateCalculator().compoundRates(args);
	}

	@JsonInclude(JsonInclude.Include.NON_EMPTY)
	@Data
	@NoArgsConstructor
	@AllArgsConstructor
	public static class CompoundRate {
		@JsonProperty("value")
		public String getValue() {
			return decimal4(value.bigDecimal());
		}

		LocalDate startDate;
		LocalDate endDate;
		BigRational value;
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
		boolean all = argList.contains("-all");
		boolean allStartDates = argList.contains("-allStartDates");
		argList.removeAll(optArgs);

		if (argList.size() != 3 && argList.size()!=4)
			throw new RuntimeException(getClass().getSimpleName() + " <rates-file> <startdate> <enddate>");
		File ratesFile = new File(argList.get(0));
		LocalDate startDate = LocalDate.parse(argList.get(1));
		LocalDate endDate = LocalDate.parse(argList.get(2));
		return compoundRates(ratesFile, startDate, endDate, all, allStartDates);
	}

	public List<CompoundRate> compoundRates(File ratesFile, LocalDate startDate, LocalDate endDate, boolean all, boolean allStartDates) throws IOException {
		List<CompoundRate> compoundRates = compoundRates(RatesLoader.getRateMap(ratesFile), startDate, endDate, all, allStartDates);
		compoundRates.forEach(System.out::println);
		return compoundRates;
	}

	public List<CompoundRate> compoundRates(Reader ratesReader, LocalDate startDate, LocalDate endDate, boolean all, boolean allStartDates) throws IOException {
		return compoundRates(RatesLoader.getRateMap(ratesReader), startDate, endDate, all, allStartDates);
	}

	public List<CompoundRate> compoundRates(SortedMap<LocalDate, RatesLoader.Rate> rateMap, LocalDate startDate, LocalDate endDate, boolean all, boolean allStartDates) {
		if(debugLevel>2) System.out.println(rateMap.values());
		List<CompoundRate> compoundRates = new ArrayList<>();
		LocalDate sd = startDate;
		List<LocalDate> rateDates = new ArrayList<>(rateMap.keySet());
		if(rateDates.size()==0) throw new RuntimeException("No rates found");
		if(startDate.isBefore(rateDates.get(0)))
			throw new RuntimeException("Startdate is before first rate date: "+rateDates.get(0));
		if(endDate.minusDays(10).isAfter(rateDates.get(rateDates.size()-1)))
			throw new RuntimeException("Enddate is after last rate date: "+rateDates.get(rateDates.size()-1));

		if(all)
			while(sd.isBefore(endDate.plusDays(1))) {
				LocalDate ed = sd.plusDays(1);
				System.err.println("CR "+sd+"-"+ed+ " : "+endDate + " " + ChronoUnit.DAYS.between(startDate, sd) + " / " + compoundRates.size());
				while (ed.isBefore(endDate.plusDays(1))) {
					compoundRates.add(compoundRate(rateMap, sd, ed));
					ed = ed.plusDays(1);
				}
				if(!allStartDates) break;
				sd = sd.plusDays(1);
			}
		else compoundRates.add(compoundRate(rateMap, startDate, endDate));
		return compoundRates;
	}

	public CompoundRate compoundRate(SortedMap<LocalDate, RatesLoader.Rate> rateMap, LocalDate startDate, LocalDate endDate) {
		LocalDate date = startDate;
		BigRational product = BigRational.ONE;
		while(date.isBefore(endDate)) {
			RatesLoader.Rate rate = rateMap.get(date);
			int weight = rate.weight;
			date = date.plusDays(rate.weight);
			if(weight>1 && !date.isBefore(endDate)) {
				weight = (int)DAYS.between(rate.date, endDate);
			}
			BigRational factor = rate.value.times(new BigRational(weight)).divides(commonFactorR).plus(BigRational.ONE);
			product = product.times(factor);
		}

		BigRational result= product.minus(BigRational.ONE).times(commonFactorR).divides(new BigRational((int) DAYS.between(startDate, endDate)));
		return new CompoundRate(startDate, endDate, result);
	}

	private static String decimal4(BigDecimal value) { return decimalRound(4, value); }
	private static String decimalRound(int digits, BigDecimal value) {
		return value.setScale(digits, RoundingMode.HALF_UP).toString();
	}
}
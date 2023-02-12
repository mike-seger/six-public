package com.net128.apps.saron;

import java.io.IOException;
import java.io.Reader;
import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.LongStream;

import static java.time.temporal.ChronoUnit.DAYS;

public class CompoundRateCalculator {
	private final static int commonFactor = 36000;
	private final static BigDecimal bigDecimal10000 = new BigDecimal(10000);
	private final static BigDecimal commonFactorBd = new BigDecimal(36000);
	private final static BigRational commonFactorR = new BigRational(commonFactor);

	public List<CompoundRate> compoundRates(Reader ratesReader, LocalDate startDate, LocalDate endDate, boolean all, boolean allStartDates, boolean rational) throws IOException {
		return compoundRates(RatesLoader.getRateMap(ratesReader), startDate, endDate, all, allStartDates, rational);
	}

	public List<CompoundRate> compoundRates(SortedMap<LocalDate, Rate> rateMap, LocalDate startDate, LocalDate endDate, boolean all, boolean allStartDates, boolean rational) {
		List<CompoundRate> compoundRates = Collections.synchronizedList(new ArrayList<>());
		List<LocalDate> rateDates = new ArrayList<>(rateMap.keySet());
		if(rateDates.size()==0) throw new RuntimeException("No rates found");
		if(startDate.isBefore(rateDates.get(0)))
			throw new RuntimeException("Startdate is before first rate date: "+rateDates.get(0));
		if(endDate.minusDays(10).isAfter(rateDates.get(rateDates.size()-1)))
			throw new RuntimeException("Enddate is after last rate date: "+rateDates.get(rateDates.size()-1));

		if(all)
			LongStream.range(0, DAYS.between(startDate, endDate)).forEach(sdOffset -> {
				LocalDate sd = startDate.plusDays(sdOffset);
				LocalDate ed = sd.plusDays(1);
				System.err.println("CR "+sd+"-"+ed+ " : "+endDate + " " + ChronoUnit.DAYS.between(startDate, sd) + " / " + compoundRates.size());
				if(allStartDates)
					LongStream.range(0, DAYS.between(ed, endDate.plusDays(1))).parallel().forEach(edOffset ->
						compoundRates.add(compoundRate(rateMap, sd, ed.plusDays(edOffset), rational))
					);
				else compoundRates.add(compoundRate(rateMap, sd, endDate, rational));
			});
		else compoundRates.add(compoundRate(rateMap, startDate, endDate, rational));
		compoundRates.sort(Comparator.naturalOrder());
		return compoundRates;
	}

	public CompoundRate compoundRate(SortedMap<LocalDate, Rate> rateMap, LocalDate startDate, LocalDate endDate, boolean rational) {
		if(rational) return compoundRateR(rateMap, startDate, endDate);
		return compoundRateBd(rateMap, startDate, endDate);
	}

	public CompoundRate compoundRateR(SortedMap<LocalDate, Rate> rateMap, LocalDate startDate, LocalDate endDate) {
		LocalDate date = startDate;
		BigRational product = BigRational.ONE;
		while(date.isBefore(endDate)) {
			Rate rate = rateMap.get(date);
			if(rate==null) throw new IllegalStateException("Missing rate for: "+date);
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

	public CompoundRate compoundRateBd(SortedMap<LocalDate, Rate> rateMap, LocalDate startDate, LocalDate endDate) {
		LocalDate date = startDate;
		BigDecimal product = BigDecimal.ONE;
		while(date.isBefore(endDate)) {
			Rate rate = rateMap.get(date);
			if(rate==null) throw new IllegalStateException("Missing rate for: "+date);
			int weight = rate.weight;
			date = date.plusDays(rate.weight);
			if(weight>1 && !date.isBefore(endDate)) {
				weight = (int)DAYS.between(rate.date, endDate);
			}
			BigDecimal factor = new BigDecimal(rate.doubleValue).multiply(new BigDecimal(weight)).divide(commonFactorBd, MathContext.DECIMAL64).add(BigDecimal.ONE);
			product = product.multiply(factor);
		}

		BigDecimal result= (product.subtract(BigDecimal.ONE)).multiply(commonFactorBd).multiply(bigDecimal10000).divide(new BigDecimal(DAYS.between(startDate, endDate)), MathContext.DECIMAL64);
		result = result.setScale(10, RoundingMode.HALF_UP).setScale(0, RoundingMode.HALF_UP);
		return new CompoundRate(startDate, endDate, new BigRational(result.intValue(), bigDecimal10000.intValue()));
	}
}
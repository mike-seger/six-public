package com.net128.apps.saron;

import java.io.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;

import static java.time.temporal.ChronoUnit.DAYS;

public class RatesLoader {
	private final static int rateDenominator = 1000000;

	public static SortedMap<LocalDate, Rate> getRateMap(File ratesFile) throws IOException {
		return getRateMap(new FileReader(ratesFile));
	}

	public static SortedMap<LocalDate, Rate> getRateMap(Reader reader) throws IOException {
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
				rates.put(date, new Rate(date, new BigRational(
					new BigDecimal(tokens[1])
							.multiply(new BigDecimal(rateDenominator)).intValue(),
					rateDenominator), 1));
			}
		}
		return fillGaps(rates);
	}

	private static SortedMap<LocalDate, Rate> fillGaps(SortedMap<LocalDate, Rate> rates) {
		if(rates.size()==0) return rates;
		List<LocalDate> dates = new ArrayList<>(rates.keySet());
		LocalDate previousDay = dates.get(0);
		System.err.println("Initial Read "+rates.size());
		for(LocalDate d : dates) {
			int offset = 1;
			Rate previousRate = rates.get(previousDay);
			if(previousDay.plusDays(offset).isBefore(d))
				offset = (int)DAYS.between(previousDay, d);
			previousRate.weight = offset;
			offset =1;
			while(previousDay.plusDays(offset).isBefore(d)) {
				LocalDate newDate = previousDay.plusDays(offset);
				rates.put(newDate, new Rate(newDate, previousRate.value, previousRate.weight - offset));
				offset++;
			}

			previousDay = d;
		}
		System.err.println("Filled Read "+rates.size());
		return rates;
	}

	private static LocalDate parseDate(String dateString) {
		if(dateString.matches("[0-9]+-[0-9]+-[0-9]+")) return LocalDate.parse(dateString);
		return LocalDate.ofEpochDay(Long.parseLong(dateString)/(60*60*24)).plusDays(1);
	}
}

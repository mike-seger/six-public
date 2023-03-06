package com.net128.apps.saron;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.io.Reader;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.attribute.FileTime;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.*;

public class CompoundRateCalculatorCliApp {
	private final CompoundRateCalculator compoundRateCalculator = new CompoundRateCalculator();

	public static void main(String[] args) throws IOException, NoSuchAlgorithmException {
		List<CompoundRate> result = new CompoundRateCalculatorCliApp().compoundRates(args);
		ObjectMapper om = new ObjectMapper();
		om.registerModule(new JavaTimeModule());
		om.configure(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false);
		om.writeValue(System.out, result);
	}

	private List<CompoundRate> compoundRates(String[] args) throws IOException, NoSuchAlgorithmException {
		List<String> argList = new ArrayList<>(Arrays.asList(args));
		List<String> optArgs = new ArrayList<>();
		argList.forEach(arg -> {
			if(arg.startsWith("-") && !"-".equals(arg)) optArgs.add(arg);
		});
		boolean all = argList.contains("-all");
		boolean allStartDates = argList.contains("-allStartDates");
		boolean rational = argList.contains("-rational");
		argList.removeAll(optArgs);

		if (argList.size() < 3 || argList.size() > 5) {
			System.err.println(getClass().getSimpleName() + " [-all] [-allStartDates] [-rational] <rates-file> <startdate> <enddate>");
			System.exit(1);
		}
		LocalDate startDate = LocalDate.parse(argList.get(1));
		LocalDate endDate = LocalDate.parse(argList.get(2));
		String ratesUrl = argList.get(0);
		if(ratesUrl.equals("-")) ratesUrl = "https://www.six-group.com/exchanges/downloads/indexdata/hsrron.csv";
		if(ratesUrl.contains("://")) {
			return compoundRateCalculator.compoundRates(urlReader(ratesUrl), startDate, endDate, all, allStartDates, rational);
		} else {
			File ratesFile = new File(argList.get(0));
			return compoundRates(ratesFile, startDate, endDate, all, allStartDates, rational);
		}
	}

	private static Reader urlReader(String url) throws IOException, NoSuchAlgorithmException {
		MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
		messageDigest.update(url.getBytes());
		String stringHash = new String(Base64.getEncoder().encode(messageDigest.digest())).replace("/", "_").replace("=", "_");
		File cachedDataFile = new File(System.getProperty("java.io.tmpdir"), CompoundRateCalculatorCliApp.class.getSimpleName()+"-"+stringHash+"-rates.txt");
		if(cachedDataFile.exists()) {
			FileTime creationTime = (FileTime) Files.getAttribute(cachedDataFile.toPath(), "creationTime");
			if(creationTime.toInstant().compareTo(Instant.from(LocalDate.now().atStartOfDay(ZoneOffset.UTC)))<0) {
				cacheUrl(url, cachedDataFile);
			}
		} else cacheUrl(url, cachedDataFile);
		return new FileReader(cachedDataFile);
	}

	private static void cacheUrl(String url, File file) throws IOException {
		String data = new Scanner(new URL(url).openStream(), "UTF-8").useDelimiter("\\A").next();
		if(data.startsWith("ISIN;CH0049613687;")) {
			String csv = data.replaceAll("(?m)^ISIN;CH0049613687;.*$", "")
					.replaceAll("(?m)^SYMBOL;SARON;;.*$", "")
					.replaceAll("(?m)^NAME;Swiss.*$", "")
					.trim();
			if (!csv.startsWith("Date;Close;"))
				throw new RuntimeException("Expected Date;Close;... in SIX SARON CSV\n"+csv);

			csv = csv.replace("Date;Close;", "Date;SaronRate;")
				.replaceAll("(?m); *", ",")
				.replaceAll("(?m)^([^,]*),([^,]*),.*", "$1,$2")
				.replaceAll("(?m)^(..)[.](..)[.]([12]...)", "$3-$2-$1");
			Files.write(Paths.get(file.toURI()), csv.getBytes(StandardCharsets.UTF_8));
		} else
			Files.write(Paths.get(file.toURI()), data.getBytes(StandardCharsets.UTF_8));
	}

	public List<CompoundRate> compoundRates(File ratesFile, LocalDate startDate, LocalDate endDate, boolean all, boolean allStartDates, boolean rational) throws IOException {
		List<CompoundRate> compoundRates = compoundRateCalculator.compoundRates(RatesLoader.getRateMap(ratesFile), startDate, endDate, all, allStartDates, rational );
		compoundRates.forEach(System.out::println);
		return compoundRates;
	}
}
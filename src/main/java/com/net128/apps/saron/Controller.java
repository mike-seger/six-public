package com.net128.apps.saron;

import com.fasterxml.jackson.databind.RuntimeJsonMappingException;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springdoc.api.annotations.ParameterObject;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletResponse;
import javax.validation.ValidationException;
import java.io.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@SuppressWarnings("unused")
@Slf4j
@RestController
@RequestMapping("/api/v1")
@ComponentScan(basePackageClasses = Controller.class)
public class Controller {
	private final static String uploadFailedMsg = "Failed to process: ";
	private final CompoundRateCalculator compoundRateCalculator = new CompoundRateCalculator();

	@PostMapping
	public List<CompoundRateCalculator.CompoundRate> calculateCompoundSaron(@RequestBody CompoundRateCalculatorParameters parameters) {
		parameters.rates=parameters.rates.replace("\\n", "\n");
		try (Reader reader = new StringReader(parameters.rates)) {
			return compoundRateCalculator.compoundRates(reader, parameters.startDate, parameters.endDate, parameters.all, Boolean.TRUE.equals(parameters.allStartDates));
		} catch(Exception e) {
			throw new RuntimeException("Failed to calculate rates for\n: "+parameters.rates, e);
		}
	}

	@Data
	public static class CompoundRateCalculatorParameters {
		@Schema( allowableValues = {"true", "false"}, description = "true: calculate all compound rates, false: calculate a single compound rate")
		Boolean all;
		@Schema( allowableValues = {"false", "true"}, description = "true: calculate with single start date, false: calculate with all start dates in range", defaultValue = "false")
		Boolean allStartDates;
		@Schema(description = "The first rate date relevant for the compound rate calculation", example = "2022-01-07")
		@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
		LocalDate startDate;
		@Schema(description = "The last rate date relevant for the compound rate calculation", example = "2022-01-08")
		@DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
		LocalDate endDate;
		@Schema(description = "The rates in CSV or TSV format", format = "text", example = "2022-01-07,0.5589\\n2022-01-08,0.9895")
		String rates;
	}

	private ResponseEntity<String> failedResponseEntity(String entity, Throwable t) {
		String message = uploadFailedMsg+entity;
		HttpStatus status = HttpStatus.BAD_REQUEST;
		if(t instanceof ValidationException || t instanceof RuntimeJsonMappingException) {
			message += "\n" + t.getMessage();
		} else {
			status = HttpStatus.INTERNAL_SERVER_ERROR;
			log.error(message, t);
		}
		return ResponseEntity.status(status).body(message);
	}

	private void writeError(HttpServletResponse response, OutputStream os, int status, String message) throws IOException {
		response.setStatus(status);
		response.setContentType(MediaType.TEXT_PLAIN_VALUE);
		OutputStreamWriter osw = new OutputStreamWriter(os);
		osw.write(message);
		osw.flush();
	}

	private String timestampNow() { return isoTimeStampNow()
		.replaceAll("\\..*", "").replaceAll("[^0-9]", ""); }
	private String isoTimeStampNow() { return isoTimeStamp(Instant.now());}
	private String isoTimeStamp(Instant ts) { return ts.toString(); }

	private final static String APPLICATION_ZIP = "application/zip";
	private final static String TEXT_TSV = "text/tab-separated-values";
	private final static String TEXT_CSV = "text/csv";
}

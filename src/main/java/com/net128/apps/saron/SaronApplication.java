package com.net128.apps.saron;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.awt.*;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.NoSuchAlgorithmException;

@SpringBootApplication
public class SaronApplication {
	public static void main(String[] args) throws IOException, NoSuchAlgorithmException {
		if(args.length > 0 || "true".equals(System.getProperty("cli"))) runCalculation(args);
		else SpringApplication.run(SaronApplication.class, args);
	}

	private static void runCalculation(String[] args) throws IOException, NoSuchAlgorithmException {
		CompoundRateCalculatorCliApp.main(args);
	}

	@EventListener({ApplicationReadyEvent.class})
	void applicationReadyEvent() {
		System.out.println("Application started ... launching browser now");
		browse("http://localhost:8080");
	}

	public static void browse(String url) {
		if(Desktop.isDesktopSupported()){
			Desktop desktop = Desktop.getDesktop();
			try {
				desktop.browse(new URI(url));
			} catch (IOException | URISyntaxException e) {
				e.printStackTrace();
			}
		} else{
			Runtime runtime = Runtime.getRuntime();
			String[] command;

			String operatingSystemName = System.getProperty("os.name").toLowerCase();
			if (operatingSystemName.contains("nix") || operatingSystemName.contains("nux")) {
				String[] browsers = {"opera", "google-chrome", "epiphany", "firefox", "mozilla", "konqueror", "netscape", "links", "lynx"};
				StringBuilder stringBuilder = new StringBuilder();

				for (int i = 0; i < browsers.length; i++) {
					if (i == 0) stringBuilder.append(String.format("%s \"%s\"", browsers[i], url));
					else stringBuilder.append(String.format(" || %s \"%s\"", browsers[i], url));
				}
				command = new String[]{"sh", "-c", stringBuilder.toString()};
			} else if (operatingSystemName.contains("win")) {
				command = new String[]{"rundll32 url.dll,FileProtocolHandler " + url};

			} else if (operatingSystemName.contains("mac")) {
				command = new String[]{"open " + url};
			} else {
				System.out.println("an unknown operating system!!");
				return;
			}

			try {
				if (command.length > 1) runtime.exec(command); // linux
				else runtime.exec(command[0]); // windows or mac
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	}
}

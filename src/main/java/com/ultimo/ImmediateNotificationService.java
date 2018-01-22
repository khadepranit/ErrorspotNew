package com.ultimo;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Map;
import org.json.JSONObject;
import org.restheart.handlers.PipedHttpHandler;
import org.restheart.handlers.RequestContext;
import org.restheart.handlers.RequestContext.METHOD;
import org.restheart.handlers.applicationlogic.ApplicationLogicHandler;
import org.restheart.security.handlers.IAuthToken;
import org.restheart.utils.HttpStatus;
import org.restheart.utils.ResponseHelper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.mongodb.DBObject;
import com.mongodb.util.JSON;

import io.undertow.server.HttpServerExchange;

public class ImmediateNotificationService extends ApplicationLogicHandler implements IAuthToken{
	private static final Logger LOGGER = LoggerFactory.getLogger("com.ultimo");
	
	public ImmediateNotificationService(PipedHttpHandler next, Map<String, Object> args) {
		super(next, args);
		// TODO Auto-generated constructor stub
	}

	@Override
	public void handleRequest(HttpServerExchange exchange, RequestContext context) throws Exception {
		// TODO Auto-generated method stub
		System.out.println("from ImmediateNotificationService handler");
		 if (context.getMethod() == METHOD.POST) {
	           
			//@Amit reads bytes from input stream
				InputStream input = exchange.getInputStream();
				
				/*@Amit Reads text from a character-input stream, buffering characters so as to provide for 
				the efficient reading of characters, arrays, and lines.*/
				BufferedReader inputReader = new BufferedReader(new InputStreamReader(input));
				
				String auditPayload="";
				String line;
				while((line=inputReader.readLine()) != null) {
					//System.out.println(line);
					auditPayload = auditPayload + line +  "\r\n";
				}
				System.out.println("Printing json");
				System.out.println(auditPayload);
				auditPayload = auditPayload.replace("\r\n", "");
				
	            
	            DBObject tempDBObject = (DBObject) JSON.parse(auditPayload);
	            sendNotification(tempDBObject);
        } else {
        	LOGGER.error("invalid http option");
        	ResponseHelper.endExchangeWithMessage(exchange, HttpStatus.SC_METHOD_NOT_ALLOWED, "Method Not Allowed");
			exchange.endExchange();
        }
	}
	
	public void sendNotification(DBObject inputObject) {
		 
	     /*=======Immediate Notification for audits=======*/
	     //Fetch setting document
	     String auditContent = "";
	     
	     String auditSeverity = "";
	     String auditName = "";
	     String auditInterface = "";
	     String auditEnvid = "";
		 
	     //Obtain fields to be compared from audit if they exist
		 if (inputObject.containsField("envid")) {
	    	 auditEnvid = inputObject.get("envid").toString();
	    	 LOGGER.debug("Audit envid: " + auditEnvid + ", to be compared for Immediate Notification");
	     }
		 
	     if (inputObject.containsField("severity")) {
	    	 auditSeverity = inputObject.get("severity").toString();
	    	 LOGGER.debug("Audit severity: " + auditSeverity + ", to be compared for Immediate Notification");
	     }
	     
	     if (inputObject.containsField("application")) {
	    	 auditName = inputObject.get("application").toString(); 
	    	 LOGGER.debug("Audit application name: " + auditName + ", to be compared for Immediate Notification");
	     }
	     
	     if (inputObject.containsField("interface1")) {
	    	 auditInterface = inputObject.get("interface1").toString(); 
	    	 LOGGER.debug("Audit interface: " + auditInterface + ", to be compared for Immediate Notification");
	     }
	     
	     if (ErrorSpotSinglton.isInitialized()) {
	    	 JSONObject config = null;
	    	 config = ErrorSpotSinglton.getExpiredNotificationDetail(auditEnvid, auditName, auditInterface, auditSeverity);
	     
	    	 if (config != null)
	    	 {
	    		 String toEmailId = config.getString("email");			     
	    		 String template = config.getString("template");
	     
	    		 //Call NotificationService
	    		 auditContent = inputObject.toString();
	    		 String subject = "Audit Notification: Conditions: Application = " + auditName + ", Interface = " + auditInterface + ", Severity = " + auditSeverity;
	    		 LOGGER.debug("NotificationService called with template: " + template + ", email: " + toEmailId + ", subject: " + subject);
	    		 NotificationService.sendEmail(auditContent, template, toEmailId, subject);
	    		 LOGGER.debug("Notification sent to " + toEmailId); 
	    	 }
	    	 else
	    	 {
	    		 LOGGER.debug("No notification sent.");
	    	 } 
	
	     }
	}

}

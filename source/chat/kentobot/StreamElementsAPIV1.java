/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package chat.kentobot;

/**
 *
 * @author Jason
 */
public class StreamElementsAPIV1 {
    
    private static StreamElementsAPIV1 instance;
    private String apiKey = "";
    
    private enum REQUEST_TYPE = {
        GET,
        POST,
        PUT,
        DELETE
    };
    
    public static synchronized StreamElementsAPIV1 instance() {
        if (instance == null) {
            instance = new StreamElementsAPIV1());
        }
        
        return instance;
    }
    
    private StreamElementsAPIV1() {
        Thread.setDefaultUncaughtExceptionHandler(com.gmt2001.UncaughtExceptionHandler.instance());
    }
    
    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }
    
    
}
